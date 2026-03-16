import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, TrendingUp, Users } from "lucide-react";
import PageHero from "@/components/PageHero";
import { getPortfolioItems, type PortfolioItem } from "@/lib/portfolioStore";
import { fetchPublishedPortfolioItems } from "@/lib/contentApi";

const PortfolioPage = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [projects, setProjects] = useState<PortfolioItem[]>(getPortfolioItems());

  useEffect(() => {
    let mounted = true;
    fetchPublishedPortfolioItems()
      .then((liveProjects) => {
        if (!mounted) return;
        if (liveProjects.length > 0) setProjects(liveProjects);
      })
      .catch(() => {
        // Keep local fallback projects when Supabase is not configured or empty.
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <PageHero
        title="Our Work Speaks for Itself"
        highlightWord="Itself"
        subtitle="Crafting data-driven campaigns that transform brands and deliver exceptional results"
      />

      <div className="flex items-center justify-center gap-8 py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp size={16} className="text-primary" />
          250+ Successful Campaigns
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users size={16} className="text-primary" />
          150+ Happy Clients
        </div>
      </div>

      <section className="section-padding pt-8" ref={ref}>
        <div className="container-max">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="service-card overflow-hidden"
              >
                <div className="-mx-6 -mt-6 h-44 mb-6 overflow-hidden">
                  <img
                    src={project.imageUrl}
                    alt={`${project.title} - website development company in Pune portfolio`}
                    className="w-full h-full object-cover"
                  />
                </div>

                <p className="text-xs text-primary mb-2">{project.client}</p>
                <h3 className="font-display text-lg font-semibold mb-2">{project.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{project.desc}</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full gradient-bg text-primary-foreground font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="text-sm font-semibold text-foreground mb-3">{project.stat}</p>
                {project.liveUrl ? (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    View Work
                    <ArrowUpRight size={14} />
                  </a>
                ) : null}
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default PortfolioPage;
