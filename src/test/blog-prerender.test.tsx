import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import BlogPostPage from "@/pages/BlogPost";
import { readPrerenderedBlogPost } from "@/lib/blogPrerender";
import type { BlogPost } from "@/lib/blogStore";
import template from "../../index.html?raw";

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/lib/contentApi", () => ({ fetchPublishedBlogPostBySlug: mocks.fetch }));
const post: BlogPost = { id: "fixture", slug: "first-article", title: "First article", excerpt: "Unique first description", content: "Original introduction\n1. Original section\nOriginal final paragraph", category: "Marketing", readTime: "5 min read", date: "May 22, 2026", createdAt: 1779449674481, publishedAt: "2026-05-22T11:34:34.481Z", imageUrl: "https://media.praaviconsultants.in/uploads/blogs/fixture.webp" };
const dataScript = (id: string, value: unknown) => {
  const script = document.createElement("script"); script.type = "application/json"; script.id = id; script.textContent = JSON.stringify(value); document.head.appendChild(script); return script;
};
beforeEach(() => {
  document.head.innerHTML = new DOMParser().parseFromString(template, "text/html").head.innerHTML;
  mocks.fetch.mockReset();
});
afterEach(cleanup);
const Navigation = () => {
  const navigate = useNavigate();
  return <><button onClick={() => navigate("/blog/second-article")}>Second route</button><button onClick={() => navigate("/contact")}>Public route</button></>;
};
const app = () => <MemoryRouter initialEntries={["/blog/first-article"]}><Navigation /><Routes><Route path="/blog/:slug" element={<BlogPostPage />} /><Route path="/contact" element={<p>Public page</p>} /></Routes></MemoryRouter>;

it("uses only complete matching prerender data and ignores malformed or stale article payloads", () => {
  const script = dataScript("blog-prerender-data", post);
  expect(readPrerenderedBlogPost(post.slug)).toEqual(post);
  expect(readPrerenderedBlogPost("second-article")).toBeUndefined();
  script.textContent = "invalid JSON";
  expect(readPrerenderedBlogPost(post.slug)).toBeUndefined();
  script.textContent = JSON.stringify({ slug: post.slug, title: post.title });
  expect(readPrerenderedBlogPost(post.slug)).toBeUndefined();
});

it("keeps the prerendered article visible while revalidating and preserves its H1/H2/schema", async () => {
  dataScript("blog-prerender-data", post);
  let resolve!: (value: BlogPost) => void;
  mocks.fetch.mockReturnValue(new Promise<BlogPost>((done) => { resolve = done; }));
  const view = render(app());
  expect(view.queryByText("Loading post...")).toBeNull();
  expect(view.getByRole("heading", { level: 1 }).textContent).toBe(post.title);
  expect(view.getByRole("heading", { level: 2 }).textContent).toBe("1. Original section");
  expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
  await act(async () => resolve({ ...post, excerpt: "Revalidated description" }));
  await waitFor(() => expect(document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content).toBe("Revalidated description"));
});

it("navigation ignores stale prerender data, replaces one schema/canonical, and restores public social defaults", async () => {
  const defaultTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]')!.content;
  dataScript("seo-default-social", { "og:type": "website", "og:title": defaultTitle, "twitter:card": "summary_large_image" });
  dataScript("blog-prerender-data", post);
  const second = { ...post, slug: "second-article", title: "Second article", excerpt: "Second description" };
  mocks.fetch.mockImplementation((slug: string) => Promise.resolve(slug === post.slug ? post : second));
  const view = render(app());
  fireEvent.click(view.getByText("Second route"));
  await waitFor(() => expect(view.getByRole("heading", { level: 1 }).textContent).toBe(second.title));
  expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  expect(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe("https://www.praaviconsultants.in/blog/second-article");
  expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
  expect(JSON.parse(document.getElementById("seo-json-ld")!.textContent!).headline).toBe(second.title);
  fireEvent.click(view.getByText("Public route"));
  expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
  expect(document.querySelector<HTMLMetaElement>('meta[property="og:type"]')?.content).toBe("website");
  expect(document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content).toBe(defaultTitle);
});
