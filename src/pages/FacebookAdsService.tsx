import { BarChart3, Image, Layers3, Target, Video } from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";

const managementCards = [
  {
    title: "Campaign Strategy",
    points: [
      "Objective selection aligned with business goals",
      "Budget and bidding strategy for profitable scaling",
      "Full-funnel structure: prospecting, retargeting, retention",
    ],
  },
  {
    title: "Audience Targeting",
    points: [
      "Custom and lookalike audiences from best customers",
      "Layered interest and behavior targeting",
      "Demographic filtering to reduce wasted spend",
    ],
  },
  {
    title: "Ad Creatives",
    points: [
      "High-converting ad copy and creative angles",
      "Static, video, carousel, and UGC-style creatives",
      "Continuous A/B testing to find winning ads",
    ],
  },
];

const objectiveCards = [
  "Brand Awareness",
  "Traffic",
  "Conversions",
  "Video Views",
  "Engagement",
  "App Installs",
];

const formatCards = [
  { icon: Image, title: "Image Ads", desc: "Simple, high-impact single image ads for fast testing." },
  { icon: Video, title: "Video Ads", desc: "Engaging video ads that tell your brand story." },
  { icon: Layers3, title: "Carousel Ads", desc: "Showcase multiple products or benefits in one ad." },
  { icon: Target, title: "Story Ads", desc: "Full-screen vertical ads for Facebook and Instagram stories." },
  { icon: BarChart3, title: "Lead Ads", desc: "Capture leads directly inside Facebook and Instagram." },
  { icon: Layers3, title: "Collection Ads", desc: "Combine lifestyle creatives with shoppable product feeds." },
];

const processSteps = [
  { step: "01", title: "Strategy Session", desc: "Define goals, KPIs, and paid social budget." },
  { step: "02", title: "Audience Research", desc: "Segment audiences by intent and purchase potential." },
  { step: "03", title: "Creative Development", desc: "Build scroll-stopping ad creatives and copy." },
  { step: "04", title: "Campaign Setup", desc: "Configure campaigns, ad sets, tracking, and bidding." },
  { step: "05", title: "Launch & Monitor", desc: "Go live with continuous testing and optimization." },
  { step: "06", title: "Reporting", desc: "Share ROI-focused reports and scaling recommendations." },
];

const FacebookAdsServicePage = () => {
  return (
    <>
      <PageHero
        tag="Social Media Ads Services"
        title="Facebook Ads Management Agency"
        highlightWord="Facebook Ads"
        subtitle="Scale your business with data-driven Facebook and Instagram ad campaigns focused on leads, sales, and ROI."
      />

      <section className="section-padding">
        <div className="container-max max-w-4xl text-center">
          <p className="text-muted-foreground leading-relaxed">
            From strategy and targeting to creatives and optimization, we manage your full Facebook and Instagram ads
            funnel to maximize performance and profitability.
          </p>
          <Link
            to="/contact"
            className="inline-block mt-6 gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Get Your Free Ads Audit
          </Link>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container-max">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-10">
            Comprehensive <span className="gradient-text">Facebook Ads Management</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {managementCards.map((card) => (
              <article key={card.title} className="service-card">
                <h3 className="font-display text-xl font-semibold mb-4">{card.title}</h3>
                <ul className="space-y-2">
                  {card.points.map((point) => (
                    <li key={point} className="text-sm text-muted-foreground leading-relaxed">
                      • {point}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-10">
            Campaign Objectives We <span className="gradient-text">Optimize For</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {objectiveCards.map((item) => (
              <div key={item} className="service-card text-center">
                <p className="text-sm font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container-max">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-10">
            Facebook & Instagram <span className="gradient-text">Ad Formats</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {formatCards.map((card) => (
              <article key={card.title} className="service-card">
                <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center mb-4">
                  <card.icon size={20} className="text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-10">
            Our Facebook Ads <span className="gradient-text">Process</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processSteps.map((step) => (
              <article key={step.step} className="service-card">
                <p className="text-xs font-semibold text-primary mb-2">STEP {step.step}</p>
                <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ContactForm />
    </>
  );
};

export default FacebookAdsServicePage;
