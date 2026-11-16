import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SITE_URL, blogEntry, buildSitemapXml, canonicalLocation, checkIndexableEntries, fetchAllPublishedBlogs, pageExclusion, sourceDate, validateSitemap } from "./lib/sitemap.mjs";
import { resolveSupabaseConfig } from "../src/lib/supabaseConfig.mjs";

const published = (id, extra = {}) => ({ id: String(id), status: "published", slug: `article-${id}`, published_at: "2026-06-29T04:54:42.780+00:00", ...extra });
const htmlResponse = (status = 200, headers = {}) => new Response("", { status, headers: { "content-type": "text/html; charset=utf-8", ...headers } });
const clientFor = (pages) => {
  const ranges = [];
  let call = 0;
  const client = {
    from(table) {
      assert.equal(table, "blog_posts");
      const query = {
        select(columns, options) { assert.equal(columns, "*"); assert.equal(options.count, "exact"); return query; },
        eq(field, value) { assert.equal(field, "status"); assert.equal(value, "published"); return query; },
        order(field, options) { assert.equal(field, "id"); assert.equal(options.ascending, true); return query; },
        range(from, to) { ranges.push([from, to]); return query; },
        async abortSignal() { assert.ok(call < pages.length, "Unexpected pagination request"); return pages[call++]; },
      };
      return query;
    },
  };
  return { client, ranges };
};

test("reads every API page beyond the default 1,000 row cap with deterministic ordering", async () => {
  const rows = Array.from({ length: 1001 }, (_, i) => published(i));
  const pages = Array.from({ length: 11 }, (_, page) => ({ data: rows.slice(page * 100, (page + 1) * 100), count: rows.length, error: null }));
  const { client, ranges } = clientFor(pages);
  assert.deepEqual(await fetchAllPublishedBlogs(client), rows);
  assert.deepEqual(ranges.at(-1), [1000, 1099]);
});

test("refuses partial, failed, changing or uncounted API responses without a seed fallback", async () => {
  const first = { data: [published(1), published(2)], count: 3 };
  for (const pages of [
    [{ data: [published(1)], count: 3 }],
    [first, { data: [], count: 3 }],
    [first, { data: [published(3)], count: 4 }],
    [{ data: [], count: null }],
    [{ error: { message: "API unavailable" }, data: null, count: null }],
    [first, { error: { message: "second page unavailable" } }],
    [first, { data: [published(1)], count: 3 }],
  ]) {
    await assert.rejects(fetchAllPublishedBlogs(clientFor(pages).client, 2));
  }
  assert.deepEqual(await fetchAllPublishedBlogs(clientFor([{ data: [], count: 0 }]).client), []);
});

test("excludes drafts, deleted, redirected, noindex, noncanonical and malformed blog records", () => {
  for (const extra of [
    { status: "draft" }, { status: "deleted" }, { deleted_at: "2026-07-01" },
    { deleted: true }, { noindex: true }, { indexable: false }, { is_indexable: false },
    { robots: "noindex, follow" }, { redirect_to: "/other" }, { redirect_url: "/other" },
    { canonical_url: "https://example.com/blog/article-1" }, { canonical_path: "/blog/other" },
    { canonical_url: "https://[" },
    ...["", "../admin", "article?a=b", "article#fragment", "https://example.com", "a/b", "a&b", " space "].map((slug) => ({ slug })),
  ]) assert.equal(blogEntry(published(1, extra)), undefined, JSON.stringify(extra));
  assert.equal(blogEntry(published(1, { canonical_path: "/blog/article-1" })).loc, `${SITE_URL}/blog/article-1`);
});

test("uses genuine modified or published timestamps and omits absent or impossible dates", () => {
  assert.equal(blogEntry(published(1, { updated_at: "2026-07-30T10:20:00+05:30" })).lastmod, "2026-07-30T04:50:00.000Z");
  assert.equal(blogEntry(published(1, { updated_at: "bad" })).lastmod, "2026-06-29T04:54:42.780Z");
  assert.equal(blogEntry(published(1, { published_at: null, created_at: "2026-06-29" })).lastmod, undefined);
  for (const date of [undefined, "today", "2026-02-30", "Jun 29, 2026", "2026-06-29T12:00:00"]) assert.equal(sourceDate(date), undefined);
  assert.equal(sourceDate("2026-06-29"), "2026-06-29");
  assert.ok(!buildSitemapXml([{ loc: SITE_URL }]).includes("lastmod"));
});

