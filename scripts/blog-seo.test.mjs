import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createServer, preview } from "vite";
import { JSDOM } from "jsdom";
import { blogHtml, blogPagesPlugin, blogSlugFromPath, selectBlogRows } from "./lib/blogPages.mjs";
import { blogEntry, buildSitemapXml, SITE_URL } from "./lib/sitemap.mjs";

const slugs = ["facebook-vs-instagram-ads-which-one-works-better", "how-to-create-viral-content-on-instagram-reels", "how-to-choose-the-perfect-domain-name-for-your-business"];
const titles = ["Facebook vs Instagram Ads: Which One Works Better?", "How to Create Viral Content on Instagram Reels", "How to Choose the Perfect Domain Name for Your Business"];
const rows = slugs.map((slug, i) => ({ id: String(i + 1), slug, title: titles[i], excerpt: `Distinct fixture description ${i + 1}`, content: `Article ${i + 1} introduction\n1. First section\nUnique paragraph ${i + 1}`, category: "Marketing", read_time: "5 min read", image_url: "https://media.praaviconsultants.in/uploads/blogs/fixture.webp", status: "published", published_at: "2026-05-22T11:34:34.481Z" }));
let renderer, server, fixtureRoot, base, renderRow, template;
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  assert.equal(new URL(input instanceof Request ? input.url : input).hostname, "127.0.0.1", "fixture tests must not fetch live data");
  return originalFetch(input, init);
};
before(async () => {
  renderer = await createServer({ root: process.cwd(), configFile: false, mode: "production", resolve: { alias: { "@": path.resolve("src") } }, esbuild: { jsx: "automatic" }, server: { middlewareMode: true, hmr: false } });
  renderRow = (await renderer.ssrLoadModule("/src/entry-blog.tsx")).renderBlogRow;
  template = await fs.readFile("index.html", "utf8");
  fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), "praavi-blog-seo-"));
  await fs.mkdir(path.join(fixtureRoot, "dist/blog"), { recursive: true });
  await fs.writeFile(path.join(fixtureRoot, "dist/index.html"), template);
  for (const row of rows) await fs.writeFile(path.join(fixtureRoot, "dist/blog", row.slug + ".html"), blogHtml(template, renderRow(row)));
  server = await preview({ root: fixtureRoot, configFile: false, logLevel: "silent", plugins: [blogPagesPlugin()], preview: { host: "127.0.0.1", port: 0 } });
  base = `http://127.0.0.1:${server.httpServer.address().port}`;
});
after(async () => {
  if (server) { server.httpServer.closeAllConnections(); await new Promise((resolve) => server.httpServer.close(resolve)); }
  if (renderer) await renderer.close();
  globalThis.fetch = originalFetch;
  if (fixtureRoot) { assert.ok(path.resolve(fixtureRoot).startsWith(path.join(os.tmpdir(), "praavi-blog-seo-"))); await fs.rm(fixtureRoot, { recursive: true, force: true }); }
});
const inspect = (html, row) => {
  const dom = new JSDOM(html);
  try {
    const d = dom.window.document;
    assert.deepEqual([...d.querySelectorAll('link[rel="canonical"]')].map((link) => link.href), [`${SITE_URL}/blog/${row.slug}`]);
    assert.equal(d.title, row.title + " | Praavi Blog");
    assert.equal(d.querySelector('meta[name="description"]').content, row.excerpt);
    assert.equal(d.querySelectorAll("h1").length, 1);
    assert.equal(d.querySelector("h1").textContent, row.title);
    assert.equal(d.querySelector("h2").textContent, "1. First section");
    assert.ok(d.querySelector("article").textContent.includes(`Unique paragraph ${Number(row.id)}`));
    assert.equal(d.querySelectorAll('script[type="application/ld+json"]').length, 1);
    const schema = JSON.parse(d.getElementById("seo-json-ld").textContent);
    assert.equal(schema.headline, row.title);
    assert.equal(schema.mainEntityOfPage["@id"], `${SITE_URL}/blog/${row.slug}`);
    assert.equal(schema.datePublished, row.published_at);
    assert.equal(schema.author.name, "Praavi Consultants");
    assert.equal(schema.publisher.name, "Praavi Consultants");
    assert.equal(schema.dateModified, undefined);
    for (const key of ["og:type", "og:title", "og:description", "og:url", "og:image"]) assert.equal(d.querySelectorAll(`meta[property="${key}"]`).length, 1);
    assert.equal(d.querySelector('meta[property="og:type"]').content, "article");
    assert.equal(d.querySelector('meta[property="article:published_time"]').content, row.published_at);
    assert.equal(d.querySelectorAll('meta[name="twitter:card"]').length, 1);
    assert.equal(d.querySelector('meta[name="twitter:card"]').content, "summary_large_image");
    assert.equal(d.querySelector('meta[name="twitter:title"]').content, row.title);
    assert.equal(d.querySelector('meta[name="twitter:site"]'), null);
    assert.equal(JSON.parse(d.getElementById("blog-prerender-data").textContent).content, row.content);
  } finally { dom.window.close(); }
};

