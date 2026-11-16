import { StrictMode } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import SeoHead from "@/components/SeoHead";
import template from "../../index.html?raw";

const content = (key: string) => document.querySelector<HTMLMetaElement>(`meta[property="${key}"],meta[name="${key}"]`)?.content;
const count = (key: string) => document.querySelectorAll(`meta[property="${key}"],meta[name="${key}"]`).length;

beforeEach(() => {
  document.head.innerHTML = new DOMParser().parseFromString(template, "text/html").head.innerHTML;
});
afterEach(cleanup);

describe("social metadata", () => {
  it("ships one Twitter card and no unverified handle in the HTML template", () => {
    expect(count("twitter:card")).toBe(1);
    expect(count("twitter:site")).toBe(0);
  });

  it("deduplicates tags and publishes article values while preserving canonical, title and schema", () => {
    document.head.insertAdjacentHTML("beforeend", '<meta name="twitter:card" content="summary"><meta property="og:type" content="website"><meta property="og:locale" content="en_IN"><meta property="og:locale" content="en_US"><meta name="twitter:site" content="@Lovable">');
    const schema = { "@context": "https://schema.org", "@type": "BlogPosting", headline: "Real title" };
    const view = render(<StrictMode><SeoHead title="Real title | Praavi Blog" description="Real excerpt" canonicalPath="/blog/real-article" ogTitle="Real title" ogType="article" ogImage="/uploads/real-article.webp" publishedTime="2026-07-29T03:46:22.697Z" schema={schema} /></StrictMode>);
    expect(content("og:type")).toBe("article");
    expect(content("og:title")).toBe("Real title");
    expect(content("og:description")).toBe("Real excerpt");
    expect(content("og:url")).toBe("https://www.praaviconsultants.in/blog/real-article");
    expect(content("og:image")).toBe("https://www.praaviconsultants.in/uploads/real-article.webp");
    expect(content("twitter:title")).toBe("Real title");
    expect(content("twitter:description")).toBe("Real excerpt");
    expect(content("twitter:image")).toBe(content("og:image"));
    expect(content("twitter:card")).toBe("summary_large_image");
    expect(content("article:published_time")).toBe("2026-07-29T03:46:22.697Z");
    expect(count("twitter:site")).toBe(0);
    expect(count("og:image:type") + count("og:image:width") + count("og:image:height")).toBe(0);
    for (const element of document.querySelectorAll('meta[property^="og:"],meta[name^="twitter:"]')) {
      expect(count(element.getAttribute("property") ?? element.getAttribute("name")!)).toBe(1);
    }
    expect(document.title).toBe("Real title | Praavi Blog");
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(content("og:url"));
    expect(JSON.parse(document.getElementById("seo-json-ld")!.textContent!)).toEqual(schema);
    view.unmount();
    expect(content("og:type")).toBe("website");
    expect(content("og:title")).not.toBe("Real title");
    expect(count("article:published_time")).toBe(0);
    expect(count("twitter:site")).toBe(0);
    expect(count("twitter:card")).toBe(1);
  });

  it("removes old article image and dates when the next article lacks them", () => {
    const view = render(<SeoHead title="First" description="First excerpt" ogType="article" ogImage="https://media.praaviconsultants.in/first.jpg" publishedTime="2026-07-29T03:46:22Z" />);
    view.rerender(<SeoHead title="Second" description="Second excerpt" ogType="article" ogImage={null} />);
    expect(content("twitter:card")).toBe("summary");
    expect(count("og:image") + count("twitter:image") + count("article:published_time")).toBe(0);
    expect(content("twitter:title")).toBe("Second");
    expect(content("og:description")).toBe("Second excerpt");
    view.rerender(<SeoHead title="Services" description="Services excerpt" canonicalPath="/services" />);
    expect(content("og:type")).toBe("website");
    expect(content("og:image")).toBe("https://www.praaviconsultants.in/preview-img.png?v=20260714");
    expect(content("og:image:width")).toBe("1200");
    expect(count("article:published_time")).toBe(0);
  });

  it("does not advertise SVG, inline data or malformed images as large image cards", () => {
    const view = render(<SeoHead title="Article" description="Excerpt" ogType="article" ogImage={null} />);
    for (const image of ["/placeholder.svg", "data:image/png;base64,abc", "https://["]) {
      view.rerender(<SeoHead title="Article" description="Excerpt" ogType="article" ogImage={image} />);
      expect(content("twitter:card")).toBe("summary");
      expect(count("og:image") + count("twitter:image")).toBe(0);
    }
  });
});
