import { supabase } from "@/lib/supabase";
import type { BlogPost } from "@/lib/blogStore";
import type { PortfolioItem } from "@/lib/portfolioStore";
import type { ClientItem } from "@/lib/clientsStore";

const DEFAULT_IMAGE = "/placeholder.svg";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const formatDate = (value?: string | null) => {
  if (!value) return "Jan 1, 2026";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Jan 1, 2026";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const toTimestamp = (value?: string | null) => {
  if (!value) return Date.now();
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Date.now() : time;
};

const normalizeTags = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string" && !!v.trim());
  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
};

const toIso = (value: number) => new Date(value).toISOString();
const asUuidOrUndefined = (value: string) => (UUID_RE.test(value) ? value : undefined);

export const fetchPublishedBlogPosts = async (): Promise<BlogPost[]> => {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: String(row.id),
    slug: row.slug ?? String(row.id),
    title: row.title ?? "Untitled",
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    category: row.category ?? "General",
    readTime: row.read_time ?? "5 min read",
    date: formatDate(row.published_at ?? row.created_at),
    imageUrl: row.image_url ?? DEFAULT_IMAGE,
    createdAt: toTimestamp(row.published_at ?? row.created_at),
  }));
};

export const fetchPublishedBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: String((data as any).id),
    slug: (data as any).slug ?? String((data as any).id),
    title: (data as any).title ?? "Untitled",
    excerpt: (data as any).excerpt ?? "",
    content: (data as any).content ?? "",
    category: (data as any).category ?? "General",
    readTime: (data as any).read_time ?? "5 min read",
    date: formatDate((data as any).published_at ?? (data as any).created_at),
    imageUrl: (data as any).image_url ?? DEFAULT_IMAGE,
    createdAt: toTimestamp((data as any).published_at ?? (data as any).created_at),
  };
};

export const fetchPublishedPortfolioItems = async (): Promise<PortfolioItem[]> => {
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: String(row.id),
    title: row.title ?? "Untitled Project",
    client: row.client ?? "Client",
    desc: row.desc ?? row.summary ?? row.details ?? "",
    tags: normalizeTags(row.tags),
    stat: row.stat ?? "",
    imageUrl: row.image_url ?? DEFAULT_IMAGE,
    liveUrl: row.live_url ?? row.website_url ?? "",
    createdAt: toTimestamp(row.created_at),
  }));
};

export const fetchActiveClients = async (): Promise<ClientItem[]> => {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: String(row.id),
    name: row.name ?? "Client",
    category: row.category ?? "Client",
    logoUrl: row.logo_url ?? DEFAULT_IMAGE,
    websiteUrl: row.website_url ?? "",
    createdAt: toTimestamp(row.created_at),
  }));
};

export const upsertBlogPostsToSupabase = async (posts: BlogPost[]) => {
  const payload = posts.map((post) => ({
    ...(asUuidOrUndefined(post.id) ? { id: asUuidOrUndefined(post.id) } : {}),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    image_url: post.imageUrl || DEFAULT_IMAGE,
    category: post.category || "General",
    read_time: post.readTime || "5 min read",
    status: "published",
    published_at: toIso(post.createdAt),
  }));

  let { error } = await supabase.from("blog_posts").upsert(payload, { onConflict: "slug" });
  if (!error) return;

  // Fallback for minimal schemas.
  const minimalPayload = posts.map((post) => ({
    ...(asUuidOrUndefined(post.id) ? { id: asUuidOrUndefined(post.id) } : {}),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    image_url: post.imageUrl || DEFAULT_IMAGE,
    status: "published",
  }));

  const fallback = await supabase.from("blog_posts").upsert(minimalPayload, { onConflict: "slug" });
  error = fallback.error;
  if (error) throw error;
};

export const deleteBlogPostFromSupabase = async (id: string) => {
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw error;
};

export const upsertPortfolioItemsToSupabase = async (items: PortfolioItem[]) => {
  const richPayload = items.map((item) => ({
    ...(asUuidOrUndefined(item.id) ? { id: asUuidOrUndefined(item.id) } : {}),
    title: item.title,
    slug: item.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-"),
    summary: item.desc,
    details: item.desc,
    image_url: item.imageUrl || DEFAULT_IMAGE,
    client: item.client,
    tags: item.tags,
    stat: item.stat,
    live_url: item.liveUrl || "",
    status: "published",
  }));

  let { error } = await supabase.from("portfolio_items").upsert(richPayload, { onConflict: "slug" });
  if (!error) return;

  // Fallback for minimal schemas.
  const minimalPayload = items.map((item) => ({
    ...(asUuidOrUndefined(item.id) ? { id: asUuidOrUndefined(item.id) } : {}),
    title: item.title,
    slug: item.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-"),
    image_url: item.imageUrl || DEFAULT_IMAGE,
    status: "published",
  }));

  const fallback = await supabase.from("portfolio_items").upsert(minimalPayload, { onConflict: "slug" });
  error = fallback.error;
  if (error) throw error;
};

export const deletePortfolioItemFromSupabase = async (id: string) => {
  const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
  if (error) throw error;
};

export const upsertClientsToSupabase = async (clients: ClientItem[]) => {
  const richPayload = clients.map((client) => ({
    ...(asUuidOrUndefined(client.id) ? { id: asUuidOrUndefined(client.id) } : {}),
    name: client.name,
    category: client.category || "Client",
    logo_url: client.logoUrl || DEFAULT_IMAGE,
    website_url: client.websiteUrl || "",
    status: "active",
  }));

  let { error } = await supabase.from("clients").upsert(richPayload, { onConflict: "name" });
  if (!error) return;

  // Fallback for minimal schemas.
  const minimalPayload = clients.map((client) => ({
    ...(asUuidOrUndefined(client.id) ? { id: asUuidOrUndefined(client.id) } : {}),
    name: client.name,
    logo_url: client.logoUrl || DEFAULT_IMAGE,
    status: "active",
  }));

  const fallback = await supabase.from("clients").upsert(minimalPayload, { onConflict: "name" });
  error = fallback.error;
  if (!error) return;

  // Last fallback for schemas without unique name constraint: insert new rows.
  const insertFallback = await supabase.from("clients").insert(
    minimalPayload.map(({ id: _id, ...row }) => row)
  );
  if (insertFallback.error) throw insertFallback.error;
};

export const deleteClientFromSupabase = async (id: string) => {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
};
