import { BarChart3, Link2, Search, Target } from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import SeoHead from "@/components/SeoHead";

const coreCards = [
  {
    icon: Search,
    title: "Keyword Research",
    desc: "Find the right high-intent keywords to rank higher and attract qualified traffic.",
  },
  {
    icon: Target,
    title: "On-Page SEO",
    desc: "Optimize content, structure, and metadata for better visibility and conversions.",
  },
  {
    icon: Link2,
    title: "Link Building",
    desc: "Build authority with quality backlinks through ethical off-page SEO strategies.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    desc: "Track rankings, traffic, and ROI with transparent performance reporting.",
  },
];

const seoServices = [
  {
    title: "Technical SEO",
    desc: "Optimize site structure, speed, crawlability, indexation, and Core Web Vitals.",
    path: "/services/seo-services/technical-seo",
  },
  {
    title: "On-Page SEO",
    desc: "Improve title tags, content relevance, internal linking, and page-level optimization.",
    path: "/services/seo-services/on-page-seo",
  },
  {
    title: "Off-Page SEO",
    desc: "Strengthen domain authority using white-hat backlink and outreach strategies.",
    path: "/services/seo-services/off-page-seo",
  },
  {
    title: "Local SEO",
    desc: "Dominate local search with Google Business Profile optimization and local citations.",
    path: "/services/seo-services/local-seo",
  },
  {
    title: "Intent SEO",
    desc: "Align content and landing pages with user search intent for better conversion quality.",
    path: "/services/seo-services/content-strategy",
  },
  {
    title: "SEO Audits",
    desc: "Run in-depth SEO audits to identify issues and prioritize technical/content fixes.",
    path: "/services/seo-services/technical-seo",
  },
  {
    title: "E-Commerce SEO",
    desc: "Optimize product, category, and collection pages to increase non-paid online sales.",
    path: "/services/seo-services/e-commerce-seo",
  },
  {
    title: "Content SEO",
    desc: "Create SEO-ready content clusters and landing pages that capture long-tail demand.",
    path: "/services/seo-services/content-strategy",
  },
];

const SEOServicePage = () => {
  return (
    <>
      <SeoHead
        title="SEO Services in Loni Kalbhor Pune | Professional SEO Company in Pune"
        description="Praavi Consultants offers professional SEO services Pune businesses trust, including technical SEO, local SEO services in Pune, and on-page optimization for higher rankings."
        canonicalPath="/seo-services"
      />
      <PageHero
        tag="SEO Services"
        title="SEO Services in Loni Kalbhor Pune"
        subtitle="Drive qualified traffic, increase conversions, and maximize ROI with performance-focused SEO services for Pune businesses."
      />

      <section className="section-padding">
        <div className="container-max max-w-4xl text-center">
          <p className="text-muted-foreground leading-relaxed">
            We combine technical precision, content strategy, and authority building to improve rankings and grow
            organic business outcomes. If you are looking for SEO experts in Loni Kalbhor, our team builds practical
            strategies for local and regional search growth.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/contact"
              className="gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get Free Audit
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition-colors"
            >
              Call Now
            </Link>
          </div>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container-max">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreCards.map((card) => (
              <article key={card.title} className="service-card">
                <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center mb-4">
                  <card.icon size={20} className="text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Our <span className="gradient-text">SEO Services</span>
            </h2>
            <p className="text-muted-foreground mt-3">
              Comprehensive SEO solutions tailored to your business goals.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {seoServices.map((service) => (
              <article key={service.title} className="service-card flex flex-col">
                <h3 className="font-display text-lg font-semibold mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{service.desc}</p>
                <Link to={service.path} className="mt-auto text-sm text-primary hover:underline">
                  Learn more
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ContactForm />
    </>
  );
};

export default SEOServicePage;
