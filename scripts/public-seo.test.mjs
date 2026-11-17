import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createServer } from "vite";
import { JSDOM } from "jsdom";
import { publicHtml, publicPaths, publicAsset, PUBLIC_ALIASES, routeData } from "./lib/publicPages.mjs";
import { isInternalRoute } from "../src/lib/internalRoutes.mjs";

let renderer, renderPublic;
const template = fs.readFileSync("index.html", "utf8");
const xml = fs.readFileSync("public/sitemap.xml", "utf8");
const paths = publicPaths(xml);
const fixtures = { portfolio: [], clients: [], caseStudies: [], jobs: [], blogs: [] };
before(async () => {
  renderer = await createServer({ configFile: false, mode: "production", resolve: { alias: { "@": path.resolve("src") } }, esbuild: { jsx: "automatic" }, server: { middlewareMode: true, hmr: false } });
  ({ renderPublic } = await renderer.ssrLoadModule("/src/entry-public.tsx"));
});
after(async () => { await renderer?.close(); });

const priorityDocument = pathname => new JSDOM(publicHtml(template, renderPublic(pathname, routeData(pathname, fixtures)), pathname));

test("priority pages expose distinct Pune targeting in initial title, description, H1 and social metadata", () => {
  const descriptions = new Set();
  for (const [pathname, heading] of [["/", "Digital Marketing Agency in Pune"], ["/website-development", "Website Development Company in Pune"], ["/seo-services", "SEO Company in Pune"]]) {
    const dom = priorityDocument(pathname);
    try {
      const d = dom.window.document;
      const title = `${heading} | Praavi Consultants`;
      assert.equal(d.title, title);
      assert.equal(d.querySelectorAll("h1").length, 1);
      assert.equal(d.querySelector("h1").textContent, heading);
      const description = d.querySelector('meta[name="description"]').content;
      assert(description.length > 80 && description.includes("Pune"));
      assert(!descriptions.has(description)); descriptions.add(description);
      assert.equal(d.querySelector('link[rel="canonical"]').href, new URL(pathname, "https://www.praaviconsultants.in").href);
      for (const key of ["og:title", "twitter:title"]) assert.equal(d.querySelector(`meta[property="${key}"],meta[name="${key}"]`).content, title);
      for (const key of ["og:description", "twitter:description"]) assert.equal(d.querySelector(`meta[property="${key}"],meta[name="${key}"]`).content, description);
    } finally { dom.window.close(); }
  }
});

test("priority pages link contextually to existing services and published supporting articles", () => {
  const targets = {
    "/": ["/services", "/website-development", "/seo-services", "/blog/how-to-choose-the-right-web-development-company", "/blog/on-page-seo-vs-off-page-seo-complete-guide"],
    "/website-development": ["/", "/seo-services", "/blog/website-development-process-from-idea-to-launch"],
    "/seo-services": ["/", "/website-development", "/blog/on-page-seo-vs-off-page-seo-complete-guide"],
  };
  for (const [pathname, expected] of Object.entries(targets)) {
    const dom = priorityDocument(pathname);
    try {
      const links = [...dom.window.document.querySelectorAll("main a[href]")];
      for (const target of expected) {
        assert(links.some(a => a.getAttribute("href") === target), `${pathname} missing ${target}`);
        assert(xml.includes(`https://www.praaviconsultants.in${target === "/" ? "" : target}</loc>`), `Unpublished link target: ${target}`);
      }
      if (pathname === "/") {
        for (const a of links) assert(!/best digital marketing agency|top digital marketing company near me/i.test(a.textContent), "Misleading homepage anchor remains");
      }
    } finally { dom.window.close(); }
  }
});

test("CTA labels reach the action they promise without changing contact forms", () => {
  for (const [pathname, label, href] of [["/seo-services", "Call Now", "tel:+919699369117"], ["/website-development", "Discuss Your Website Project", "/contact"], ["/services/digital-marketing", "See Case Studies", "/case-studies"]]) {
    const dom = priorityDocument(pathname);
    try {
      const d = dom.window.document;
      const link = [...d.querySelectorAll("main a")].find(a => a.textContent.trim() === label);
      assert(link, `${pathname}: missing ${label}`);
      assert.equal(link.getAttribute("href"), href);
      assert.equal(d.querySelectorAll("main form").length, 1);
      if (pathname === "/seo-services") assert(fs.readFileSync("src/pages/Contact.tsx", "utf8").includes("+91 9699369117"), "Call number must match the existing public contact number");
    } finally { dom.window.close(); }
  }
});