test("rejects invalid origins, noncanonical paths, fragments and query strings", () => {
  for (const route of ["//example.com", "/about/", "/../about", "/blog/post?x=1", "/blog/post#top", "http://example.com"]) assert.throws(() => canonicalLocation(route));
  for (const loc of ["http://www.praaviconsultants.in/about", "https://praaviconsultants.in/about", "https://example.com/about", `${SITE_URL}/about?x=1`, `${SITE_URL}/about#top`, `${SITE_URL}/about/`]) {
    assert.throws(() => validateSitemap(buildSitemapXml([{ loc }]), [{ loc }]));
  }
});

test("detects missing published articles, including the three reported URLs", () => {
  const slugs = ["best-practices-for-running-facebook-campaigns", "the-future-of-voice-search-in-marketing", "zero-click-searches-how-to-stay-visible"];
  const entries = slugs.map((slug, id) => blogEntry(published(id, { slug })));
  assert.equal(validateSitemap(buildSitemapXml(entries), entries), 3);
  for (const entry of entries) assert.throws(() => validateSitemap(buildSitemapXml(entries.filter((other) => other !== entry)), entries), /Missing published/);
});

test("validates XML namespace, uniqueness, expected entries and timestamp provenance", () => {
  const entry = blogEntry(published(1));
  const xml = buildSitemapXml([entry]);
  assert.equal(validateSitemap(xml, [entry]), 1);
  assert.throws(() => validateSitemap("<not-xml", []));
  assert.throws(() => validateSitemap(xml.replace("http://www.sitemaps.org/schemas/sitemap/0.9", "https://example.com"), [entry]));
  assert.throws(() => validateSitemap(buildSitemapXml([entry, entry]), [entry]), /Duplicate/);
  assert.throws(() => validateSitemap(xml, []), /Unexpected/);
  assert.throws(() => validateSitemap(xml.replace(entry.lastmod, "2026-11-16"), [entry]), /Unverified lastmod/);
});

test("checks redirects, noindex directives, canonical mismatches and missing pages", () => {
  const loc = `${SITE_URL}/blog/article-1`;
  for (const status of [301, 302, 307, 308, 404, 410]) assert.ok(pageExclusion(loc, htmlResponse(status), ""));
  assert.ok(pageExclusion(loc, htmlResponse(200, { "x-robots-tag": "noindex" }), ""));
  assert.ok(pageExclusion(loc, htmlResponse(), '<head><meta name="robots" content="noindex,follow"></head>'));
  assert.ok(pageExclusion(loc, htmlResponse(), '<head><link rel="canonical" href="/blog/other"></head>'));
  assert.ok(pageExclusion(loc, htmlResponse(), '<head><link rel="canonical" href="https://["></head>'));
  assert.equal(pageExclusion(loc, htmlResponse(), '<head><link rel="canonical" href="/blog/article-1"><meta name="robots" content="index,follow"></head>'), undefined);
  assert.throws(() => pageExclusion(loc, htmlResponse(503), ""), /Cannot verify/);
});

test("checks every candidate and fails on network errors instead of silently dropping URLs", async () => {
  const entries = [1, 2, 3].map((id) => blogEntry(published(id)));
  const seen = [];
  const result = await checkIndexableEntries(entries, async (url, options) => {
    seen.push(url); assert.equal(options.redirect, "manual");
    return htmlResponse(url.endsWith("article-2") ? 301 : 200);
  });
  assert.equal(seen.length, 3);
  assert.equal(result.included.length, 2);
  assert.equal(result.excluded.length, 1);
  await assert.rejects(checkIndexableEntries(entries, async () => { throw new Error("offline"); }), /offline/);
});

test("shares SPA configuration and honors production environment overrides", () => {
  assert.equal(resolveSupabaseConfig({}).url, "https://dcnfmxzppqighroqtzgm.supabase.co");
  assert.deepEqual(resolveSupabaseConfig({ VITE_SUPABASE_URL: ' "https://test.supabase.co/" ', VITE_SUPABASE_PUBLISHABLE_KEY: "public-test-key" }), { url: "https://test.supabase.co", key: "public-test-key" });
});

test("robots points to the correct production sitemap and hosting serves files before the SPA fallback", async () => {
  const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
  assert.ok(robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`));
  const hosting = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  const filesystem = hosting.routes.findIndex((route) => route.handle === "filesystem");
  assert.ok(filesystem >= 0 && filesystem < hosting.routes.findIndex((route) => route.src === "/(.*)"));
});
