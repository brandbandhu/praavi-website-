import { BarChart3, CircleDollarSign, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";

const coreCards = [
  {
    icon: Target,
    title: "Intent Targeting",
    desc: "Reach users based on high-intent keywords, audience signals, and in-market behavior.",
  },
  {
    icon: CircleDollarSign,
    title: "Budget Efficiency",
    desc: "Control spend and improve ROI through bid strategy, negative keywords, and smart optimization.",
  },
  {
    icon: BarChart3,
    title: "Conversion Tracking",
    desc: "Track leads, calls, and sales with reliable event setup and campaign-level reporting.",
  },
  {
    icon: Zap,
    title: "Growth at Scale",
    desc: "Scale winning campaigns across search, display, video, shopping, and app ecosystems.",
  },
];

const adServices = [
  {
    title: "Search Ads",
    desc: "Capture high-intent users actively searching for your services and products.",
    path: "/services/google-ads/search-ads",
  },
  {
    title: "Display Ads",
    desc: "Build awareness and retarget audiences across Google’s Display Network.",
    path: "/services/google-ads/display-ads",
  },
  {
    title: "Shopping Ads",
    desc: "Show product listings with image, price, and brand to drive e-commerce sales.",
    path: "/services/google-ads/shopping-ads",
  },
  {
    title: "Video Ads",
    desc: "Run YouTube campaigns for awareness, engagement, and conversion-driven outcomes.",
    path: "/services/google-ads/video-ads",
  },
  {
    title: "App Ads",
    desc: "Scale installs and in-app actions across Google properties with app campaigns.",
    path: "/services/google-ads/app-ads",
  },
  {
    title: "Performance Max",
    desc: "Leverage multi-channel automation with audience signals and conversion-focused optimization.",
    path: "/services/google-ads/performance-max-ads",
  },
  {
    title: "Remarketing Campaigns",
    desc: "Re-engage previous visitors and increase conversion probability with targeted messaging.",
    path: "/services/google-ads/display-ads",
  },
  {
    title: "Google Ads Audit",
    desc: "Identify budget leaks, account issues, and growth opportunities with a deep account review.",
    path: "/services/google-ads/search-ads",
  },
];

const GoogleAdsServicePage = () => {
  return (
    <>
      <PageHero
        tag="Google Ads Services"
        title="#1 Google Ads Agency"
        subtitle="Generate qualified leads and sales with data-driven Google Ads campaigns built for measurable ROI."
      />

      <section className="section-padding">
        <div className="container-max max-w-4xl text-center">
          <p className="text-muted-foreground leading-relaxed">
            Our Google Ads team builds performance campaigns aligned with your revenue goals. We combine strategy,
            creative, and continuous optimization to maximize conversions while controlling spend.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/contact"
              className="gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get Free Google Ads Audit
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition-colors"
            >
              Talk to Expert
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
              Our <span className="gradient-text">Google Ads Services</span>
            </h2>
            <p className="text-muted-foreground mt-3">
              End-to-end paid media solutions for growth-focused brands.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adServices.map((service) => (
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

export default GoogleAdsServicePage;
