import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import SeoHead from "@/components/SeoHead";
import { industryPages } from "@/lib/growthPages";

const IndustryPage = () => {
  const { slug } = useParams();
  const page = industryPages.find((item) => item.slug === slug);
  if (!page) return <Navigate to="/services" replace />;
  const Icon = page.icon;

  return (
    <>
      <SeoHead
        title={`${page.title} in Pune | Praavi Consultants`}
        description={`${page.title} by Praavi Consultants. ${page.promise}`}
        canonicalPath={`/industries/${page.slug}`}
      />
      <PageHero title={page.title} highlightWord="Marketing" subtitle={page.promise} />
      <section className="section-padding">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8">
            <aside className="service-card h-fit">
              <Icon size={38} className="text-primary mb-4" />
              <p className="text-xs uppercase tracking-wider text-accent mb-2">Built for</p>
              <h2 className="font-display text-2xl font-bold mb-4">{page.audience}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{page.keywords}</p>
              <Link to="/contact" className="inline-flex items-center gap-2 gradient-bg px-5 py-3 rounded-xl text-sm font-semibold text-primary-foreground">
                Get Industry Strategy <ArrowRight size={16} />
              </Link>
            </aside>

            <div className="space-y-6">
              <article className="service-card">
                <h2 className="font-display text-2xl font-bold mb-5">Common Growth Problems</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {page.challenges.map((item) => (
                    <div key={item} className="rounded-xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
                      {item}
                    </div>
                  ))}
                </div>
              </article>

              <article className="service-card">
                <h2 className="font-display text-2xl font-bold mb-5">Praavi Solution</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {page.solutions.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 size={18} className="text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
      <ContactForm />
    </>
  );
};

export default IndustryPage;
