import { useEffect, useState } from "react";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";
import { getBlogPosts, type BlogPost } from "@/lib/blogStore";
import { fetchPublishedBlogPosts } from "@/lib/contentApi";

const BlogPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>(getBlogPosts());

  useEffect(() => {
    let mounted = true;
    fetchPublishedBlogPosts()
      .then((livePosts) => {
        if (!mounted) return;
        if (livePosts.length > 0) setPosts(livePosts);
      })
      .catch(() => {
        // Keep local fallback posts when Supabase is not configured or empty.
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <PageHero
        tag="Insights & Resources"
        title="Praavi Blog"
        subtitle="Actionable digital growth ideas from our SEO, web, and performance marketing team."
      />

      <section className="section-padding">
        <div className="container-max">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article key={post.id} className="service-card flex flex-col overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-44 object-cover rounded-xl mb-4"
                  loading="lazy"
                />
                <span className="inline-flex w-fit text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border mb-4">
                  {post.category}
                </span>

                <h2 className="font-display text-xl font-semibold leading-snug mb-3">{post.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{post.excerpt}</p>

                <div className="mt-auto pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-primary" />
                    {post.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-primary" />
                    {post.readTime}
                  </div>
                </div>
                <Link to={`/blog/${post.slug}`} className="mt-4 text-sm text-primary hover:underline">
                  Read full post
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Discuss Your Growth Strategy
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default BlogPage;
