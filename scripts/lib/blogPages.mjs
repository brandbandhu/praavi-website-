import fs from "node:fs";
import path from "node:path";
import { createServer, loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";
import { JSDOM } from "jsdom";
import { resolveSupabaseConfig } from "../../src/lib/supabaseConfig.mjs";
import { blogEntry, checkIndexableEntries, fetchAllPublishedBlogs, SITE_URL } from "./sitemap.mjs";
import { builtAssetMarkup, builtAssetUrl } from "./aboutPage.mjs";

export const blogSlugFromPath = (pathname) => pathname.match(/^\/blog\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/)?.[1];
const safeJson = (value) => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);

// Compare the fresh complete dataset to the sitemap from this build. Never
// publish a partial collection or a stale seed article if either check fails.
export const selectBlogRows = (rows, indexableEntries, sitemapXml) => {
  const dom = new JSDOM(sitemapXml, { contentType: "application/xml" });
  let expected;
  try {
    expected = new Map([...dom.window.document.querySelectorAll("url")]
      .filter((node) => node.querySelector("loc")?.textContent.startsWith(`${SITE_URL}/blog/`))
      .map((node) => [node.querySelector("loc").textContent, node.querySelector("lastmod")?.textContent]));
  } finally { dom.window.close(); }
  const actual = new Map(indexableEntries.map((entry) => [entry.loc, entry.lastmod]));
  if (actual.size !== expected.size || [...expected].some(([loc, date]) => !actual.has(loc) || actual.get(loc) !== date)) {
    throw new Error("Published blogs changed or differ from the sitemap; rebuild before publishing");
  }
  const byUrl = new Map();
  for (const row of rows) {
    const entry = blogEntry(row);
    if (!entry || !actual.has(entry.loc)) continue;
    if (byUrl.has(entry.loc)) throw new Error(`Duplicate published blog slug: ${row.slug}`);
    if (![row.title, row.excerpt, row.content].every((value) => typeof value === "string" && value.trim())) throw new Error(`Incomplete published article: ${row.slug}`);
    byUrl.set(entry.loc, row);
  }
  if (byUrl.size !== expected.size) throw new Error("Missing complete published blog data; refusing partial prerender");
  return [...expected.keys()].map((loc) => byUrl.get(loc));
};

export const blogHtml = (template, { post, schema, markup }) => {
  const dom = new JSDOM(template);
  try {
    const { document: d } = dom.window;
    const defaults = {};
    for (const meta of d.head.querySelectorAll('meta[property^="og:"],meta[name^="twitter:"]')) {
      const key = meta.getAttribute("property") ?? meta.name;
      if (key !== "twitter:site") defaults[key] = meta.content;
    }
    d.title = `${post.title} | Praavi Blog`;
    for (const link of d.querySelectorAll("link[rel]")) if (link.rel.toLowerCase().split(/\s+/).includes("canonical")) link.remove();
    const canonical = d.createElement("link");
    canonical.rel = "canonical";
    canonical.href = `${SITE_URL}/blog/${post.slug}`;
    d.head.appendChild(canonical);
    let image;
    try {
      const url = new URL(schema.image);
      if (["https:", "http:"].includes(url.protocol) && !/\.svg$/i.test(url.pathname)) image = url.href;
    } catch { /* Match the existing client social-image rules. */ }
    for (const meta of d.head.querySelectorAll('meta[property^="og:image:"],meta[name="twitter:site"]')) meta.remove();
    for (const [attribute, key, value] of [
      ["name", "description", post.excerpt], ["property", "og:type", "article"],
      ["property", "og:title", post.title], ["property", "og:description", post.excerpt],
      ["property", "og:url", canonical.href], ["property", "og:image", image],
      ["property", "article:published_time", schema.datePublished],
      ["name", "twitter:card", image ? "summary_large_image" : "summary"],
      ["name", "twitter:title", post.title], ["name", "twitter:description", post.excerpt], ["name", "twitter:image", image],
    ]) {
      for (const old of d.head.querySelectorAll(`meta[name="${key}"],meta[property="${key}"]`)) old.remove();
      if (typeof value !== "string") continue;
      const meta = d.createElement("meta"); meta.setAttribute(attribute, key); meta.content = value; d.head.appendChild(meta);
    }
    for (const [id, type, value] of [["seo-json-ld", "application/ld+json", schema], ["blog-prerender-data", "application/json", post], ["seo-default-social", "application/json", defaults]]) {
      d.getElementById(id)?.remove();
      const script = d.createElement("script"); script.id = id; script.type = type; script.textContent = safeJson(value); d.head.appendChild(script);
    }
    const root = d.getElementById("root");
    if (!root) throw new Error("Blog prerender requires the existing React root");
    root.innerHTML = markup;
    return dom.serialize();
  } finally { dom.window.close(); }
};

