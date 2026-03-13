import { Brush, Image as ImageIcon, LayoutTemplate, Package, PenTool, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";

const coreCards = [
  {
    icon: Brush,
    title: "Brand Identity",
    desc: "Build a memorable brand system with logo, color, typography, and visual guidelines.",
  },
  {
    icon: ImageIcon,
    title: "Social Media Creatives",
    desc: "Design high-performing post and ad creatives tailored for engagement and conversions.",
  },
  {
    icon: LayoutTemplate,
    title: "UI/UX Design",
    desc: "Create intuitive interfaces and conversion-friendly user journeys for websites and apps.",
  },
  {
    icon: Package,
    title: "Print & Packaging",
    desc: "Develop impactful print, brochure, and packaging assets aligned with your brand voice.",
  },
];

const designServices = [
  {
    title: "Logo Design",
    desc: "Unique, modern logo concepts with practical brand usage variations.",
    path: "/services/graphic-design/brand-identity",
  },
  {
    title: "Brand Kit Design",
    desc: "Typography, color system, iconography, and visual consistency guidelines.",
    path: "/services/graphic-design/brand-identity",
  },
  {
    title: "Social Media Design",
    desc: "Static and motion creatives for organic and paid social campaigns.",
    path: "/services/graphic-design/social-media-design",
  },
  {
    title: "UI/UX Design",
    desc: "Wireframes, prototypes, and polished screens for better product usability.",
    path: "/services/graphic-design/ui-ux-design",
  },
  {
    title: "Print Design",
    desc: "Business cards, flyers, brochures, standees, and branded marketing materials.",
    path: "/services/graphic-design/print-design",
  },
  {
    title: "Motion Graphics",
    desc: "Animated visuals for ads, explainers, and social content.",
    path: "/services/graphic-design/motion-graphics",
  },
  {
    title: "Packaging Design",
    desc: "Shelf-ready packaging that improves appeal and supports purchase decisions.",
    path: "/services/graphic-design/packaging",
  },
  {
    title: "Ad Creative Design",
    desc: "Performance ad creatives optimized for CTR and conversion quality.",
    path: "/services/graphic-design/social-media-design",
  },
];

const processSteps = [
  { step: "01", title: "Discovery", desc: "Understand brand goals, audience, and visual direction." },
  { step: "02", title: "Concepts", desc: "Develop multiple design concepts and creative routes." },
  { step: "03", title: "Refinement", desc: "Iterate selected direction with detailed improvements." },
  { step: "04", title: "Delivery", desc: "Share final files in web and print-ready formats." },
];

const GraphicDesignServicePage = () => {
  return (
    <>
      <PageHero
        tag="Graphic Design Services"
        title="#1 Graphic Design Agency"
        subtitle="Creative designs that strengthen your brand identity and improve campaign performance."
      />

      <section className="section-padding">
        <div className="container-max max-w-4xl text-center">
          <p className="text-muted-foreground leading-relaxed">
            We create design systems and campaign creatives that make your brand stand out. From identity to
            conversion-focused ad design, every asset is crafted for visual impact and business outcomes.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/contact"
              className="gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get Free Design Consultation
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition-colors"
            >
              View Portfolio
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
              Our <span className="gradient-text">Graphic Design Services</span>
            </h2>
            <p className="text-muted-foreground mt-3">
              End-to-end design support for brand growth and marketing performance.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {designServices.map((service) => (
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

      <section className="section-padding bg-card">
        <div className="container-max">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-10">
            Our Design <span className="gradient-text">Workflow</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step) => (
              <article key={step.step} className="service-card">
                <p className="text-xs font-semibold text-primary mb-2">STEP {step.step}</p>
                <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </article>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Start Your Design Project
              <Sparkles size={16} />
            </Link>
          </div>
        </div>
      </section>

      <ContactForm />
    </>
  );
};

export default GraphicDesignServicePage;
