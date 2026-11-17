import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import Layout from "./components/Layout";
import { BlogPostContent } from "./pages/BlogPost";
import { buildBlogPostingSchema } from "./lib/blogSchema";
import { mapBlogPostRow, fetchPublishedBlogPostBySlug } from "./lib/contentApi";
import type { BlogPost } from "./lib/blogStore";

export { fetchPublishedBlogPostBySlug };
export const renderBlogPost = (post: BlogPost) => ({
  post,
  schema: buildBlogPostingSchema(post),
  markup: renderToString(<StaticRouter location={`/blog/${post.slug}`}><Layout><BlogPostContent post={post} /></Layout></StaticRouter>),
});
export const renderBlogRow = (row: Record<string, unknown>) => renderBlogPost(mapBlogPostRow(row));
