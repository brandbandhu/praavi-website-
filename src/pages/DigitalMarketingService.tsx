import { BarChart3, Gauge, Globe2, Megaphone, Search, Users } from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";

const marketingStack = [
  { title: "Google Ads", subtitle: "Search & Display" },
  { title: "Facebook/Instagram", subtitle: "Social Advertising" },
  { title: "LinkedIn", subtitle: "B2B Marketing" },
  { title: "YouTube", subtitle: "Video Advertising" },
  { title: "Email Marketing", subtitle: "Direct Communication" },
];

const services = [
  { title: "SEO Services", desc: "Increase organic traffic with proven search engine optimization strategies." },
  { title: "SEO Audits", desc: "Comprehensive website audits to identify technical and content improvements." },
  { title: "Content SEO", desc: "Content strategies that improve rankings and capture high-intent demand." },
  { title: "Ecommerce SEO", desc: "SEO for product and category pages to improve non-paid revenue." },
  { title: "Google Ads", desc: "Performance ad campaigns focused on qualified leads and measurable ROI." },
  { title: "Search Ads", desc: "Target users actively searching for your products and services." },
  { title: "Shopping Ads", desc: "Promote products directly in search with image-rich listings." },
  { title: "Performance Max Ads", desc: "Drive conversions across all Google channels with automation." },
  { title: "Display Ads", desc: "Expand brand reach and retarget across Google Display Network." },
  { title: "Social Media Ads", desc: "Meta, LinkedIn, and other social channels for scalable paid growth." },
  { title: "Content Marketing", desc: "Build authority and demand with conversion-focused content." },
  { title: "Social Media Marketing", desc: "Grow brand presence with organic and paid social execution." },
];

const stats = [
  { value: "87%", label: "Client Retention Rate" },
  { value: "4.8/5", label: "Average Client Rating" },
  { value: "250+", label: "Campaigns Managed" },
  { value: "$12M+", label: "Revenue Generated" },
];

const processSteps = [
  {
    icon: Search,
    title: "Strategy Development",
    desc: "We analyze your business goals and create a customized digital marketing plan.",
  },
  {
    icon: Megaphone,
    title: "Implementation",
    desc: "Our team executes campaigns across selected channels.",
  },
  {
    icon: Gauge,
    title: "Optimization",
    desc: "Continuous A/B testing and performance improvements.",
  },
  {
    icon: BarChart3,
    title: "Reporting",
    desc: "Monthly performance reports with actionable insights.",
  },
];

const DigitalMarketingServicePage = () => {
  return (
    <>
      <PageHero
        tag="Digital Marketing Services"
        title="Data-Driven Digital Marketing That Delivers Results"
        highlightWord="Delivers Results"
        subtitle="We help businesses grow through strategic online marketing campaigns focused on measurable ROI."
      />

      <section className="section-padding">
        <div className="container-max max-w-4xl text-center">
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/contact"
              className="gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get Free Audit
            </Link>
            <Link
              to="/portfolio"
              className="px-6 py-3 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition-colors"
            >
              See Case Studies
            </Link>
          </div>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container-max">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-10">
            Our <span className="gradient-text">Marketing Stack</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {marketingStack.map((item) => (
              <article key={item.title} className="service-card text-center">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center mx-auto mb-3">
                  <Globe2 size={18} className="text-primary-foreground" />
                </div>
                <h3 className="font-display text-base font-semibold">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{item.subtitle}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Comprehensive <span className="gradient-text">Marketing Services</span>
            </h2>
            <p className="text-muted-foreground mt-3">
              End-to-end digital marketing solutions tailored to your business goals.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <article key={service.title} className="service-card">
                <h3 className="font-display text-lg font-semibold mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container-max">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-10">
            Proven Marketing <span className="gradient-text">Results</span>
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <article key={stat.label} className="service-card text-center">
                <p className="font-display text-3xl font-bold gradient-text-orange">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-10">
            Our 4-Step <span className="gradient-text">Marketing Process</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, idx) => (
              <article key={step.title} className="service-card">
                <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center mb-3">
                  <step.icon size={18} className="text-primary-foreground" />
                </div>
                <p className="text-xs text-primary font-semibold mb-1">STEP {idx + 1}</p>
                <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </article>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Book Free Consultation
              <Users size={16} />
            </Link>
          </div>
        </div>
      </section>

      <ContactForm />
    </>
  );
};

export default DigitalMarketingServicePage;
