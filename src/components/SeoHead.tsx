import { useEffect } from "react";

interface SeoHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogTitle?: string;
  ogDescription?: string;
  schema?: Record<string, unknown>;
}

const SITE_URL = "https://www.praaviconsultants.in";

const upsertMetaByName = (name: string, content: string) => {
  let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const upsertMetaByProperty = (property: string, content: string) => {
  let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
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

const SeoHead = ({ title, description, canonicalPath = "/", ogTitle, ogDescription, schema }: SeoHeadProps) => {
  useEffect(() => {
    const canonical = `${SITE_URL}${canonicalPath === "/" ? "" : canonicalPath}`;
    document.title = title;
    upsertMetaByName("description", description);
    upsertMetaByProperty("og:title", ogTitle ?? title);
    upsertMetaByProperty("og:description", ogDescription ?? description);
    upsertMetaByProperty("og:url", canonical);
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
      const current = document.getElementById(schemaId);
      if (current) {
        current.remove();
      }
    };
  }, [canonicalPath, description, ogDescription, ogTitle, schema, title]);

  return null;
};

export default SeoHead;
