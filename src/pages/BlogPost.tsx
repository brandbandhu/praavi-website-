import { useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getBlogPostBySlug, type BlogPost } from "@/lib/blogStore";
import { fetchPublishedBlogPostBySlug } from "@/lib/contentApi";
import SeoHead from "@/components/SeoHead";
import { buildBlogPostingSchema } from "@/lib/blogSchema";
import BlogInlineLinks from "@/components/BlogInlineLinks";
import { parseBlogContent } from "@/lib/blogContent";

const BlogArticleBody = ({ content }: { content: string }) => (
  <div data-blog-content className="space-y-4 break-words text-base leading-7 text-foreground/90 sm:leading-8">
    {parseBlogContent(content).map((block, index) => {
      if (block.type === "heading") {
        return <h2 key={index} className="border-t border-border pt-5 font-display text-xl font-semibold leading-snug text-foreground [&:not(:first-child)]:mt-8 sm:text-2xl"><BlogInlineLinks text={block.text} /></h2>;
      }
      if (block.type === "subheading") {
        return <h3 key={index} className="font-display text-lg font-semibold leading-snug text-foreground [&:not(:first-child)]:mt-6"><BlogInlineLinks text={block.text} /></h3>;
      }
      if (block.type === "list") {
        return (
          <ul key={index} className="list-disc space-y-2 pl-6 text-justify marker:text-primary">
            {block.items.map((item, itemIndex) => <li key={itemIndex} className="pl-1"><BlogInlineLinks text={item} /></li>)}
          </ul>
        );
      }
      if (block.type === "table") {
        return (
          <div key={index} className="overflow-x-auto rounded-lg border border-border" role="region" aria-label="Comparison table" tabIndex={0}>
            <table className="w-full min-w-[26rem] text-left text-sm leading-6">
              <thead className="bg-muted text-foreground">
                <tr>{block.columns.map((column, cellIndex) => (
                  <th key={cellIndex} scope="col" className="px-3 py-2.5 sm:px-4"><BlogInlineLinks text={column} /></th>
                ))}</tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-border align-top">
                    <th scope="row" className="px-3 py-2.5 font-semibold text-foreground sm:px-4"><BlogInlineLinks text={row[0]} /></th>
                    {row.slice(1).map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2.5 text-justify sm:px-4"><BlogInlineLinks text={cell} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      return <p key={index} className="text-justify"><BlogInlineLinks text={block.text} /></p>;
    })}
  </div>
);

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | undefined>(slug ? getBlogPostBySlug(slug) : undefined);
  const [loading, setLoading] = useState(!!slug);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setPost(getBlogPostBySlug(slug));
    fetchPublishedBlogPostBySlug(slug)
      .then((livePost) => {
        if (!mounted) return;
        if (livePost) setPost(livePost);
      })
      .catch(() => {
        // Keep local fallback post when live fetch fails.
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <section className="section-padding">
        <div className="container-max max-w-3xl">
          <div className="service-card text-center text-muted-foreground">Loading post...</div>
        </div>
      </section>
    );
  }

  if (!post || post.slug !== slug) {
    return (
      <section className="section-padding">
        <div className="container-max max-w-3xl">
          <div className="service-card text-center">
            <h1 className="font-display text-3xl font-bold mb-3">Post Not Found</h1>
            <p className="text-muted-foreground mb-6">The requested blog post does not exist.</p>
            <Link to="/blog" className="gradient-bg px-5 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground">
              Back to Blog
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return <BlogPostContent post={post} />;
};

export const BlogPostContent = ({ post }: { post: BlogPost }) => {
  const schema = buildBlogPostingSchema(post);

  return (
    <>
      <SeoHead
        title={`${post.title} | Praavi Blog`}
        description={post.excerpt}
        canonicalPath={`/blog/${post.slug}`}
        schema={schema}
        ogType="article"
        ogTitle={post.title}
        ogImage={typeof schema.image === "string" ? schema.image : null}
        publishedTime={typeof schema.datePublished === "string" ? schema.datePublished : undefined}
      />
      <section className="section-padding">
        <article className="mx-auto max-w-3xl rounded-2xl border border-border bg-card px-4 py-5 sm:p-8 lg:p-10">
          <img
            src={post.imageUrl}
            alt={`${post.title} - website development company in Pune`}
            className="mb-6 aspect-video w-full rounded-xl object-cover"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg";
            }}
          />
          <p className="text-xs text-muted-foreground mb-3">{post.category}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mb-4">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-6">
            <span className="inline-flex items-center gap-2">
              <Calendar size={14} className="text-primary" />
              {post.date}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock size={14} className="text-primary" />
              {post.readTime}
            </span>
          </div>

          <p className="mb-6 border-b border-border pb-5 text-justify text-base leading-7 text-muted-foreground sm:text-lg">{post.excerpt}</p>
          <BlogArticleBody content={post.content} />

          <div className="mt-8">
            <Link to="/blog" className="text-sm text-primary hover:underline">
              Back to all blogs
            </Link>
          </div>
        </article>
      </section>
    </>
  );
};

export default BlogPostPage;
