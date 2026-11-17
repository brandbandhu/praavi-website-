import { BarChart3, Link2, Search, Target } from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import SeoHead from "@/components/SeoHead";

const coreCards = [
  {
    icon: Search,
    title: "Keyword Research",
    desc: "Map relevant searches to your services and existing pages so content answers the right customer questions.",
  },
  {
    icon: Target,
    title: "On-Page SEO",
    desc: "Review titles, headings, internal links and content to make important pages easier to understand.",
  },
  {
    icon: Link2,
    title: "Link Building",
    desc: "Review relevant link opportunities and authority-building activity as part of your agreed SEO scope.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    desc: "Review organic visibility, website traffic and enquiries to guide the next round of improvements.",
  },
];

const seoServices = [
  {
    title: "Technical SEO",
    desc: "Identify crawlability, indexing, site-structure and performance issues, then prioritize practical fixes.",
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
    desc: "Review Google Business Profile information, local citations and service-area relevance using accurate business details.",
    path: "/services/seo-services/local-seo",
  },
  {
    title: "Intent SEO",
    desc: "Map search intent to existing pages and plan content that answers buyer questions without duplicating service pages.",
    path: "/services/seo-services/content-strategy",
  },
  {
    title: "SEO Audits",
    desc: "Start with an audit, agree priorities and review implementation before planning the next improvements.",
    path: "/services/seo-services/technical-seo",
  },
  {
    title: "E-Commerce SEO",
    desc: "Optimize product, category, and collection pages to increase non-paid online sales.",
    path: "/services/seo-services/e-commerce-seo",
  },
  {
    title: "Content SEO",
    desc: "Plan useful articles and service-page updates, then review how they support relevant traffic and enquiries.",
    path: "/services/seo-services/content-strategy",
  },
];

const SEOServicePage = () => {
  return (
    <>
      <SeoHead
        title="SEO Company in Pune | Praavi Consultants"
        description="SEO services for Pune businesses, including technical audits, local SEO and content planning. Discuss your website goals with Praavi Consultants."
        canonicalPath="/seo-services"
      />
      <PageHero
        tag="SEO Services"
        title="SEO Company in Pune"
        subtitle="Technical, on-page and local SEO focused on useful content, search visibility and relevant enquiries."
      />

      <section className="section-padding">
        <div className="container-max max-w-4xl text-center">
          <p className="text-muted-foreground leading-relaxed">
            Our SEO work starts with your existing website, services and customer searches. We use technical audits,
            on-page improvements, content planning and local SEO to help the right visitors find useful pages. For projects
            that also need <Link to="/website-development" className="text-primary hover:underline">website development</Link>,
            we connect search requirements with the build.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/contact"
              className="gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get Free Audit
            </Link>
            <a
              href="tel:+919699369117"
              className="px-6 py-3 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition-colors"
            >
              Call Now
            </a>
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
              Audit findings guide the plan, followed by implementation and ongoing review. Read our
              <Link to="/blog/on-page-seo-vs-off-page-seo-complete-guide" className="text-primary hover:underline"> on-page and off-page SEO guide</Link> and
              explore how SEO fits your <Link to="/" className="text-primary hover:underline">digital marketing strategy</Link>.
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
