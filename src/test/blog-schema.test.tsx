import { StrictMode } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { buildBlogPostingSchema } from "@/lib/blogSchema";
import { getBlogPosts, saveBlogPosts, type BlogPost } from "@/lib/blogStore";
import BlogPostPage from "@/pages/BlogPost";

const mocks = vi.hoisted(() => ({ fetchPost: vi.fn() }));
vi.mock("@/lib/contentApi", () => ({ fetchPublishedBlogPostBySlug: mocks.fetchPost }));

// Metadata read from an existing published article; no invented modification date.
const article: BlogPost = {
  id: "fixture",
  slug: "website-maintenance-checklist-for-business-owners",
  title: "Website Maintenance Checklist for Business Owners",
  excerpt: "A well-maintained website ensures better performance, stronger security, improved SEO, and a seamless user experience. Use this comprehensive website maintenance checklist to keep your business website running smoothly all year round.",
  imageUrl: "https://media.praaviconsultants.in/uploads/blogs/1785296780-0d53a5aace0cb44c.webp",
  publishedAt: "2026-07-29T03:46:22.697+00:00",
  content: "Test body",
  category: "Test",
  readTime: "5 min read",
  date: "Jul 29, 2026",
  createdAt: 1785296782697,
};

const readSchema = () => JSON.parse(document.getElementById("seo-json-ld")!.textContent!);
const scriptCount = () => document.querySelectorAll('script[type="application/ld+json"]').length;

beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  mocks.fetchPost.mockReset();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("BlogPosting metadata", () => {
  it("uses actual article fields, the canonical absolute URL and confirmed organization author", () => {
    const schema = buildBlogPostingSchema(article);
    expect(schema).toMatchObject({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: article.title,
      description: article.excerpt,
      image: article.imageUrl,
      datePublished: "2026-07-29T03:46:22.697Z",
      mainEntityOfPage: { "@id": `https://www.praaviconsultants.in/blog/${article.slug}` },
      author: { "@type": "Organization", name: "Praavi Consultants" },
      publisher: { name: "Praavi Consultants", logo: { "@type": "ImageObject" } },
    });
    expect(schema).not.toHaveProperty("dateModified");
    expect(buildBlogPostingSchema({ ...article, modifiedAt: "2026-07-30T10:20:00+05:30" }))
      .toHaveProperty("dateModified", "2026-07-30T04:50:00.000Z");
  });

  it("omits missing, impossible and fallback dates and placeholder or non-HTTP images", () => {
    for (const date of [undefined, "invalid", "Feb 10, 2026", "2026-02-30", "2026-01-01T00:00:00"]) {
      const schema = buildBlogPostingSchema({ ...article, publishedAt: date, modifiedAt: date, imageUrl: "/placeholder.svg" });
      expect(schema).not.toHaveProperty("datePublished");
      expect(schema).not.toHaveProperty("dateModified");
      expect(schema).not.toHaveProperty("image");
    }
    expect(buildBlogPostingSchema({ ...article, imageUrl: "data:image/png;base64,abc" })).not.toHaveProperty("image");
    expect(buildBlogPostingSchema({ ...article, imageUrl: "/article.webp", publishedAt: "2026-07-29" }))
      .toMatchObject({ image: "https://www.praaviconsultants.in/article.webp", datePublished: "2026-07-29" });
  });

  it("preserves source metadata in the local cache without generating missing timestamps", () => {
    saveBlogPosts([{ ...article, modifiedAt: "2026-07-30T04:50:00Z" }]);
    expect(getBlogPosts()[0]).toMatchObject({ publishedAt: article.publishedAt, modifiedAt: "2026-07-30T04:50:00Z" });
    saveBlogPosts([{ ...article, publishedAt: undefined }]);
    expect(buildBlogPostingSchema(getBlogPosts()[0])).not.toHaveProperty("datePublished");
  });
});

describe("blog schema lifecycle", () => {
  it("keeps one script in StrictMode, updates on navigation, clears missing routes and ignores stale responses", async () => {
    let navigate: ReturnType<typeof useNavigate>;
    function Navigation() { navigate = useNavigate(); return null; }
    const second = { ...article, slug: "second-article", title: "Second Article", excerpt: "Second excerpt", imageUrl: "/placeholder.svg", publishedAt: undefined };
    let resolveSlow!: (value: BlogPost) => void;
    mocks.fetchPost.mockImplementation((slug: string) => {
      if (slug === article.slug) return Promise.resolve(article);
      if (slug === second.slug) return Promise.resolve(second);
      if (slug === "slow") return new Promise<BlogPost>((resolve) => { resolveSlow = resolve; });
      return Promise.resolve(null);
    });
    const view = render(
      <StrictMode>
        <MemoryRouter initialEntries={[`/blog/${article.slug}`]}>
          <Navigation />
          <Routes>
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/blog" element={<p>Blog listing</p>} />
          </Routes>
        </MemoryRouter>
      </StrictMode>,
    );
    await screen.findByRole("heading", { level: 1, name: article.title });
    expect(scriptCount()).toBe(1);
    expect(readSchema().headline).toBe(article.title);
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute("content")).toBe("article");
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute("content")).toBe(article.title);
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute("content")).toBe(article.imageUrl);
    expect(document.querySelector('meta[property="article:published_time"]')?.getAttribute("content")).toBe("2026-07-29T03:46:22.697Z");
    act(() => navigate!(`/blog/${second.slug}`));
    await screen.findByRole("heading", { level: 1, name: second.title });
    expect(scriptCount()).toBe(1);
    expect(readSchema().mainEntityOfPage["@id"]).toBe(`https://www.praaviconsultants.in/blog/${second.slug}`);
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute("content")).toBe(second.title);
    expect(document.querySelector('meta[name="twitter:description"]')?.getAttribute("content")).toBe(second.excerpt);
    expect(document.querySelector('meta[name="twitter:card"]')?.getAttribute("content")).toBe("summary");
    expect(document.querySelector('meta[property="og:image"]')).toBeNull();
    expect(document.querySelector('meta[property="article:published_time"]')).toBeNull();
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href"))
      .toBe(readSchema().mainEntityOfPage["@id"]);
    act(() => navigate!("/blog/slow"));
    await waitFor(() => expect(scriptCount()).toBe(0));
    expect(document.querySelector('meta[property="og:type"][content="article"]')).toBeNull();
    act(() => navigate!("/blog/missing"));
    await screen.findByRole("heading", { name: "Post Not Found" });
    await act(async () => resolveSlow({ ...article, slug: "slow" }));
    expect(scriptCount()).toBe(0);
    act(() => navigate!(`/blog/${article.slug}`));
    await screen.findByRole("heading", { level: 1, name: article.title });
    expect(scriptCount()).toBe(1);
    act(() => navigate!("/blog"));
    expect(scriptCount()).toBe(0);
    view.unmount();
    expect(scriptCount()).toBe(0);
  });
});
