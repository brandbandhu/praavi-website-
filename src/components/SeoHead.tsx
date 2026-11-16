import { useEffect } from "react";

interface SeoHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: "website" | "article";
  ogImage?: string | null;
  publishedTime?: string;
  schema?: Record<string, unknown>;
}

const SITE_URL = "https://www.praaviconsultants.in";
const PREVIEW_IMAGE_URL = `${SITE_URL}/preview-img.png?v=20260714`;

const upsertMeta = (attribute: "name" | "property", key: string, content?: string) => {
  const [first, ...duplicates] = document.querySelectorAll<HTMLMetaElement>(`meta[name="${key}"], meta[property="${key}"]`);
  duplicates.forEach((element) => element.remove());
  if (content === undefined) {
    first?.remove();
    return;
  }
  let element = first;
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  element.removeAttribute(attribute === "name" ? "property" : "name");
  element.setAttribute(attribute, key);
  element.setAttribute("content", content);
};

const SOCIAL_META_SELECTOR = 'meta[property^="og:"], meta[name^="og:"], meta[property^="twitter:"], meta[name^="twitter:"], meta[property^="article:"], meta[name^="article:"]';

const readDefaultSocialMetadata = () => {
  const defaults = new Map<string, string>();
  document.querySelectorAll<HTMLMetaElement>(SOCIAL_META_SELECTOR).forEach((element) => {
    const key = element.getAttribute("property") ?? element.getAttribute("name")!;
    // No verified X handle is configured; article fields belong to the active page.
    if (key !== "twitter:site" && !key.startsWith("article:") && !defaults.has(key)) {
      defaults.set(key, element.content);
    }
  });
  return defaults;
};

const restoreSocialMetadata = (defaults: Map<string, string>) => {
  document.querySelectorAll(SOCIAL_META_SELECTOR).forEach((element) => element.remove());
  defaults.forEach((content, key) => upsertMeta(key.startsWith("twitter:") ? "name" : "property", key, content));
};

const socialImageUrl = (value?: string | null) => {
  if (!value) return undefined;
  try {
    const url = new URL(value, SITE_URL);
    if (!["https:", "http:"].includes(url.protocol) || /\.svg$/i.test(url.pathname)) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
};

const upsertCanonical = (href: string) => {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
};

const SeoHead = ({ title, description, canonicalPath = "/", ogTitle, ogDescription, ogType = "website", ogImage, publishedTime, schema }: SeoHeadProps) => {
  useEffect(() => {
    const defaults = readDefaultSocialMetadata();
    restoreSocialMetadata(defaults);
    const canonical = `${SITE_URL}${canonicalPath === "/" ? "" : canonicalPath}`;
    const image = socialImageUrl(ogImage === undefined ? PREVIEW_IMAGE_URL : ogImage);
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:type", ogType);
    upsertMeta("property", "og:title", ogTitle ?? title);
    upsertMeta("property", "og:description", ogDescription ?? description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", image);
    if (ogType === "article") {
      // The template's PNG dimensions and MIME type do not describe article images.
      document.querySelectorAll('meta[property^="og:image:"], meta[name^="og:image:"]').forEach((element) => element.remove());
    }
    upsertMeta("property", "article:published_time", ogType === "article" ? publishedTime : undefined);
    upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", ogTitle ?? title);
    upsertMeta("name", "twitter:description", ogDescription ?? description);
    upsertMeta("name", "twitter:image", image);
    upsertCanonical(canonical);

    const schemaId = "seo-json-ld";
    const existing = document.getElementById(schemaId);
    if (existing) {
      existing.remove();
    }

    if (schema) {
      const script = document.createElement("script");
      script.id = schemaId;
      script.type = "application/ld+json";
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => {
      restoreSocialMetadata(defaults);
      const current = document.getElementById(schemaId);
      if (current) {
        current.remove();
      }
    };
  }, [canonicalPath, description, ogDescription, ogTitle, ogType, ogImage, publishedTime, schema, title]);

  return null;
};

export default SeoHead;
