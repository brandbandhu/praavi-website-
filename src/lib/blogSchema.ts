import type { BlogPost } from "@/lib/blogStore";
import logoUrl from "@/assets/logo.png";

const SITE_URL = "https://www.praaviconsultants.in";

const absoluteHttpUrl = (value: string): string | undefined => {
  try {
    const url = new URL(value, SITE_URL);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
};

// Accept only source ISO dates, never formatted UI dates or generated fallbacks.
const isoDate = (value?: string | null): string | undefined => {
  if (!value || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) {
    return undefined;
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  const calendarDate = value.slice(0, 10);
  if (new Date(`${calendarDate}T00:00:00Z`).toISOString().slice(0, 10) !== calendarDate) return undefined;
  return value.length === 10 ? value : date.toISOString();
};

export const buildBlogPostingSchema = (post: BlogPost): Record<string, unknown> => {
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const datePublished = isoDate(post.publishedAt);
  const dateModified = isoDate(post.modifiedAt);
  const image = post.imageUrl && post.imageUrl !== "/placeholder.svg"
    ? absoluteHttpUrl(post.imageUrl)
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${canonicalUrl}#blogposting`,
    headline: post.title,
    description: post.excerpt,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    url: canonicalUrl,
    ...(image ? { image } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    // Organization authorship for existing articles was confirmed by the owner.
    author: { "@type": "Organization", name: "Praavi Consultants", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Praavi Consultants",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: absoluteHttpUrl(logoUrl) },
    },
  };
};
