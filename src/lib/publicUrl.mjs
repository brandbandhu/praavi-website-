export const PREFERRED_ORIGIN = "https://www.praaviconsultants.in";

// Match the public router only. APIs, internal tools and assets never enter this
// normalization path, including GET/HEAD upload endpoints and preflights.
export const isPublicPagePath = pathname => pathname === "/" || /^\/(?:about|services(?:\/[a-z0-9-]+){0,2}|website-development|seo-services|social-media-marketing|ai-solutions|portfolio|case-studies|team|clients|career|contact|blog(?:\/[a-z0-9-]+)?|industries\/[a-z0-9-]+|pune\/[a-z0-9-]+|june-offer)\/*$/.test(pathname);

export const publicRedirect = (requestUrl, method = "GET") => {
  if (!["GET", "HEAD"].includes(method)) return null;
  let url;
  try { url = new URL(requestUrl); } catch { return null; }
  if (!["http:", "https:"].includes(url.protocol) || !isPublicPagePath(url.pathname)) return null;
  const target = new URL(url.href);
  const productionHost = ["praaviconsultants.in", "www.praaviconsultants.in"].includes(url.hostname);
  if (productionHost) {
    target.protocol = "https:";
    target.host = "www.praaviconsultants.in";
  }
  if (target.pathname !== "/") target.pathname = target.pathname.replace(/\/+$/, "");
  // Never touch searchParams: repeated keys, order and encoded values survive.
  return target.href === url.href ? null : target.href;
};
