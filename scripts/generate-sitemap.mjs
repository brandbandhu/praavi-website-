import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const SITE_URL = (process.env.SITE_URL || "https://www.praaviconsultants.in").replace(/\/+$/, "");
const TODAY = new Date().toISOString().slice(0, 10);

const staticRoutes = [
  "/",
  "/about",
  "/blog",
  "/career",
  "/clients",
  "/contact",
  "/june-offer",
  "/portfolio",
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
  "/website-development",
];

const routePriority = new Map([
  ["/", "1.0"],
  ["/services", "0.9"],
  ["/contact", "0.9"],
  ["/june-offer", "0.9"],
  ["/blog", "0.8"],
  ["/career", "0.8"],
]);

const routeChangeFreq = new Map([
  ["/", "weekly"],
  ["/services", "weekly"],
  ["/blog", "weekly"],
  ["/career", "weekly"],
  ["/contact", "monthly"],
  ["/june-offer", "monthly"],
]);

const getSubServiceRoutes = async () => {
  const filePath = path.join(projectRoot, "src", "lib", "subServicePages.ts");
  const file = await readFile(filePath, "utf8");
  const matches = file.matchAll(/"([a-z0-9-]+\/[a-z0-9-]+)":\s*buildContent/g);
  return [...new Set(Array.from(matches, ([, slug]) => `/services/${slug}`))];
};

const getSeedBlogRoutes = async () => {
  const filePath = path.join(projectRoot, "src", "lib", "blogStore.ts");
  const file = await readFile(filePath, "utf8");
  const matches = file.matchAll(/slug:\s*"([a-z0-9-]+)"/g);
  return [...new Set(Array.from(matches, ([, slug]) => `/blog/${slug}`))];
};

const buildUrlNode = (route) => {
  const loc = `${SITE_URL}${route === "/" ? "" : route}`;
  const changefreq = routeChangeFreq.get(route) || "monthly";
  const priority = routePriority.get(route) || "0.7";
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    `    <lastmod>${TODAY}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
};

const buildSitemapXml = (routes) => {
  const urlNodes = routes.map(buildUrlNode).join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlNodes,
    "</urlset>",
    "",
  ].join("\n");
};

const main = async () => {
  const [subServiceRoutes, seedBlogRoutes] = await Promise.all([getSubServiceRoutes(), getSeedBlogRoutes()]);
  const routes = [...new Set([...staticRoutes, ...subServiceRoutes, ...seedBlogRoutes])].sort();
  const sitemapXml = buildSitemapXml(routes);
  const sitemapPath = path.join(projectRoot, "public", "sitemap.xml");

  await writeFile(sitemapPath, sitemapXml, "utf8");
  console.log(`Sitemap generated: ${routes.length} URLs -> ${sitemapPath}`);
};

main().catch((error) => {
  console.error("Failed to generate sitemap.", error);
  process.exitCode = 1;
});
