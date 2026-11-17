import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { build, preview } from "vite";
import { JSDOM } from "jsdom";
import { INTERNAL_ROUTE_PREFIXES, isInternalRoute } from "../src/lib/internalRoutes.mjs";
import { internalHtml, internalHtmlAsset, internalSeoPlugin } from "./lib/internalSeo.mjs";
import { SITE_URL, buildSitemapXml, validateSitemap } from "./lib/sitemap.mjs";

const publicRoutes = ["/", "/about", "/contact", "/services", "/services/google-ads", "/industries/hospitals", "/portfolio", "/blog", "/blog/best-practices-for-running-facebook-campaigns", "/social-media-marketing", "/services/graphic-design/social-media-design"];
const internalRoutes = [
  "/social_desk", "/social_desk/", "/social_desk/login", "/social_desk/reset-password", "/social_desk/clients",
  "/internal/quote-tool/myadmin", "/internal/quote-tool/myadmin/", "/internal/quote-tool/myadmin/index.html",
  "/dm_quotation_maker-myadmin", "/dm_quotation_maker-myadmin/index.html",
  "/finance-management-system/fms/login", "/finance-management-system/fms/praavi-internal/admin",
  "/finance-management-system/fms/praavi-internal/finance-team", "/finance-management-system/fms/praavi-internal/app/index.html",
  "/finance-management-system/fms/praavi-internal/app", "/finance-management-system/fms/praavi-internal/app/",
  "/finance-management-system/fms/praavi-internal/app/dashboard",
  "/diwali-wishes", "/diwali-wishes/", "/diwali-wishes/index.html",
  "/digital_marketing_team/login", "/digital_marketing_team/reports", "/my_praavi_consultant_pc_admin_yes/login",
];
const parseHead = (html) => new JSDOM(html.split(/<\/head\s*>/i)[0] + "</head></html>");
const assertNoindex = (html, expected) => {
  const dom = parseHead(html);
  try {
    const robots = [...dom.window.document.querySelectorAll('meta[name="robots"]')];
    assert.equal(robots.length, expected ? 1 : 0);
    if (expected) assert.equal(robots[0].content, "noindex, nofollow");
  } finally { dom.window.close(); }
};
let fixtureRoot;
let previewServer;
let base;
const fixtureHtml = '<!doctype html><html><head><title>Public fixture</title></head><body><div id="root"></div></body></html>';
before(async () => {
  fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), "praavi-internal-seo-"));
  await fs.writeFile(path.join(fixtureRoot, "index.html"), fixtureHtml);
  await build({ root: fixtureRoot, configFile: false, publicDir: false, logLevel: "silent", plugins: [internalSeoPlugin()] });
  for (const route of internalRoutes) {
    const asset = internalHtmlAsset(route);
    if (asset === "internal-app.html") continue;
    await fs.mkdir(path.dirname(path.join(fixtureRoot, "dist", asset)), { recursive: true });
    await fs.writeFile(path.join(fixtureRoot, "dist", asset), internalHtml(fixtureHtml));
  }
  previewServer = await preview({ root: fixtureRoot, configFile: false, publicDir: false, logLevel: "silent", plugins: [internalSeoPlugin()], preview: { host: "127.0.0.1", port: 0 } });
  base = `http://127.0.0.1:${previewServer.httpServer.address().port}`;
});
after(async () => {
  if (previewServer) {
    previewServer.httpServer.closeAllConnections();
    await new Promise((resolve) => previewServer.httpServer.close(resolve));
  }
  if (fixtureRoot) {
    const target = path.resolve(fixtureRoot);
    assert.ok(target.startsWith(path.join(os.tmpdir(), "praavi-internal-seo-")));
    await fs.rm(target, { recursive: true, force: true });
  }
});

test("internal policy matches aliases and descendants without blocking similar public routes", () => {
  for (const route of internalRoutes) assert.equal(isInternalRoute(route), true, route);
  for (const route of [...publicRoutes, "/social_desk-news", "/admin-services", "/diwali-wishes-guide"]) assert.equal(isInternalRoute(route), false, route);
});

