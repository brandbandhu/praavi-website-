import { JSDOM } from "jsdom";

export const SITE_URL = "https://www.praaviconsultants.in";
const XML_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9";
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const sourceDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) return undefined;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  const day = value.slice(0, 10);
  if (new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day) return undefined;
  return value.length === 10 ? value : date.toISOString();
};

export const canonicalLocation = (route) => {
  if (typeof route !== "string" || !/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/.test(route)) {
    throw new Error(`Invalid sitemap route: ${String(route)}`);
  }
  return `${SITE_URL}${route === "/" ? "" : route}`;
};

// Every page must agree with the exact count. Missing pages or count changes fail
// the build rather than publishing an incomplete sitemap or a seed fallback.
export const fetchAllPublishedBlogs = async (client, pageSize = 100) => {
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error("Invalid blog page size");
  const rows = [];
  const ids = new Set();
  let total;
  do {
    const { data, error, count } = await client.from("blog_posts")
      .select("*", { count: "exact" })
      .eq("status", "published")
      .order("id", { ascending: true })
      .range(rows.length, rows.length + pageSize - 1)
      .abortSignal(AbortSignal.timeout(30000));
    if (error) throw new Error(`Could not fetch published blogs: ${error.message}`);
    if (!Number.isInteger(count) || count < 0 || !Array.isArray(data)) throw new Error("Blog API did not return an exact count and rows");
    if (total !== undefined && total !== count) throw new Error("Published blog count changed during pagination; retry the build");
    total = count;
    if (data.length !== Math.min(pageSize, total - rows.length)) throw new Error("Incomplete published blog page; refusing a partial sitemap");
    for (const row of data) {
      if (!row.id || ids.has(row.id)) throw new Error("Missing or repeated blog ID during pagination");
      ids.add(row.id);
      rows.push(row);
    }
  } while (rows.length < total);
  return rows;
};

export const blogEntry = (row) => {
  if (row.status !== "published" || !SLUG.test(row.slug ?? "")) return undefined;
  if (row.deleted_at || row.deleted === true || row.noindex === true || row.indexable === false || row.is_indexable === false || row.redirect_to || row.redirect_url) return undefined;
  if (/(?:^|[\s,])(?:noindex|none)(?:$|[\s,])/i.test(row.robots ?? "")) return undefined;
  const loc = canonicalLocation(`/blog/${row.slug}`);
  const declaredCanonical = row.canonical_url ?? row.canonical_path;
  try {
    if (declaredCanonical && new URL(declaredCanonical, SITE_URL).href !== loc) return undefined;
  } catch {
    return undefined;
  }
  return { loc, lastmod: sourceDate(row.updated_at) ?? sourceDate(row.published_at) };
};

const noindex = (value) => /\b(?:noindex|none)\b/i.test(value ?? "");

export const pageExclusion = (loc, response, html) => {
  if (response.status >= 300 && response.status < 400) return `HTTP ${response.status} redirect`;
  if ([404, 410].includes(response.status)) return `HTTP ${response.status}`;
  if (response.status !== 200) throw new Error(`Cannot verify indexability: ${loc} returned HTTP ${response.status}`);
  if (!response.headers.get("content-type")?.includes("text/html")) throw new Error(`Expected HTML at ${loc}`);
  if (noindex(response.headers.get("x-robots-tag"))) return "X-Robots-Tag noindex";
  // Parse only the head; scripts are never executed and remote resources are not loaded.
  const dom = new JSDOM(html.split(/<\/head\s*>/i)[0] + "</head></html>");
  try {
    const { document } = dom.window;
    for (const meta of document.querySelectorAll("meta[name]")) {
      if (["robots", "googlebot", "bingbot"].includes(meta.name.toLowerCase()) && noindex(meta.content)) return "robots meta noindex";
    }
    for (const link of document.querySelectorAll('link[rel~="canonical"][href]')) {
      let canonical;
      try {
        canonical = new URL(link.getAttribute("href"), loc);
      } catch {
        return "invalid canonical URL";
      }
      if ((canonical.pathname === "/" ? canonical.origin : canonical.href) !== loc) return "different canonical URL";
    }
  } finally {
    dom.window.close();
  }
  return undefined;
};

export const checkIndexableEntries = async (entries, fetchPage = fetch, concurrency = 6) => {
  const included = [];
  const excluded = [];
  let cursor = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (cursor < entries.length) {
      const entry = entries[cursor++];
      const response = await fetchPage(entry.loc, { redirect: "manual", signal: AbortSignal.timeout(20000) });
      const reason = pageExclusion(entry.loc, response, await response.text());
      if (reason) excluded.push({ loc: entry.loc, reason });
      else included.push(entry);
    }
  }));
  return { included: included.sort((a, b) => a.loc.localeCompare(b.loc)), excluded };
};

const escapeXml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]);

export const buildSitemapXml = (entries) => [
  '<?xml version="1.0" encoding="UTF-8"?>',
  `<urlset xmlns="${XML_NAMESPACE}">`,
  ...entries.map(({ loc, lastmod }) => [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    ...(lastmod ? [`    <lastmod>${escapeXml(lastmod)}</lastmod>`] : []),
    "  </url>",
  ].join("\n")),
  "</urlset>",
  "",
].join("\n");

export const validateSitemap = (xml, expectedEntries) => {
  const dom = new JSDOM(xml, { contentType: "application/xml" });
  try {
    const { document } = dom.window;
    if (document.documentElement.localName !== "urlset" || document.documentElement.namespaceURI !== XML_NAMESPACE) throw new Error("Invalid sitemap namespace or root");
    const expected = new Map(expectedEntries.map((entry) => [entry.loc, entry.lastmod]));
    const found = new Set();
    for (const node of document.documentElement.children) {
      if (node.localName !== "url" || node.querySelectorAll("loc").length !== 1) throw new Error("Invalid sitemap URL entry");
      const loc = node.querySelector("loc").textContent;
      const url = new URL(loc);
      const route = url.pathname;
      if (url.origin !== SITE_URL || url.search || url.hash || canonicalLocation(route) !== loc) throw new Error(`Invalid sitemap URL: ${loc}`);
      if (found.has(loc)) throw new Error(`Duplicate sitemap URL: ${loc}`);
      if (!expected.has(loc)) throw new Error(`Unexpected sitemap URL: ${loc}`);
      const dates = node.querySelectorAll("lastmod");
      if (dates.length > 1 || (dates.length && (!sourceDate(dates[0].textContent) || dates[0].textContent !== expected.get(loc)))) throw new Error(`Unverified lastmod: ${loc}`);
      if (!dates.length && expected.get(loc)) throw new Error(`Missing source lastmod: ${loc}`);
      found.add(loc);
    }
    for (const loc of expected.keys()) if (!found.has(loc)) throw new Error(`Missing published or static URL: ${loc}`);
    return found.size;
  } finally {
    dom.window.close();
  }
};
