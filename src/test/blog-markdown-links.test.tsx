import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import BlogInlineLinks from "@/components/BlogInlineLinks";
import { BlogPostContent } from "@/pages/BlogPost";
import type { BlogPost } from "@/lib/blogStore";

beforeEach(() => { document.head.innerHTML = ""; });
afterEach(cleanup);
const post: BlogPost = { id: "markdown-fixture", slug: "markdown-fixture", title: "Original article title", excerpt: "Original description", content: "Original paragraph\n1. Original numbered section\nFinal paragraph", category: "SEO", readTime: "5 min read", imageUrl: "/placeholder.svg", date: "Mar 23, 2026", createdAt: 1774238763200, publishedAt: "2026-03-23T04:06:03.200Z" };
const article = (content: string) => render(<MemoryRouter><BlogPostContent post={{ ...post, content }} /></MemoryRouter>);

it("keeps legacy paragraphs, numbered H2s, text, metadata and original publication date", () => {
  const view = article(post.content);
  const body = view.container.querySelector("article .space-y-3")!;
  expect([...body.children].map(n => n.tagName)).toEqual(["P", "H2", "P"]);
  expect(body.querySelector("h2")?.textContent).toBe("1. Original numbered section");
  expect(body.querySelector("h2")?.className).toBe("rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm leading-6 [font-family:inherit]");
  expect(body.querySelector("p")?.className).toBe("text-sm leading-7 text-foreground/95");
  expect(view.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(view.getByRole("heading", { level: 1 }).textContent).toBe(post.title);
  expect(document.title).toBe(post.title + " | Praavi Blog");
  expect(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe("https://www.praaviconsultants.in/blog/markdown-fixture");
  const schema = JSON.parse(document.getElementById("seo-json-ld")!.textContent!);
  expect(schema.datePublished).toBe(post.publishedAt);
  expect(schema.headline).toBe(post.title);
  expect(schema.dateModified).toBeUndefined();
});

it("renders crawlable inline anchors in existing paragraphs and numbered headings", () => {
  const view = article("Read [website development](/website-development) and [Google guidance](https://developers.google.com/search/docs/appearance/page-experience).\n1. Plan [SEO services](/seo-services)");
  const body = view.container.querySelector("article .space-y-3")!;
  expect(body.querySelector("p")?.textContent).toBe("Read website development and Google guidance.");
  expect(body.querySelector("h2")?.textContent).toBe("1. Plan SEO services");
  expect(body.querySelectorAll("a")).toHaveLength(3);
  for (const a of body.querySelectorAll("a")) {
    expect(a.getAttribute("href")).toBeTruthy();
    expect(a.getAttribute("target")).toBeNull();
    expect(a.rel).not.toMatch(/nofollow/);
    expect(a.className).toBe("text-primary hover:underline");
  }
});

it("preserves URL queries, fragments, punctuation and balanced URL parentheses", () => {
  const view = render(<BlogInlineLinks text="Before [A](https://example.com/a_(b)?tag=one&tag=two#part), [B](/seo-services?from=blog#scope) and [C](#details)." />);
  expect(view.container.textContent).toBe("Before A, B and C.");
  expect([...view.container.querySelectorAll("a")].map(a => a.getAttribute("href"))).toEqual(["https://example.com/a_(b)?tag=one&tag=two#part", "/seo-services?from=blog#scope", "#details"]);
});

it.each([
  "javascript:alert(1)", "JaVaScRiPt:alert(1)", "java\nscript:alert(1)", "data:text/html,<script>alert(1)</script>",
  "vbscript:msgbox(1)", "file:///etc/passwd", "blob:https://example.com/id", "//evil.example/path", "/\\evil.example/path",
  "javascript&#58;alert(1)", "%6aavascript:alert(1)", "https://user:password@example.com", "https:////evil.example", "relative/path", "mailto:test@example.com",
])("leaves unsafe or unsupported destination %s as literal text", destination => {
  const text = `[Label](${destination})`;
  const view = render(<BlogInlineLinks text={text} />);
  expect(view.container.querySelector("a")).toBeNull();
  expect(view.container.textContent).toBe(text);
});

it("escapes raw HTML and hostile labels rather than interpreting HTML or event handlers", () => {
  const view = render(<BlogInlineLinks text={'<script>bad()</script> [<img src=x onerror=bad()>](https://example.com) <a href="javascript:bad()">raw</a>'} />);
  expect(view.container.querySelectorAll("script,img")).toHaveLength(0);
  expect(view.container.querySelectorAll("a")).toHaveLength(1);
  expect(view.container.querySelector("a")?.textContent).toBe("<img src=x onerror=bad()>");
  expect(view.container.querySelector("[onerror],[onclick]")).toBeNull();
});

it.each([
  "![image](https://example.com/image.png)", "\\[escaped](https://example.com)", "`[code](https://example.com)`", "[missing](https://example.com", "[title](https://example.com \"unsupported title\")",
])("preserves unsupported image, escape, code or malformed syntax: %s", text => {
  const view = render(<BlogInlineLinks text={text} />);
  expect(view.container.querySelector("a")).toBeNull();
  expect(view.container.textContent).toBe(text);
});

it("bounds URL parsing while still finding a later valid link", () => {
  const long = `[oversized](https://example.com/${"x".repeat(5000)})`;
  const deep = `[nested](https://example.com/${"(".repeat(20)}x${")".repeat(20)})`;
  const view = render(<BlogInlineLinks text={long + " " + deep + " [valid](/contact)"} />);
  expect(view.container.querySelectorAll("a")).toHaveLength(1);
  expect(view.getByRole("link", { name: "valid" }).getAttribute("href")).toBe("/contact");
  expect(view.container.textContent).toBe(long + " " + deep + " valid");
});