test("sitemap validation rejects internal entries even if accidentally supplied as expected URLs", () => {
  for (const route of INTERNAL_ROUTE_PREFIXES) {
    const entry = { loc: SITE_URL + route };
    assert.throws(() => validateSitemap(buildSitemapXml([entry]), [entry]), /Internal route/);
  }
});

test("all standalone tools ship robots meta in source HTML without running JavaScript", async () => {
  for (const file of ["internal/quote-tool/myadmin/index.html", "dm_quotation_maker-myadmin/index.html", "finance-management-system/fms/praavi-internal/app/index.html", "diwali-wishes/index.html"]) {
    assertNoindex(await fs.readFile("public/" + file, "utf8"), true);
  }
  assertNoindex(await fs.readFile("index.html", "utf8"), false);
});

test("built internal shell is distinct from the public shell and contains no prerendered records", async () => {
  assertNoindex(await fs.readFile(path.join(fixtureRoot, "dist/index.html"), "utf8"), false);
  const html = await fs.readFile(path.join(fixtureRoot, "dist/internal-app.html"), "utf8");
  assertNoindex(html, true);
  const dom = new JSDOM(html);
  try { assert.equal(dom.window.document.getElementById("root").childElementCount, 0); }
  finally { dom.window.close(); }
});

test("Vercel route model returns internal HTML/headers and leaves public routes indexable", async () => {
  const { routes } = JSON.parse(await fs.readFile("vercel.json", "utf8"));
  const files = new Set(["/internal-app.html", ...internalRoutes.map((route) => "/" + internalHtmlAsset(route))]);
  const resolve = (pathname) => {
    const headers = {};
    for (const rule of routes) {
      if (rule.handle === "filesystem") { if (files.has(pathname)) return { file: pathname, headers }; continue; }
      const match = new RegExp(`^(?:${rule.src})$`).exec(pathname);
      if (!match) continue;
      Object.assign(headers, rule.headers);
      if (rule.continue) continue;
      const destination = rule.dest?.replace(/\$(\d+)/g, (_token, n) => match[Number(n)] ?? "");
      if (rule.check && !files.has(destination)) continue;
      return { file: destination, headers };
    }
    return { headers };
  };
  for (const route of internalRoutes) {
    const response = resolve(route);
    assert.equal(response.headers["X-Robots-Tag"], "noindex, nofollow", route);
    assert.equal(response.file, "/" + internalHtmlAsset(route), route);
  }
  for (const route of publicRoutes) {
    const response = resolve(route);
    assert.equal(response.headers["X-Robots-Tag"], undefined, route);
    assert.equal(response.file, route === "/about" ? "/about.html" : "/", route);
  }
  assert.equal(resolve("/api/health").file, "/api/index.js");
});

test("preview HTTP HTML exposes noindex before JavaScript, including nested URLs and query strings", async () => {
  for (const route of internalRoutes) {
    const response = await fetch(base + route + "?audit=1");
    assert.equal(response.status, 200, route);
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow", route);
    assertNoindex(await response.text(), true);
  }
  for (const route of publicRoutes) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-robots-tag"), null);
    assertNoindex(await response.text(), false);
  }
});

test("generated sitemap retains public destinations and contains no internal route", async () => {
  const xml = await fs.readFile("public/sitemap.xml", "utf8");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  for (const url of urls) assert.equal(isInternalRoute(new URL(url).pathname), false);
  for (const route of publicRoutes.filter((route) => route !== "/")) assert.ok(urls.includes(SITE_URL + route), route);
  assert.ok(urls.includes(SITE_URL));
  assert.equal(new Set(urls).size, urls.length);
});

test("robots permits internal crawling to observe noindex and wishes rebuild retains its directive", async () => {
  const robots = await fs.readFile("public/robots.txt", "utf8");
  const disallowed = [...robots.matchAll(/^Disallow:\s*(\S+)/gm)].map((match) => match[1]);
  for (const route of internalRoutes) assert.equal(disallowed.some((prefix) => route.startsWith(prefix)), false);
  assert.ok(robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`));
  const source = await fs.readFile("scripts/build-diwali-wishes.mjs", "utf8");
  assert.equal((source.match(/name: "robots", content: "noindex, nofollow"/g) ?? []).length, 1);
});
