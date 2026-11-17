import fs from "node:fs";
import path from "node:path";
import { createServer } from "vite";
import { JSDOM } from "jsdom";
import { builtAssetMarkup } from "./aboutPage.mjs";
import { SITE_URL } from "./sitemap.mjs";
import { isInternalRoute } from "../../src/lib/internalRoutes.mjs";

export const PUBLIC_ALIASES = {
  "/services/website-development": "/website-development",
  "/services/seo": "/seo-services",
  "/services/social-media-management": "/social-media-marketing",
  "/services/social-media-marketing": "/social-media-marketing",
};
export const publicPaths = (xml) => {
  const dom = new JSDOM(xml, { contentType: "application/xml" });
  try {
    return [...dom.window.document.querySelectorAll("loc")].map(n => new URL(n.textContent)).map(url => {
      if (url.origin !== SITE_URL || isInternalRoute(url.pathname)) throw new Error("Invalid public sitemap URL");
      return url.pathname;
    }).filter(p => !p.startsWith("/blog/") && p !== "/about" && p !== "/june-offer");
  } finally { dom.window.close(); }
};
export const publicAsset = pathname => pathname === "/" ? "index.html" : `public-pages${pathname}.html`;
const safeJson = value => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
export const routeData = (pathname, data) => {
  if (pathname === "/portfolio") return { portfolio: data.portfolio };
  if (pathname === "/clients") return { clients: data.clients };
  if (pathname === "/case-studies") return { caseStudies: data.caseStudies };
  if (pathname === "/career") return { jobs: data.jobs };
  if (pathname === "/blog") return { blogs: data.blogs };
  return {};
};
export const publicHtml = (template, { seo, markup }, pathname, data = {}) => {
  const dom = new JSDOM(template);
  try {
    const d = dom.window.document;
    const expected = PUBLIC_ALIASES[pathname] ?? pathname;
    if (!seo.title?.trim() || !seo.description?.trim() || seo.canonicalPath !== expected) throw new Error(`Incorrect public metadata: ${pathname}`);
    d.title = seo.title;
    const defaults = {};
    for (const m of d.querySelectorAll('meta[property^="og:"],meta[name^="twitter:"]')) {
      const key = m.getAttribute("property") ?? m.name;
      if (key !== "twitter:site") defaults[key] = m.content;
    }
    for (const link of d.querySelectorAll("link[rel]")) if (link.rel.toLowerCase().split(/\s+/).includes("canonical")) link.remove();
    for (const m of d.querySelectorAll('meta[property^="og:"],meta[name^="og:"],meta[name^="twitter:"],meta[property^="twitter:"],meta[property^="article:"],meta[name="description"]')) m.remove();
    const canonical = d.createElement("link"); canonical.rel = "canonical"; canonical.href = SITE_URL + (expected === "/" ? "" : expected); d.head.appendChild(canonical);
    const image = seo.ogImage === null ? undefined : new URL(seo.ogImage ?? "/preview-img.png?v=20260714", SITE_URL).href;
    for (const [key, value] of Object.entries({ description: seo.description, "og:type": "website", "og:title": seo.ogTitle ?? seo.title, "og:description": seo.ogDescription ?? seo.description, "og:url": canonical.href, "og:image": image, "twitter:card": image ? "summary_large_image" : "summary", "twitter:title": seo.ogTitle ?? seo.title, "twitter:description": seo.ogDescription ?? seo.description, "twitter:image": image })) {
      if (value === undefined) continue;
      const meta = d.createElement("meta"); meta.setAttribute(key.startsWith("og:") ? "property" : "name", key); meta.content = value; d.head.appendChild(meta);
    }
    for (const [id, type, value] of [["seo-json-ld", "application/ld+json", seo.schema], ["seo-default-social", "application/json", defaults], ["public-prerender-data", "application/json", { pathname, data }]]) {
      d.getElementById(id)?.remove();
      if (!value) continue;
      const script = d.createElement("script"); script.id = id; script.type = type; script.textContent = safeJson(value); d.head.appendChild(script);
    }
    const root = d.getElementById("root");
    if (!root) throw new Error("Missing public React root");
    root.innerHTML = markup;
    if (root.querySelectorAll("h1").length !== 1 || root.querySelector("h1").textContent.trim().length < 3 || root.textContent.trim().length < 200) throw new Error(`Missing unique H1 or meaningful content: ${pathname}`);
    if ([...d.querySelectorAll('meta[name="robots"]')].some(m => /noindex/i.test(m.content))) throw new Error(`Public page unexpectedly noindex: ${pathname}`);
    return dom.serialize();
  } finally { dom.window.close(); }
};

export const publicPagesPlugin = () => {
  let config;
  return {
    name: "public-page-prerender",
    configResolved(resolved) { config = resolved; },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url ?? "/", "http://localhost").pathname.replace(/\/$/, "") || "/";
        if (isInternalRoute(pathname) || !/^\/(?:[a-z0-9-]+\/)*[a-z0-9-]*$/.test(pathname)) return next();
        const file = path.join(server.config.root, server.config.build.outDir, publicAsset(pathname));
        if (!fs.existsSync(file)) return next();
        res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end(fs.readFileSync(file, "utf8"));
      });
    },
    generateBundle: {
      order: "post",
      async handler(_options, bundle) {
        const template = String(bundle["index.html"].source);
        const paths = [...publicPaths(fs.readFileSync(path.join(config.root, "public/sitemap.xml"), "utf8")), ...Object.keys(PUBLIC_ALIASES)];
        const renderer = await createServer({ root: config.root, configFile: false, mode: "production", resolve: { alias: { "@": path.join(config.root, "src") } }, esbuild: { jsx: "automatic" }, server: { middlewareMode: true, hmr: false } });
        try {
          const { renderPublic, loadPublicData } = await renderer.ssrLoadModule("/src/entry-public.tsx");
          const data = await loadPublicData();
          const titles = new Set(), descriptions = new Set();
          let home;
          for (const pathname of paths) {
            const snapshot = routeData(pathname, data);
            const rendered = renderPublic(pathname, snapshot);
            rendered.markup = builtAssetMarkup(rendered.markup, bundle);
            if (!PUBLIC_ALIASES[pathname]) {
              if (titles.has(rendered.seo.title) || descriptions.has(rendered.seo.description)) throw new Error(`Duplicate public metadata: ${pathname}`);
              titles.add(rendered.seo.title); descriptions.add(rendered.seo.description);
            }
            const html = publicHtml(template, rendered, pathname, snapshot);
            if (pathname === "/") home = html;
            else this.emitFile({ type: "asset", fileName: publicAsset(pathname), source: html });
          }
          // Run last: About, blog and internal shells must retain the original template.
          bundle["index.html"].source = home;
          config.logger.info(`Prerendered ${paths.length} public routes including canonical aliases using published public data.`);
        } finally { await renderer.close(); }
      },
    },
  };
};
