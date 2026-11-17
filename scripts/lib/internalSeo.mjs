import fs from "node:fs";
import path from "node:path";
import { isInternalRoute } from "../../src/lib/internalRoutes.mjs";

export const INTERNAL_ROBOTS_META = '<meta name="robots" content="noindex, nofollow" data-internal-robots="true" />';
export const internalHtml = (html) => html
  .replace(/<meta\b(?=[^>]*\bname\s*=\s*["']robots["'])[^>]*>/gi, "")
  .replace(/<head\b[^>]*>/i, (head) => `${head}\n    ${INTERNAL_ROBOTS_META}`);

export const internalHtmlAsset = (pathname) => {
  for (const prefix of [
    "/internal/quote-tool/myadmin", "/dm_quotation_maker-myadmin",
    "/diwali-wishes", "/finance-management-system/fms/praavi-internal/app",
  ]) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return `${prefix.slice(1)}/index.html`;
  }
  return "internal-app.html";
};

// Vercel serves the same assets via explicit rewrites. Keep local dev/preview
// responses equivalent so viewing source needs no JavaScript to see noindex.
const internalMiddleware = (server, preview) => async (req, res, next) => {
  let pathname;
  try { pathname = new URL(req.url ?? "/", "http://localhost").pathname; }
  catch { return next(); }
  if (!isInternalRoute(pathname)) return next();
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  if (/\.(?:js|mjs|css|map|json|png|jpg|jpeg|webp|svg|ico|mp3|woff2?|txt)$/i.test(pathname)) return next();
  try {
    const asset = internalHtmlAsset(pathname);
    const base = preview ? path.resolve(server.config.root, server.config.build.outDir) : path.join(server.config.root, "public");
    let html;
    if (!preview && asset === "internal-app.html") {
      html = await server.transformIndexHtml(pathname, fs.readFileSync(path.join(server.config.root, "index.html"), "utf8"));
    } else html = fs.readFileSync(path.join(base, asset), "utf8");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(internalHtml(html));
  } catch (error) { next(error); }
};

export const internalSeoPlugin = () => ({
  name: "internal-route-seo",
  configureServer(server) { server.middlewares.use(internalMiddleware(server, false)); },
  configurePreviewServer(server) { server.middlewares.use(internalMiddleware(server, true)); },
  generateBundle: {
    order: "post",
    handler(_options, bundle) {
      const entry = bundle["index.html"];
      if (!entry || entry.type !== "asset") throw new Error("Missing public HTML entry for internal SEO shell");
      this.emitFile({ type: "asset", fileName: "internal-app.html", source: internalHtml(String(entry.source)) });
    },
  },
});
