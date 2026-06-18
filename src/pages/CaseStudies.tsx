import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Code2,
  Image,
  MessageSquareQuote,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import SeoHead from "@/components/SeoHead";
import { fetchPublishedCaseStudies } from "@/lib/contentApi";
import { defaultCaseStudies, getCaseStudyItems, saveCaseStudyItems } from "@/lib/caseStudyStore";

const CaseStudiesPage = () => {
  const [caseStudies, setCaseStudies] = useState(getCaseStudyItems());

  useEffect(() => {
    let mounted = true;
    fetchPublishedCaseStudies()
      .then((liveCaseStudies) => {
        if (!mounted) return;
        if (liveCaseStudies.length > 0) {
          setCaseStudies(liveCaseStudies);
          saveCaseStudyItems(liveCaseStudies);
        }
      })
      .catch(() => {
        setCaseStudies(getCaseStudyItems().length > 0 ? getCaseStudyItems() : defaultCaseStudies);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
    <SeoHead
      title="Case Studies | Praavi Consultants Client Results"
      description="Explore Praavi Consultants case studies with client problems, solutions, technology used, before-after results, traffic growth, leads generated, testimonials, and screenshots."
      canonicalPath="/case-studies"
    />
    <PageHero
      title="Case Studies That Show Real Growth"
      highlightWord="Growth"
      subtitle="Detailed client stories with problems, solutions, technology, before-after impact, traffic growth, and lead generation results."
    />

    <section className="py-10 border-b border-border bg-card/60">
      <div className="container-max px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            ["150+", "Clients Served", Users],
            ["500+", "Projects Delivered", CheckCircle2],
            ["98%", "Client Retention", TrendingUp],
          ].map(([value, label, Icon]) => (
            <div key={label as string} className="service-card p-5 text-center">
              <Icon size={22} className="text-primary mx-auto mb-3" />
              <div className="font-display text-3xl font-bold gradient-text-orange">{value as string}</div>
              <div className="text-sm text-muted-foreground mt-1">{label as string}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="section-padding">
      <div className="container-max space-y-10">
        {caseStudies.map((study, index) => (
          <motion.article
            key={study.client}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: index * 0.06 }}
            className="service-card overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8">
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-primary font-semibold mb-2">{study.client}</p>
                  <h2 className="font-display text-3xl font-bold leading-tight">{study.title}</h2>
                </div>

                <div className="h-64 sm:h-72 lg:h-80 rounded-xl border border-border bg-secondary/60 overflow-hidden flex items-center justify-center p-5 sm:p-7">
                  <img
                    src={study.screenshot}
                    alt={`${study.client} case study visual`}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-secondary/60 p-4">
                    <BarChart3 size={18} className="text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">Traffic Growth</p>
                    <p className="text-lg font-semibold mt-1">{study.trafficGrowth}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/60 p-4">
                    <Users size={18} className="text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">Leads Generated</p>
                    <p className="text-lg font-semibold mt-1">{study.leadsGenerated}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border bg-secondary/60 p-4">
                    <h3 className="font-display text-lg font-semibold mb-2">Client Problem</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{study.problem}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/60 p-4">
                    <h3 className="font-display text-lg font-semibold mb-2">Solution Provided</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{study.solution}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-secondary/60 p-4">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-3">
                    <Code2 size={16} />
                    Technology Used
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {study.technology.map((tech) => (
                      <span key={tech} className="text-xs px-3 py-1 rounded-full border border-border bg-background text-muted-foreground">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border bg-secondary/60 p-4">
                    <p className="text-xs text-muted-foreground mb-2">Before</p>
                    <p className="text-sm font-medium leading-relaxed">{study.before}</p>
                  </div>
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
                    <p className="text-xs text-primary mb-2">After</p>
                    <p className="text-sm font-medium leading-relaxed">{study.after}</p>
                  </div>
                </div>

                <blockquote className="rounded-xl border border-border bg-secondary/60 p-4">
                  <MessageSquareQuote size={20} className="text-primary mb-3" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{study.testimonial}</p>
                  <footer className="text-xs text-primary mt-3">Client Testimonial</footer>
                </blockquote>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Image size={14} className="text-primary" />
                  Screenshot section included for each case study
                </div>
              </div>
            </div>
          </motion.article>
        ))}

        <div className="service-card flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <h2 className="font-display text-2xl font-bold mb-2">Want results like these?</h2>
            <p className="text-sm text-muted-foreground">Book a free strategy call and we will map the best growth path for your business.</p>
          </div>
          <Link to="/contact" className="inline-flex items-center justify-center gap-2 gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground">
            Get Free Strategy Call <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
    <ContactForm />
    </>
  );
};

export default CaseStudiesPage;