test("all three blog HTML responses contain real rendered content and one canonical/schema/social set", () => {
  for (const row of rows) inspect(blogHtml(template, renderRow(row)), row);
});
test("blog metadata replaces homepage and duplicate canonical/description values", () => {
  const duplicate = template.replace("</head>", '<link rel="canonical" href="https://praaviconsultants.in/"><link rel="canonical" href="https://www.praaviconsultants.in/"><meta name="description" content="wrong"></head>');
  inspect(blogHtml(duplicate, renderRow(rows[0])), rows[0]);
});
test("article payload/schema JSON is escaped without changing content or injecting scripts", () => {
  const row = { ...rows[0], content: '</script><script id="injected">bad()</script>\n1. First section\nUnique paragraph 1' };
  const html = blogHtml(template, renderRow(row));
  const dom = new JSDOM(html);
  try {
    assert.equal(dom.window.document.getElementById("injected"), null);
    assert.equal(JSON.parse(dom.window.document.getElementById("blog-prerender-data").textContent).content, row.content);
    assert.ok(dom.window.document.querySelector("article").textContent.includes(row.content.split("\n")[0]));
  } finally { dom.window.close(); }
});
test("published rendering fails on missing/duplicate/incomplete data and sitemap drift", () => {
  const entries = rows.map(blogEntry);
  const xml = buildSitemapXml(entries);
  assert.deepEqual(selectBlogRows(rows, entries, xml), rows);
  assert.throws(() => selectBlogRows(rows.slice(1), entries, xml), /Missing complete/);
  assert.throws(() => selectBlogRows([...rows, rows[0]], entries, xml), /Duplicate/);
  assert.throws(() => selectBlogRows([{ ...rows[0], content: "" }, ...rows.slice(1)], entries, xml), /Incomplete/);
  assert.throws(() => selectBlogRows(rows, entries.slice(1), xml), /differ from the sitemap/);
  assert.throws(() => selectBlogRows([{ ...rows[0], status: "draft" }, ...rows.slice(1)], entries, xml), /Missing complete/);
});
test("raw HTTP aliases/query variants expose article metadata; unknown routes retain SPA fallback", async () => {
  for (const row of rows) {
    for (const suffix of ["", "/", "?utm_source=fixture"]) {
      const response = await fetch(base + "/blog/" + row.slug + suffix, { redirect: "manual" });
      assert.equal(response.status, 200); inspect(await response.text(), row);
    }
    const alias = await fetch(base + "/blog/" + row.slug + ".html", { redirect: "manual" });
    assert.equal(alias.status, 308); assert.equal(alias.headers.get("location"), "/blog/" + row.slug);
  }
  const unknown = await fetch(base + "/blog/not-an-existing-post");
  assert.equal(unknown.status, 200);
  assert.equal((await unknown.text()).includes("blog-prerender-data"), false);
  assert.equal(blogSlugFromPath("/blog/../admin"), undefined);
});
test("Vercel checks for generated article files and preserves fallback/API/About routing", async () => {
  const { routes } = JSON.parse(await fs.readFile("vercel.json", "utf8"));
  const files = new Set(rows.map((row) => `/blog/${row.slug}.html`));
  const resolve = (route) => {
    for (const rule of routes) {
      if (!rule.src || rule.continue) continue;
      const match = new RegExp(`^(?:${rule.src})$`).exec(route); if (!match) continue;
      const destination = rule.dest?.replace(/\$(\d+)/g, (_token, n) => match[Number(n)] ?? "");
      if (rule.check && !files.has(destination)) continue;
      return { ...rule, destination };
    }
  };
  for (const row of rows) { assert.equal(resolve("/blog/" + row.slug).destination, `/blog/${row.slug}.html`); assert.equal(resolve("/blog/" + row.slug + "/").check, true); }
  assert.equal(resolve("/blog/not-an-existing-post").destination, "/");
  assert.equal(resolve("/api/health").destination, "/api/index.js");
  assert.equal(resolve("/about").destination, "/about.html");
});
test("all three real article URLs remain in the production sitemap", async () => {
  const xml = await fs.readFile("public/sitemap.xml", "utf8");
  for (const slug of slugs) assert.equal((xml.match(new RegExp(`<loc>${SITE_URL}/blog/${slug}</loc>`, "g")) ?? []).length, 1);
});

