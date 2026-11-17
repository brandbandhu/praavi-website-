import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { publicAsset, PUBLIC_ALIASES } from "./lib/publicPages.mjs";
import { isInternalRoute } from "../src/lib/internalRoutes.mjs";
import { isPublicPagePath, PREFERRED_ORIGIN } from "../src/lib/publicUrl.mjs";

// Inspect shipped HTML without executing scripts. This is also the release gate.
export const checkPublicSeo = (root = "dist") => {
  const xml = new JSDOM(fs.readFileSync(path.join(root, "sitemap.xml"), "utf8"), { contentType: "application/xml" });
  let urls;
  try { urls = [...xml.window.document.querySelectorAll("loc")].map(n => n.textContent); }
  finally { xml.window.close(); }
  if (!urls.length || new Set(urls).size !== urls.length) throw new Error("Missing or duplicate sitemap URLs");
  const paths = new Set(urls.map(url => new URL(url).pathname));
  const titles = new Set(), descriptions = new Set(), linked = new Set(), broken = new Set();
  const asset = p => p.startsWith("/blog/") ? `${p.slice(1)}.html` : p === "/about" ? "about.html" : p === "/june-offer" ? "june-offer/index.html" : publicAsset(p);
  let articles = 0;
  for (const url of urls) {
    const parsed = new URL(url), pathname = parsed.pathname;
    if (parsed.origin !== "https://www.praaviconsultants.in" || isInternalRoute(pathname) || (pathname !== "/" && pathname.endsWith("/"))) throw new Error(`Invalid public URL: ${url}`);
    const html = fs.readFileSync(path.join(root, asset(pathname)), "utf8");
    const dom = new JSDOM(html);
    try {
      const d = dom.window.document;
      const links = [...d.querySelectorAll('link[rel="canonical"]')];
      if (links.length !== 1 || new URL(links[0].href).href !== parsed.href) throw new Error(`Incorrect canonical: ${pathname}`);
      const meta = [...d.querySelectorAll('meta[name="description"]')];
      if (!d.title.trim() || meta.length !== 1 || !meta[0].content.trim()) throw new Error(`Missing metadata: ${pathname}`);
      if (!pathname.startsWith("/blog/")) {
        if (titles.has(d.title) || descriptions.has(meta[0].content)) throw new Error(`Duplicate public metadata: ${pathname}`);
        titles.add(d.title); descriptions.add(meta[0].content);
      }
      if (d.querySelectorAll("h1").length !== 1 || !d.querySelector("h1").textContent.trim() || (d.querySelector("main")?.textContent.trim().length ?? 0) < 200) throw new Error(`Missing public content: ${pathname}`);
      if ([...d.querySelectorAll('meta[name="robots"]')].some(m => /noindex|none/i.test(m.content))) throw new Error(`Unexpected noindex: ${pathname}`);
      for (const key of ["og:type", "og:title", "og:description", "og:url", "twitter:title", "twitter:description", "twitter:card"]) if (d.querySelectorAll(`meta[property="${key}"],meta[name="${key}"]`).length !== 1) throw new Error(`Missing or duplicate ${key}: ${pathname}`);
      const schemas = [...d.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent));
      if (pathname.startsWith("/blog/")) {
        articles++;
        if (schemas.filter(s => s["@type"] === "BlogPosting").length !== 1 || d.querySelector('meta[property="og:type"]').content !== "article") throw new Error(`Lost article SEO: ${pathname}`);
      } else if (d.querySelector('meta[property="og:type"]').content !== "website") throw new Error(`Incorrect public social type: ${pathname}`);
      if (d.querySelector('meta[name="twitter:site"]')) throw new Error(`Unverified X handle: ${pathname}`);
      for (const a of d.querySelectorAll("a[href]")) {
        const target = new URL(a.getAttribute("href"), parsed);
        if (["praaviconsultants.in", "www.praaviconsultants.in"].includes(target.hostname) && isPublicPagePath(target.pathname)) {
          if (target.origin !== PREFERRED_ORIGIN || (target.pathname !== "/" && target.pathname.endsWith("/")) || PUBLIC_ALIASES[target.pathname]) throw new Error(`Noncanonical internal page link on ${pathname}: ${target.pathname}`);
        }
        if (target.origin !== parsed.origin) continue;
        linked.add(target.pathname);
        if (target.pathname === pathname && target.hash && !d.getElementById(decodeURIComponent(target.hash.slice(1)))) broken.add(`${pathname}${target.hash}`);
        if (!paths.has(target.pathname) && !PUBLIC_ALIASES[target.pathname] && !isInternalRoute(target.pathname) && !fs.existsSync(path.join(root, target.pathname.slice(1)))) broken.add(target.pathname);
      }
      for (const img of d.querySelectorAll('img[src^="/"]')) {
        const src = new URL(img.getAttribute("src"), parsed).pathname;
        if (!fs.existsSync(path.join(root, decodeURI(src).slice(1)))) throw new Error(`Missing initial image: ${src} on ${pathname}`);
      }
    } finally { dom.window.close(); }
  }
  if (broken.size) throw new Error(`Broken public internal links: ${[...broken].join(", ")}`);
  const orphans = [...paths].filter(p => !linked.has(p));
  if (orphans.length) throw new Error(`Unlinked sitemap routes: ${orphans.join(", ")}`);
  const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
  if (!/^Sitemap: https:\/\/www\.praaviconsultants\.in\/sitemap\.xml$/m.test(robots)) throw new Error("Incorrect robots sitemap reference");
  return { urls: urls.length, articles, publicPages: urls.length - articles, brokenInternalLinks: 0, orphanPages: 0 };
};
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log("Public SEO artifact checks passed:", JSON.stringify(checkPublicSeo())); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
