import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import SeoHead from "@/components/SeoHead";
import { puneLandingPages } from "@/lib/growthPages";

const PuneLandingPage = () => {
  const { slug } = useParams();
  const page = puneLandingPages.find((item) => item.slug === slug);
  if (!page) return <Navigate to="/services" replace />;
  const Icon = page.icon;

  return (
    <>
      <SeoHead
        title={`${page.title} | Praavi Consultants`}
        description={`${page.title} services by Praavi Consultants. ${page.promise}`}
        canonicalPath={`/pune/${page.slug}`}
      />
      <PageHero title={page.title} highlightWord="Pune" subtitle={page.promise} />
      <section className="section-padding">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 items-start">
            <article className="service-card">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                  <Icon size={22} className="text-primary-foreground" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wider text-accent">Local SEO Page</p>
                  <h2 className="font-display text-2xl font-bold">{page.service} in Pune</h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Praavi Consultants supports businesses across Loni Kalbhor, Hadapsar, Manjri, Uruli Kanchan, and Pune with practical execution and measurable reporting.
              </p>
              <Link to="/contact" className="inline-flex items-center gap-2 gradient-bg px-5 py-3 rounded-xl text-sm font-semibold text-primary-foreground">
                Get Free Strategy Call <ArrowRight size={16} />
              </Link>
            </article>

            <article className="service-card">
              <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-4">
                <MapPin size={16} />
                What you get
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {page.deliverables.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 size={18} className="text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>
      <ContactForm />
    </>
  );
};

export default PuneLandingPage;