test("prerendered inline links are crawler-visible while raw HTML and unsafe destinations stay text", () => {
  const row = { ...rows[0], content: 'Article 1 introduction\n1. First section\nUnique paragraph 1: [SEO services](/seo-services) and [reference](https://developers.google.com/search/docs/appearance/page-experience).\n2. Further [website details](/website-development)\n<script>bad()</script> [unsafe](javascript:alert(1))' };
  const html = blogHtml(template, renderRow(row));
  inspect(html, row);
  const dom = new JSDOM(html);
  try {
    const body = dom.window.document.querySelector("article .space-y-3");
    assert.deepEqual([...body.querySelectorAll("a")].map(a => a.getAttribute("href")), ["/seo-services", "https://developers.google.com/search/docs/appearance/page-experience", "/website-development"]);
    assert.equal(body.querySelectorAll("script").length, 0);
    assert(body.textContent.includes("[unsafe](javascript:alert(1))"));
    assert.equal(body.querySelectorAll("h2").length, 2);
  } finally { dom.window.close(); }
});

test("three prepared corrections prerender with working links and original publication instants; hosting stays excluded", async () => {
  const review = JSON.parse(await fs.readFile("docs/editorial-review/blog-corrections-records.json", "utf8"));
  const complete = review.records.filter(r => r.proposal.kind === "complete_editorial_draft");
  assert.equal(complete.length, 3);
  assert.equal(review.approved, false);
  const files = await fs.readdir("docs/editorial-review/publishing");
  assert.deepEqual(files.sort(), complete.map(r => r.before.slug + ".content.txt").sort());
  assert(!files.some(f => f.includes("hosting")));
  for (const record of complete) {
    const content = await fs.readFile(`docs/editorial-review/publishing/${record.before.slug}.content.txt`, "utf8");
    assert(!/^#{1,6}\s/m.test(content), "Prepared bodies must not contain Markdown block headings or a second H1");
    const row = { ...rows[0], id: record.record_id, slug: record.before.slug, title: record.proposal.title, excerpt: record.proposal.excerpt, content, published_at: record.before.published_at };
    const dom = new JSDOM(blogHtml(template, renderRow(row)));
    try {
      const d = dom.window.document;
      const body = d.querySelector("article .space-y-3");
      assert.equal(d.querySelectorAll("h1").length, 1);
      assert.equal(d.querySelector("h1").textContent, record.proposal.h1);
      assert.deepEqual([...body.querySelectorAll("h2")].map(n => n.textContent), record.proposal.h2_headings);
      const markdownLinks = [...content.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)];
      const anchors = [...body.querySelectorAll("a")];
      assert.equal(anchors.length, markdownLinks.length);
      markdownLinks.forEach((match, i) => { assert.equal(anchors[i].textContent, match[1]); assert.equal(anchors[i].getAttribute("href"), match[2]); });
      assert.equal(d.querySelector('link[rel="canonical"]').href, `${SITE_URL}/blog/${record.before.slug}`);
      assert.equal(JSON.parse(d.getElementById("seo-json-ld").textContent).datePublished, new Date(record.before.published_at).toISOString());
    } finally { dom.window.close(); }
  }
});
