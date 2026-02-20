export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readTime: string;
  date: string;
  imageUrl: string;
  createdAt: number;
}

const BLOG_STORAGE_KEY = "praavi_blog_posts";
const DEFAULT_IMAGE = "/placeholder.svg";

const defaultPosts: BlogPost[] = [
  {
    id: "seed-1",
    slug: "how-local-seo-helps-service-businesses-get-more-leads",
    title: "How Local SEO Helps Service Businesses Get More Leads",
    excerpt:
      "A practical framework to improve local rankings, generate calls, and turn map visibility into consistent leads.",
    content:
      "Local SEO is one of the highest ROI channels for service businesses. Start by improving your Google Business Profile, adding localized service pages, and collecting authentic client reviews consistently.",
    category: "SEO",
    readTime: "6 min read",
    date: "Feb 10, 2026",
    imageUrl: DEFAULT_IMAGE,
    createdAt: 1739145600000,
  },
  {
    id: "seed-2",
    slug: "website-conversion-fixes-that-increase-enquiries-fast",
    title: "Website Conversion Fixes That Increase Enquiries Fast",
    excerpt:
      "Simple UX and copy updates you can implement this week to improve inquiry rates without redesigning your whole site.",
    content:
      "High-converting service pages focus on clarity and trust. Use one clear CTA per section, include client proof, and shorten forms to only essential fields.",
    category: "Web Design",
    readTime: "5 min read",
    date: "Jan 28, 2026",
    imageUrl: DEFAULT_IMAGE,
    createdAt: 1738022400000,
  },
  {
    id: "seed-3",
    slug: "google-ads-budgeting-for-small-and-mid-sized-brands",
    title: "Google Ads Budgeting for Small and Mid-Sized Brands",
    excerpt:
      "Learn how to split budget across campaign types and avoid the common mistakes that waste ad spend.",
    content:
      "Begin with high-intent search campaigns, then expand to remarketing and demand-gen once conversion data is stable. Track cost per qualified lead weekly and optimize based on conversion quality.",
    category: "Paid Ads",
    readTime: "7 min read",
    date: "Jan 15, 2026",
    imageUrl: DEFAULT_IMAGE,
    createdAt: 1736899200000,
  },
];

const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

const normalizeSinglePost = (post: Partial<BlogPost>): BlogPost | null => {
  if (!post.id || !post.slug || !post.title || !post.excerpt || !post.content) return null;
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category?.trim() || "General",
    readTime: post.readTime?.trim() || "5 min read",
    date: post.date?.trim() || "Jan 1, 2026",
    imageUrl: post.imageUrl?.trim() || DEFAULT_IMAGE,
    createdAt: typeof post.createdAt === "number" ? post.createdAt : Date.now(),
  };
};

const normalizePosts = (posts: Partial<BlogPost>[]) =>
  posts
    .map(normalizeSinglePost)
    .filter((post): post is BlogPost => !!post)
    .sort((a, b) => b.createdAt - a.createdAt);

export const getBlogPosts = (): BlogPost[] => {
  if (!canUseStorage()) return normalizePosts(defaultPosts);

  try {
    const raw = localStorage.getItem(BLOG_STORAGE_KEY);
    if (!raw) return normalizePosts(defaultPosts);

    const parsed = JSON.parse(raw) as Partial<BlogPost>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return normalizePosts(defaultPosts);
    const normalized = normalizePosts(parsed);
    return normalized.length > 0 ? normalized : normalizePosts(defaultPosts);
  } catch {
    return normalizePosts(defaultPosts);
  }
};

export const saveBlogPosts = (posts: BlogPost[]) => {
  if (!canUseStorage()) return;
  localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(normalizePosts(posts)));
};

export const getBlogPostBySlug = (slug: string) =>
  getBlogPosts().find((post) => post.slug === slug);

export const createSlug = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