test("priority copy preserves the existing section/card layouts and homepage organization schema", () => {
  for (const [pathname, sections, cards] of [["/", 11, 12], ["/website-development", 4, 13], ["/seo-services", 5, 12]]) {
    const dom = priorityDocument(pathname);
    try {
      const d = dom.window.document;
      assert.equal(d.querySelectorAll("main section").length, sections);
      assert.equal(d.querySelectorAll("main article.service-card").length, cards);
      if (pathname === "/") {
        const schema = JSON.parse(d.getElementById("seo-json-ld").textContent);
        assert.equal(schema["@type"], "Organization");
        assert.equal(schema.address.addressLocality, "Pune");
        assert.equal(schema.telephone, "+91-9699369117");
        assert(!schema.review && !schema.aggregateRating);
      }
    } finally { dom.window.close(); }
  }
});

test("service copy explains delivery, review and support without the former stuffed homepage wording", () => {
  for (const [pathname, terms] of [["/", ["discovery", "strategy", "support"]], ["/website-development", ["CMS", "testing", "maintenance", "support"]], ["/seo-services", ["audit", "implementation", "ongoing review", "enquiries"]]]) {
    const dom = priorityDocument(pathname);
    try {
      const text = dom.window.document.querySelector("main").textContent.toLowerCase();
      for (const term of terms) assert(text.includes(term.toLowerCase()), `${pathname}: missing ${term}`);
      assert(!text.includes("near me partner") && !text.includes("best website designers in pune"));
    } finally { dom.window.close(); }
  }
});

test("all public router pages have unique initial titles, descriptions, H1s, canonicals and actual content", () => {
  const titles = new Set(), descriptions = new Set();
  for (const pathname of paths) {
    const data = routeData(pathname, fixtures);
    const rendered = renderPublic(pathname, data);
    const dom = new JSDOM(publicHtml(template, rendered, pathname, data));
    try {
      const d = dom.window.document;
      assert(!titles.has(d.title), `Duplicate title: ${pathname}`); titles.add(d.title);
      const description = d.querySelector('meta[name="description"]').content;
      assert(!descriptions.has(description), `Duplicate description: ${pathname}`); descriptions.add(description);
      assert.equal(d.querySelectorAll('link[rel="canonical"]').length, 1);
      assert.equal(d.querySelector('link[rel="canonical"]').href, new URL(pathname, "https://www.praaviconsultants.in").href);
      assert.equal(d.querySelectorAll("h1").length, 1);
      assert(d.querySelector("main").textContent.trim().length > 80, pathname);
      assert(!d.querySelector('meta[name="robots"][content*="noindex"]'));
      for (const key of ["og:title", "og:description", "og:type", "og:url", "twitter:title", "twitter:description", "twitter:card"]) assert.equal(d.querySelectorAll(`meta[property="${key}"],meta[name="${key}"]`).length, 1, `${pathname}: ${key}`);
      assert.equal(d.querySelector('meta[property="og:type"]').content, "website");
      assert(!d.querySelector('meta[name="twitter:site"]'));
      assert(!d.querySelector('script[type="application/ld+json"]') || pathname === "/");
    } finally { dom.window.close(); }
  }
});

test("public router definitions stay in sync with the client router", () => {
  const app = fs.readFileSync("src/App.tsx", "utf8");
  const entry = fs.readFileSync("src/entry-public.tsx", "utf8");
  for (const match of entry.matchAll(/<Route path="([^"]+)" element=\{<([A-Za-z]+) \/>\}/g)) assert(app.includes(match[0]), `SSR/client route drift: ${match[1]}`);
});

test("existing duplicate service aliases retain preferred canonical targets and equivalent content", () => {
  for (const [alias, canonical] of Object.entries(PUBLIC_ALIASES)) {
    const a = renderPublic(alias), b = renderPublic(canonical);
    assert.equal(a.seo.canonicalPath, canonical);
    assert.equal(a.seo.title, b.seo.title);
    const d = new JSDOM(publicHtml(template, a, alias));
    assert.equal(d.window.document.querySelector('link[rel="canonical"]').href, `https://www.praaviconsultants.in${canonical}`);
    d.window.close();
    assert(!paths.includes(alias));
  }
});

