import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";
import { resolveSupabaseConfig } from "../src/lib/supabaseConfig.mjs";
import { SITE_URL, blogEntry, buildSitemapXml, canonicalLocation, checkIndexableEntries, fetchAllPublishedBlogs, validateSitemap } from "./lib/sitemap.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const staticRoutes = [
  "/",
  "/about",
  "/ai-solutions",
  "/blog",
  "/case-studies",
  "/career",
  "/clients",
  "/contact",
  "/diwali-wishes",
  "/industries/hospitals",
  "/industries/manufacturers",
  "/industries/real-estate",
  "/industries/schools",
  "/industries/solar-companies",
  "/industries/travel-agencies",
  "/june-offer",
  "/portfolio",
  "/pune/ecommerce-development-pune",
  "/pune/google-ads-agency-pune",
  "/pune/seo-company-pune",
  "/pune/shopify-development-pune",
  "/pune/social-media-marketing-pune",
  "/pune/website-development-company-pune",
  "/services",
  "/services/digital-marketing",
  "/services/google-ads",
  "/services/google-ads/app-ads",
  "/services/google-ads/display-ads",
  "/services/google-ads/performance-max-ads",
  "/services/google-ads/search-ads",
  "/services/google-ads/shopping-ads",
  "/services/google-ads/video-ads",
  "/services/graphic-design",
  "/services/shopify-development",
  "/services/social-ads/facebook-ads",
  "/social-media-marketing",
  "/seo-services",
  "/team",
  "/website-development",
];

const getSubServiceRoutes = async () => {
  const filePath = path.join(projectRoot, "src", "lib", "subServicePages.ts");
  const file = await readFile(filePath, "utf8");
  const matches = file.matchAll(/"([a-z0-9-]+\/[a-z0-9-]+)":\s*buildContent/g);
  return [...new Set(Array.from(matches, ([, slug]) => `/services/${slug}`))];
};

const main = async () => {
  const { url, key } = resolveSupabaseConfig(loadEnv("production", projectRoot, "VITE_"));
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const [subServiceRoutes, blogs, robots] = await Promise.all([
    getSubServiceRoutes(), fetchAllPublishedBlogs(client),
    readFile(path.join(projectRoot, "public", "robots.txt"), "utf8"),
  ]);
  if (!robots.split(/\r?\n/).some((line) => line.trim() === `Sitemap: ${SITE_URL}/sitemap.xml`)) {
    throw new Error("robots.txt does not reference the canonical sitemap");
  }
  const candidates = new Map();
  for (const route of [...staticRoutes, ...subServiceRoutes]) {
    const loc = canonicalLocation(route);
    candidates.set(loc, { loc });
  }
  for (const row of blogs) {
    const entry = blogEntry(row);
    if (!entry) {
      console.log("Excluded blog record " + row.id + ": unpublished, invalid or non-indexable metadata");
      continue;
    }
    const previous = candidates.get(entry.loc);
    if (!previous || (entry.lastmod && (!previous.lastmod || entry.lastmod > previous.lastmod))) candidates.set(entry.loc, entry);
  }
  const { included, excluded } = await checkIndexableEntries([...candidates.values()]);
  for (const entry of excluded) console.log("Excluded " + entry.loc + ": " + entry.reason);
  const sitemapXml = buildSitemapXml(included);
  const count = validateSitemap(sitemapXml, included);
  const sitemapPath = path.join(projectRoot, "public", "sitemap.xml");
  await writeFile(sitemapPath, sitemapXml, "utf8");
  const blogCount = included.filter((entry) => new URL(entry.loc).pathname.startsWith("/blog/")).length;
  console.log("Sitemap generated: " + count + " URLs (" + blogCount + " blog, " + (count - blogCount) + " static/service); complete source: " + blogs.length + " published records -> " + sitemapPath);
};

main().catch((error) => {
  console.error("Failed to generate sitemap; no partial or fallback sitemap was written:", error.message);
  process.exitCode = 1;
});
