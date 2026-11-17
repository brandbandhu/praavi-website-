import fs from "node:fs";
import path from "node:path";
import { createServer } from "vite";
import { JSDOM } from "jsdom";
import { ABOUT_SEO } from "../../src/lib/aboutSeo.mjs";

export const isAboutPath = (pathname) => pathname === "/about" || pathname === "/about/";

export const aboutHtml = (template, markup) => {
  const dom = new JSDOM(template);
  try {
    const { document } = dom.window;
    document.title = ABOUT_SEO.title;
    for (const link of document.querySelectorAll("link[rel]")) {
      if (link.rel.toLowerCase().split(/\s+/).includes("canonical")) link.remove();
    }
    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = ABOUT_SEO.canonicalUrl;
    document.head.appendChild(canonical);
    for (const [attribute, key, value] of [
      ["name", "description", ABOUT_SEO.description],
      ["property", "og:title", ABOUT_SEO.title],
      ["property", "og:description", ABOUT_SEO.description],
      ["property", "og:url", ABOUT_SEO.canonicalUrl],
      ["name", "twitter:title", ABOUT_SEO.title],
      ["name", "twitter:description", ABOUT_SEO.description],
    ]) {
      for (const old of document.head.querySelectorAll(`meta[name="${key}"],meta[property="${key}"]`)) old.remove();
      const meta = document.createElement("meta");
      meta.setAttribute(attribute, key);
      meta.content = value;
      document.head.appendChild(meta);
    }
    const root = document.getElementById("root");
    if (!root) throw new Error("About prerender requires the existing React root");
    root.innerHTML = markup;
    return dom.serialize();
  } finally { dom.window.close(); }
};

const aboutMiddleware = (server, preview) => async (req, res, next) => {
  let pathname;
  try { pathname = new URL(req.url ?? "/", "http://localhost").pathname; }
  catch { return next(); }
  if (pathname === "/about.html") {
    res.statusCode = 308;
    res.setHeader("Location", "/about");
    return res.end();
  }
  if (!isAboutPath(pathname)) return next();
  try {
    let html;
    if (preview) html = fs.readFileSync(path.resolve(server.config.root, server.config.build.outDir, "about.html"), "utf8");
    else {
      const { renderAbout } = await server.ssrLoadModule("/src/entry-about.tsx");
      const template = await server.transformIndexHtml(pathname, fs.readFileSync(path.join(server.config.root, "index.html"), "utf8"));
      html = aboutHtml(template, renderAbout());
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(html);
  } catch (error) { next(error); }
};

// Resolve SSR's source image URLs to the assets emitted by this same build.
export const builtAssetUrl = (source, bundle) => {
  source = decodeURI(source);
  const asset = Object.values(bundle).find((entry) => entry.type === "asset" && (
    entry.originalFileNames?.includes(source.slice(1)) || entry.names?.includes(path.basename(source)) || entry.name === path.basename(source)
  ));
  if (!asset) throw new Error(`Missing built About asset: ${source}`);
  return `/${asset.fileName}`;
};
export const builtAssetMarkup = (markup, bundle) => markup.replace(/\b(src|href)="(\/src\/assets\/[^"?]+)(?:\?[^\"]*)?"/g, (_match, attribute, source) => `${attribute}="${builtAssetUrl(source, bundle)}"`);

export const aboutPagePlugin = () => {
  let config;
  return {
    name: "about-page-prerender",
    configResolved(resolved) { config = resolved; },
    configureServer(server) { server.middlewares.use(aboutMiddleware(server, false)); },
    configurePreviewServer(server) { server.middlewares.use(aboutMiddleware(server, true)); },
    generateBundle: {
      order: "post",
      async handler(_options, bundle) {
        const entry = bundle["index.html"];
        if (!entry || entry.type !== "asset") throw new Error("Missing HTML template for About prerender");
        const renderer = await createServer({
          root: config.root, configFile: false, mode: "production",
          resolve: { alias: { "@": path.join(config.root, "src") } },
          esbuild: { jsx: "automatic" },
          server: { middlewareMode: true, hmr: false },
        });
        try {
          const { renderAbout } = await renderer.ssrLoadModule("/src/entry-about.tsx");
          const markup = builtAssetMarkup(renderAbout(), bundle);
          this.emitFile({ type: "asset", fileName: "about.html", source: aboutHtml(String(entry.source), markup) });
        } finally { await renderer.close(); }
      },
    },
  };
};