const blogMiddleware = (server, preview) => async (req, res, next) => {
  let pathname;
  try { pathname = new URL(req.url ?? "/", "http://localhost").pathname; } catch { return next(); }
  const alias = pathname.match(/^\/blog\/([a-z0-9]+(?:-[a-z0-9]+)*)\.html$/)?.[1];
  if (alias) { res.statusCode = 308; res.setHeader("Location", `/blog/${alias}`); return res.end(); }
  const slug = blogSlugFromPath(pathname);
  if (!slug) return next();
  try {
    let html;
    if (preview) {
      const file = path.resolve(server.config.root, server.config.build.outDir, "blog", `${slug}.html`);
      if (!fs.existsSync(file)) return next();
      html = fs.readFileSync(file, "utf8");
    } else {
      const { fetchPublishedBlogPostBySlug, renderBlogPost } = await server.ssrLoadModule("/src/entry-blog.tsx");
      const post = await fetchPublishedBlogPostBySlug(slug);
      if (!post) return next();
      const template = await server.transformIndexHtml(pathname, fs.readFileSync(path.join(server.config.root, "index.html"), "utf8"));
      html = blogHtml(template, renderBlogPost(post));
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end(html);
  } catch (error) { next(error); }
};

export const blogPagesPlugin = () => {
  let config;
  return {
    name: "published-blog-prerender",
    configResolved(resolved) { config = resolved; },
    configureServer(server) { server.middlewares.use(blogMiddleware(server, false)); },
    configurePreviewServer(server) { server.middlewares.use(blogMiddleware(server, true)); },
    generateBundle: {
      order: "post",
      async handler(_options, bundle) {
        const template = bundle["index.html"];
        if (!template || template.type !== "asset") throw new Error("Missing blog HTML template");
        const { url, key } = resolveSupabaseConfig(loadEnv("production", config.root, "VITE_"));
        const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
        const rows = await fetchAllPublishedBlogs(client);
        const candidates = rows.map(blogEntry).filter(Boolean);
        const { included } = await checkIndexableEntries(candidates);
        const selected = selectBlogRows(rows, included, fs.readFileSync(path.join(config.root, "public/sitemap.xml"), "utf8"));
        const renderer = await createServer({ root: config.root, configFile: false, mode: "production", resolve: { alias: { "@": path.join(config.root, "src") } }, esbuild: { jsx: "automatic" }, server: { middlewareMode: true, hmr: false } });
        try {
          const { renderBlogRow } = await renderer.ssrLoadModule("/src/entry-blog.tsx");
          for (const row of selected) {
            const rendered = renderBlogRow(row);
            rendered.markup = builtAssetMarkup(rendered.markup, bundle);
            const logo = rendered.schema.publisher?.logo;
            if (logo?.url && new URL(logo.url).pathname.startsWith("/src/assets/")) logo.url = SITE_URL + builtAssetUrl(new URL(logo.url).pathname, bundle);
            this.emitFile({ type: "asset", fileName: `blog/${row.slug}.html`, source: blogHtml(String(template.source), rendered) });
          }
          config.logger.info(`Prerendered ${selected.length} complete published, indexable blog articles.`);
        } finally { await renderer.close(); }
      },
    },
  };
};
