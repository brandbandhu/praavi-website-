import { useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getBlogPostBySlug, type BlogPost } from "@/lib/blogStore";
import { fetchPublishedBlogPostBySlug } from "@/lib/contentApi";
import SeoHead from "@/components/SeoHead";

const renderContent = (content: string) => {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    const numberedPoint = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedPoint) {
      return (
        <div
          key={`${line}-${index}`}
          className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm leading-6"
        >
          <span className="font-semibold text-primary">{numberedPoint[1]}. </span>
          <span>{numberedPoint[2]}</span>
        </div>
      );
    }

    return (
      <p key={`${line}-${index}`} className="text-sm leading-7 text-foreground/95">
        {line}
      </p>
    );
  });
};

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

  if (!post) {
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

  return (
    <>
      <SeoHead
        title={`${post.title} | Praavi Blog`}
        description={post.excerpt}
        canonicalPath={`/blog/${post.slug}`}
      />
      <section className="section-padding">
        <article className="container-max max-w-3xl service-card">
          <img
            src={post.imageUrl}
            alt={`${post.title} - website development company in Pune`}
            className="w-full h-64 sm:h-80 object-cover rounded-xl mb-6"
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

          <p className="text-sm text-muted-foreground mb-5">{post.excerpt}</p>
          <div className="space-y-3">{renderContent(post.content)}</div>

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
