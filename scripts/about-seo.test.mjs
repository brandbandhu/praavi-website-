import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createServer, preview } from "vite";
import { JSDOM } from "jsdom";
import { ABOUT_SEO } from "../src/lib/aboutSeo.mjs";
import { aboutHtml, aboutPagePlugin, isAboutPath } from "./lib/aboutPage.mjs";

let renderer;
let previewServer;
let fixtureRoot;
let markup;
let template;
let base;
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  assert.equal(new URL(input instanceof Request ? input.url : input).hostname, "127.0.0.1", "About rendering must not fetch external data");
  return originalFetch(input, init);
};
before(async () => {
  renderer = await createServer({ root: process.cwd(), configFile: false, mode: "production", resolve: { alias: { "@": path.resolve("src") } }, esbuild: { jsx: "automatic" }, server: { middlewareMode: true, hmr: false } });
  const entry = await renderer.ssrLoadModule("/src/entry-about.tsx");
  markup = entry.renderAbout();
  template = await fs.readFile("index.html", "utf8");
  fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), "praavi-about-seo-"));
  await fs.mkdir(path.join(fixtureRoot, "dist"));
  await fs.writeFile(path.join(fixtureRoot, "dist/index.html"), template);
  await fs.writeFile(path.join(fixtureRoot, "dist/about.html"), aboutHtml(template, markup));
  previewServer = await preview({ root: fixtureRoot, configFile: false, logLevel: "silent", plugins: [aboutPagePlugin()], preview: { host: "127.0.0.1", port: 0 } });
  base = `http://127.0.0.1:${previewServer.httpServer.address().port}`;
});
after(async () => {
  if (previewServer) {
    previewServer.httpServer.closeAllConnections();
    await new Promise((resolve) => previewServer.httpServer.close(resolve));
  }
  if (renderer) await renderer.close();
  globalThis.fetch = originalFetch;
  if (fixtureRoot) {
    assert.ok(path.resolve(fixtureRoot).startsWith(path.join(os.tmpdir(), "praavi-about-seo-")));
    await fs.rm(fixtureRoot, { recursive: true, force: true });
  }
});

const assertAbout = (html) => {
  const dom = new JSDOM(html);
  try {
    const d = dom.window.document;
    assert.equal(d.title, ABOUT_SEO.title);
    assert.deepEqual([...d.querySelectorAll('link[rel="canonical"]')].map((link) => link.href), [ABOUT_SEO.canonicalUrl]);
    assert.equal(d.querySelectorAll('meta[name="description"]').length, 1);
    assert.equal(d.querySelector('meta[name="description"]').content, ABOUT_SEO.description);
    assert.equal(d.querySelectorAll("h1").length, 1);
    assert.equal(d.querySelector("h1").textContent.trim(), "Promote With Us");
    assert.ok(d.querySelector("main").textContent.includes("Core Values"));
    assert.ok(d.querySelector("main").textContent.includes("Client-First"));
    assert.ok(![...d.querySelectorAll('meta[name="robots"]')].some((meta) => /noindex/i.test(meta.content)));
  } finally { dom.window.close(); }
};

test("initial About HTML contains one self canonical, unique metadata and the real public H1/content", () => {
  const html = aboutHtml(template, markup);
  assertAbout(html);
  const home = new JSDOM(template);
  try { assert.notEqual(home.window.document.title, ABOUT_SEO.title); }
  finally { home.window.close(); }
});

test("About metadata replaces duplicate/home/non-www canonicals without changing the shared public template", () => {
  const duplicate = template.replace("</head>", '<link rel="canonical" href="https://www.praaviconsultants.in/"><link rel="CANONICAL" href="https://praaviconsultants.in/about"><meta name="description" content="duplicate"></head>');
  assertAbout(aboutHtml(duplicate, markup));
  assert.ok(!template.includes(ABOUT_SEO.canonicalUrl));
});

test("raw About HTTP aliases/query URLs return self canonical without JavaScript or homepage redirects", async () => {
  for (const route of ["/about", "/about/", "/about?utm_source=fixture"]) {
    const response = await fetch(base + route, { redirect: "manual" });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("location"), null);
    assert.equal(response.headers.get("x-robots-tag"), null);
    assertAbout(await response.text());
  }
  const response = await fetch(base + "/about.html", { redirect: "manual" });
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "/about");
});

test("Vercel serves the About artifact before SPA fallback and canonicalizes its artifact alias", async () => {
  const { routes } = JSON.parse(await fs.readFile("vercel.json", "utf8"));
  const ruleFor = (route) => routes.find((rule) => rule.src && new RegExp(`^(?:${rule.src})$`).test(route) && !rule.continue);
  for (const route of ["/about", "/about/"]) assert.equal(ruleFor(route).dest, "/about.html");
  assert.equal(ruleFor("/about.html").status, 308);
  assert.equal(ruleFor("/about.html").headers.Location, "/about");
  assert.equal(isAboutPath("/about-us"), false);
  assert.equal(ruleFor("/contact").dest, "/public-pages/$1.html");
  assert.equal(ruleFor("/contact").check, true);
});

test("About stays in the canonical sitemap and its component's existing visible content is retained", async () => {
  const sitemap = await fs.readFile("public/sitemap.xml", "utf8");
  assert.equal((sitemap.match(/<loc>https:\/\/www\.praaviconsultants\.in\/about<\/loc>/g) ?? []).length, 1);
  const homeSource = await fs.readFile("src/pages/Index.tsx", "utf8");
  assert.ok(homeSource.includes("We Build Websites, Generate Leads &amp; Scale Businesses") || homeSource.includes("We Build Websites, Generate Leads & Scale Businesses"));
  assert.ok(!homeSource.includes("Our <span className=\"gradient-text\">Core Values"));
});
