import { CheckCircle2, ShoppingBag, Store, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";

const projectCards = [
  "Fashion D2C Store",
  "Electronics Brand Store",
  "Health & Wellness Store",
  "B2B Catalog Store",
  "Luxury Products Store",
  "Subscription Box Store",
  "Home Decor Store",
  "Beauty & Skincare Store",
];

const shopifyBuildCards = [
  {
    title: "WordPress to Shopify Migration",
    desc: "Seamless migration and Shopify setup without losing SEO value or core content.",
  },
  {
    title: "Custom Shopify App Development",
    desc: "Private and public Shopify app development tailored to your business logic.",
  },
  {
    title: "Theme Creation from Scratch",
    desc: "Pixel-perfect, performance-optimized Shopify theme development for your brand.",
  },
  {
    title: "Custom Section & Feature Setup",
    desc: "Tailored homepage blocks, product sections, and reusable content components.",
  },
  {
    title: "Advanced Discounts & Promotions",
    desc: "Custom discount rules and offer automation to improve conversions.",
  },
  {
    title: "Advanced Shopify Integrations",
    desc: "Integrate shipping, CRM, subscription, payment, and third-party tools.",
  },
];

const valuePoints = [
  "Certified Shopify developers and ecommerce experts",
  "Trusted by D2C and international brands",
  "Lightning-fast storefronts and optimized checkout",
  "Custom theme development and app integrations",
  "SEO, speed, and conversion rate optimization",
];

const ShopifyDevelopmentServicePage = () => {
  return (
    <>
      <PageHero
        tag="Shopify Development Services"
        title="Power Your Business with Shopify"
        highlightWord="Shopify"
        subtitle="We build custom Shopify solutions to help you sell better, scale faster, and look stunning."
      />

      <section className="section-padding">
        <div className="container-max max-w-4xl text-center">
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/contact"
              className="gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get a Callback
            </Link>
            <Link
              to="#shopify-services"
              className="px-6 py-3 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition-colors"
            >
              Explore Shopify Services
            </Link>
          </div>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container-max">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-10">
            Shopify Projects <span className="gradient-text">We&apos;ve Delivered</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {projectCards.map((project) => (
              <article key={project} className="service-card text-center">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center mx-auto mb-3">
                  <Store size={18} className="text-primary-foreground" />
                </div>
                <p className="text-sm">{project}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="shopify-services" className="section-padding">
        <div className="container-max">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              What We Build on <span className="gradient-text">Shopify</span>
            </h2>
            <p className="text-muted-foreground mt-3">
              End-to-end Shopify solutions for new stores, migration, and growth-stage optimization.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shopifyBuildCards.map((service) => (
              <article key={service.title} className="service-card">
                <h3 className="font-display text-lg font-semibold mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container-max grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <article className="service-card">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Build a <span className="gradient-text">High-Converting</span> Shopify Store
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Our Shopify experts craft fast, scalable, and mobile-first stores tailored to your brand vision and
              growth goals.
            </p>
            <div className="space-y-3">
              {valuePoints.map((point) => (
                <div key={point} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 size={18} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="service-card">
            <h3 className="font-display text-2xl font-bold mb-3">Need Shopify Experts?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Share your store goals and we&apos;ll recommend the right Shopify roadmap for design, development, and growth.
            </p>
            <div className="space-y-3">
              <Link
                to="/contact"
                className="w-full inline-flex items-center justify-center gap-2 gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Send a Quick Message
                <ShoppingBag size={16} />
              </Link>
              <Link
                to="/contact"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition-colors"
              >
                Talk to Shopify Expert
                <Zap size={16} />
              </Link>
            </div>
          </article>
        </div>
      </section>

      <ContactForm />
    </>
  );
};

export default ShopifyDevelopmentServicePage;
