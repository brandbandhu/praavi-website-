import type { BlogPost } from "./blogStore";

export const readPrerenderedBlogPost = (slug?: string): BlogPost | undefined => {
  if (!slug || typeof document === "undefined") return;
  try {
    const element = document.getElementById("blog-prerender-data");
    if (!element || element.getAttribute("type") !== "application/json") return;
    const post = JSON.parse(element.textContent ?? "");
    if (!post || post.slug !== slug || typeof post.createdAt !== "number") return;
    for (const key of ["id", "title", "excerpt", "content", "category", "readTime", "date", "imageUrl"]) {
      if (typeof post[key] !== "string") return;
    }
    return post as BlogPost;
  } catch { return; }
};
