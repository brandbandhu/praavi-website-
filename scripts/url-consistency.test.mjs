import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createServer } from "vite";
import { JSDOM } from "jsdom";
import { publicRedirect, isPublicPagePath, PREFERRED_ORIGIN } from "../src/lib/publicUrl.mjs";
import { PUBLIC_ALIASES } from "./lib/publicPages.mjs";

const sitemap = fs.readFileSync("public/sitemap.xml", "utf8");
const dom = new JSDOM(sitemap, { contentType: "application/xml" });
const urls = [...dom.window.document.querySelectorAll("loc")].map(n => n.textContent);
dom.window.close();
const deployment = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
const matched = pathname => deployment.proxy.matcher.some(m => m.endsWith("/:path*") ? pathname === m.slice(0, -7) || pathname.startsWith(m.slice(0, -7) + "/") : pathname === m);
let renderer, proxy, server, origin;
before(async () => {
  renderer = await createServer({ configFile: false, resolve: { alias: { "@": path.resolve("src") } }, server: { middlewareMode: true, hmr: false } });
  ({ default: proxy } = await renderer.ssrLoadModule("/proxy.ts"));
  server = http.createServer(async (req, res) => {
    const response = proxy(new Request(`https://${req.headers.host}${req.url}`, { method: req.method }));
    if (!response.headers.has("x-middleware-next")) {
      res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(); return;
    }
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ path: req.url, method: req.method, body: Buffer.concat(chunks).toString() }));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { server?.closeAllConnections(); await new Promise(resolve => server?.close(resolve)); await renderer?.close(); });

test("every public sitemap variant consolidates host and trailing slash in one permanent redirect", () => {
  assert.equal(urls.length, 167);
  const query = "?utm_source=seo%20audit&tag=one&tag=two&next=https%3A%2F%2Fexample.com%2Fa%3Fx%3D1&plus=a+b&encoded=%2f%26%3D&empty=";
  for (const entry of urls) {
    const canonical = new URL(entry).href;
    const pathname = new URL(entry).pathname;
    assert(isPublicPagePath(pathname), pathname); assert(matched(pathname), pathname);
    for (const method of ["GET", "HEAD"]) {
      assert.equal(publicRedirect(canonical + query, method), null);
      for (const protocol of ["http:", "https:"]) {
        for (const trailing of [false, true]) {
          const variant = `${protocol}//praaviconsultants.in${pathname}${trailing && pathname !== "/" ? "/" : ""}${query}`;
          assert.equal(publicRedirect(variant, method), canonical + query, variant);
        }
      }
      if (pathname !== "/") assert.equal(publicRedirect(canonical + "/" + query, method), canonical + query);
      assert.equal(publicRedirect(`http://www.praaviconsultants.in${pathname}${query}`, method), canonical + query);
    }
  }
});

test("canonical destinations terminate immediately without redirect loops; existing alias paths survive", () => {
  for (const entry of urls) {
    const target = publicRedirect(entry.replace("www.", "") + "?ref=one");
    assert.equal(publicRedirect(target), null);
  }
  for (const alias of Object.keys(PUBLIC_ALIASES)) assert.equal(publicRedirect(`https://praaviconsultants.in${alias}/?source=link`), `${PREFERRED_ORIGIN}${alias}?source=link`);
});

test("preview and localhost stay isolated from production while removing trailing slashes", () => {
  for (const origin of ["https://preview-branch.vercel.app", "http://localhost:8080", "http://127.0.0.1:4189"]) {
    assert.equal(publicRedirect(origin + "/contact/"), origin + "/contact");
    assert.equal(publicRedirect(origin + "/contact"), null);
  }
});

test("API, uploads, static assets and internal tools bypass both deployment matcher and redirect logic", () => {
  for (const p of ["/api", "/api/", "/api/uploads/images", "/api/uploads/images/", "/api/upload.php", "/api/auth/login", "/api/quotations", "/api%2Fuploads", "/API/uploads/images", "/social_desk", "/internal/quote-tool/myadmin", "/finance-management-system/fms/login", "/dm_quotation_maker-myadmin", "/diwali-wishes", "/digital_marketing_team", "/my_praavi_consultant_pc_admin_yes/login", "/admin", "/assets/index.js", "/uploads/blogs/file.webp", "/storage/v1/object", "/june-offer/assets/index.js"]) {
    // Nested standalone app assets can match its prefix, but must always pass through.
    if (!p.startsWith("/june-offer/assets/")) assert(!matched(p), p);
    for (const method of ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
      assert.equal(publicRedirect(`https://praaviconsultants.in${p}?file=one`, method), null, `${method} ${p}`);
      assert.equal(proxy(new Request(`https://praaviconsultants.in${p}?file=one`, { method })).headers.get("x-middleware-next"), "1");
    }
  }
  assert(deployment.routes.some(r => r.src === "/api/(.*)" && r.dest === "/api/index.js"));
});

test("unsafe methods do not redirect or read bodies, including public forms and upload requests", () => {
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const request = { url: "https://praaviconsultants.in/contact/?from=form", method, get body() { throw new Error("Body must remain untouched"); } };
    assert.equal(proxy(request).headers.get("x-middleware-next"), "1");
  }
});

test("actual HTTP responses preserve raw query bytes and keep POST and preflight bodies on the original route", async () => {
  const query = "?utm_source=a+b&tag=one&tag=two&encoded=%2f%26%3D&empty=";
  const request = (pathname, method, body) => new Promise((resolve, reject) => {
    const req = http.request(origin + pathname, { method, headers: { Host: "praaviconsultants.in", ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}) } }, res => {
      const chunks = []; res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => resolve({ status: res.statusCode, location: res.headers.location, body: Buffer.concat(chunks).toString() }));
    });
    req.on("error", reject); req.end(body);
  });
  for (const method of ["GET", "HEAD"]) {
    const response = await request(`/about/${query}`, method);
    assert.equal(response.status, 308);
    assert.equal(response.location, `${PREFERRED_ORIGIN}/about${query}`);
  }
  for (const method of ["POST", "OPTIONS"]) {
    const response = await request(`/api/uploads/images/${query}`, method, "synthetic multipart body");
    assert.equal(response.status, 200);
    assert.equal(response.location, undefined);
    assert.deepEqual(JSON.parse(response.body), { path: `/api/uploads/images/${query}`, method, body: "synthetic multipart body" });
  }
});

test("query strings cannot choose a redirect host, inject headers or change the article path", () => {
  const p = "/blog/facebook-vs-instagram-ads-which-one-works-better";
  const query = "?next=//evil.example&Location=https://evil.example&x=%0d%0aLocation%3Aevil";
  const target = publicRedirect(`https://praaviconsultants.in${p}/${query}`);
  assert.equal(target, PREFERRED_ORIGIN + p + query);
  assert.equal(new URL(target).origin, PREFERRED_ORIGIN);
  assert(!/[\r\n]/.test(target));
  assert.equal(publicRedirect("invalid URL"), null);
  assert.equal(publicRedirect("ftp://praaviconsultants.in/about/"), null);
});

test("Vercel proxy configuration pins the Node runtime and leaves the existing route table intact", async () => {
  assert.equal(deployment.proxy.entrypoint, "proxy.ts");
  const module = await renderer.ssrLoadModule("/proxy.ts");
  assert.equal(module.config.runtime, "nodejs");
  assert(!fs.readFileSync("proxy.ts", "utf8").includes("process.env"));
  for (const route of urls) assert(matched(new URL(route).pathname));
});