test("published dynamic content appears initially; only route-specific public records are serialized", () => {
  const cases = [
    ["/portfolio", "portfolio", { id: "public-project", title: "Public project fixture", client: "Public client", desc: "Existing public project description", tags: [], stat: "", imageUrl: "/placeholder.svg", liveUrl: "", createdAt: 1 }],
    ["/clients", "clients", { id: "public-client", name: "Public client fixture", category: "Retail", logoUrl: "/placeholder.svg", websiteUrl: "", createdAt: 1 }],
    ["/case-studies", "caseStudies", { id: "public-case", client: "Public case client", title: "Public case fixture", problem: "Public problem", solution: "Public solution", technology: [], before: "", after: "", trafficGrowth: "", leadsGenerated: "", testimonial: "", screenshot: "/placeholder.svg", createdAt: 1 }],
    ["/career", "jobs", { id: 1, title: "Public job fixture", short_description: "Published role", department: "Marketing", job_type: "Full Time", work_mode: "Office", location: "Pune", experience: "1 year", status: "active", open_positions: 1, responsibilities: "", skills: "", qualification: "", full_description: "" }],
    ["/blog", "blogs", { id: "public-blog", slug: "public-blog-fixture", title: "Public blog fixture", excerpt: "Published article", content: "Article text", imageUrl: "/placeholder.svg", date: "Jan 1, 2026", category: "SEO", readTime: "5 min read", createdAt: 1 }],
  ];
  for (const [pathname, key, record] of cases) {
    const data = routeData(pathname, { ...fixtures, [key]: [record], applications: [{ email: "PRIVATE_SENTINEL" }] });
    assert.deepEqual(Object.keys(data), [key]);
    const dom = new JSDOM(publicHtml(template, renderPublic(pathname, data), pathname, data));
    assert(dom.window.document.querySelector("main").textContent.includes(record.title ?? record.name));
    assert(!dom.serialize().includes("PRIVATE_SENTINEL"));
    dom.window.close();
  }
});

test("public head removes duplicate stale metadata and safely escapes public payloads", () => {
  const seo = { title: "Unique title", description: "Unique description", canonicalPath: "/clients" };
  const html = publicHtml(template.replace("</head>", '<link rel="canonical" href="https://invalid.example"><meta property="og:type" content="article"><meta name="twitter:site" content="@wrong"></head>'), { seo, markup: '<main><h1>Clients</h1><p>' + "Public text ".repeat(40) + '</p></main>' }, "/clients", { clients: [{ name: '</script><script>BAD()</script>' }] });
  const dom = new JSDOM(html);
  assert.equal(dom.window.document.querySelectorAll('link[rel="canonical"]').length, 1);
  assert(!html.includes('<script>BAD()'));
  assert.equal(dom.window.document.querySelectorAll('meta[property="og:type"]').length, 1);
  assert.equal(JSON.parse(dom.window.document.getElementById("public-prerender-data").textContent).data.clients[0].name, '</script><script>BAD()</script>');
  dom.window.close();
});

test("prerender fails closed on missing page SEO, content, or internal sitemap URLs", () => {
  assert.throws(() => publicHtml(template, { seo: { title: "Wrong", description: "Wrong", canonicalPath: "/" }, markup: "" }, "/contact"));
  assert.throws(() => publicHtml(template, { seo: { title: "Clients", description: "Clients description", canonicalPath: "/clients" }, markup: "" }, "/clients"));
  assert.throws(() => publicPaths(xml.replace("/contact</loc>", "/social_desk</loc>")));
  assert(paths.every(p => !isInternalRoute(p)));
  assert(paths.includes("/"));
  assert.equal(publicAsset("/"), "index.html");
});

test("generated public routing cannot intercept API, internal tools, About or blog detail pages", () => {
  const config = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
  const rule = config.routes.find(r => r.dest === "/public-pages/$1.html");
  assert(rule?.check);
  const pattern = new RegExp(`^${rule.src}$`);
  for (const p of paths.filter(p => p !== "/")) assert(pattern.test(p), p);
  for (const p of ["/api/uploads/images", "/social_desk", "/admin", "/finance-management-system/fms/login", "/about", "/blog/article", "/diwali-wishes"]) assert(!pattern.test(p), p);
});

test("June Offer static HTML preserves the shipped public app and provides initial content and canonical", () => {
  const dom = new JSDOM(fs.readFileSync("public/june-offer/index.html", "utf8"));
  const d = dom.window.document;
  assert.equal(d.querySelectorAll("h1").length, 1);
  assert(d.getElementById("root").textContent.length > 1000);
  assert.equal(d.querySelectorAll('link[rel="canonical"]').length, 1);
  assert.equal(d.querySelector('link[rel="canonical"]').href, "https://www.praaviconsultants.in/june-offer");
  assert(d.querySelector('script[type="module"][src^="/june-offer/assets/"]'));
  // Re-capture its public HTML whenever the independently built app changes.
  const script = d.querySelector('script[type="module"]').getAttribute("src");
  assert.equal(createHash("sha256").update(fs.readFileSync(`public${script}`)).digest("hex"), "a36b8e96c443160d3ba099e18c9230432aefdcadaffc688a6285599c45ad4493", "June Offer app changed: regenerate and verify its initial HTML snapshot");
  dom.window.close();
});
