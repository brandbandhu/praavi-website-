// Match complete route segments so public services/blogs with similar words
// remain indexable. Shared by sitemap generation, HTML serving and React.
export const INTERNAL_ROUTE_PREFIXES = [
  "/social_desk",
  "/internal/quote-tool",
  "/dm_quotation_maker-myadmin",
  "/finance-management-system",
  "/diwali-wishes",
  "/digital_marketing_team",
  "/my_praavi_consultant_pc_admin_yes",
  "/admin",
  "/internal-app.html",
];

export const isInternalRoute = (pathname) => {
  if (typeof pathname !== "string") return false;
  let route;
  try { route = decodeURIComponent(pathname.split(/[?#]/)[0]); }
  catch { return false; }
  return INTERNAL_ROUTE_PREFIXES.some((prefix) => route === prefix || route.startsWith(`${prefix}/`));
};
