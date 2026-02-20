import { BarChart3, Megaphone, Sparkles, Target, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";

const platforms = [
  { name: "Facebook", users: "2.9B+ users" },
  { name: "Instagram", users: "1.4B+ users" },
  { name: "Twitter", users: "450M+ users" },
  { name: "YouTube", users: "2.5B+ users" },
  { name: "TikTok", users: "1B+ users" },
];

const serviceCards = [
  { title: "Content Creation", desc: "Eye-catching visuals and engaging copy for your brand" },
  { title: "Paid Advertising", desc: "Targeted campaigns to reach your ideal audience" },
  { title: "Influencer Marketing", desc: "Leverage trusted voices to promote your brand" },
  { title: "Analytics & Reporting", desc: "Measure performance and optimize your strategy" },
];

const whyCards = [
  { icon: TrendingUp, title: "Audience Growth", desc: "Expand your reach and attract new customers" },
  { icon: Sparkles, title: "Brand Awareness", desc: "Increase visibility and recognition" },
  { icon: Target, title: "Lead Generation", desc: "Convert followers into paying customers" },
  { icon: BarChart3, title: "Data-Driven", desc: "Strategies based on real performance metrics" },
];

const processSteps = [
  "Strategy Development",
  "Content Planning",
  "Community Building",
  "Paid Campaign Management",
  "Performance Analysis",
  "Continuous Optimization",
];

const resultStats = [
  { value: "5-10x", label: "Engagement Rate" },
  { value: "50%+", label: "Lower Cost Per Lead" },
  { value: "300+", label: "Campaigns Managed" },
  { value: "24/7", label: "Community Management" },
];

const SocialMediaManagementServicePage = () => {
  return (
    <>
      <PageHero
        tag="Social Media Marketing Services"
        title="#1 Social Media Marketing Agency"
        subtitle="Grow your brand, engage your audience, and drive conversions with expert social media marketing across major platforms."
      />

      <section className="section-padding">
        <div className="container-max max-w-5xl">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Link
              to="/contact"
              className="gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get Free Strategy
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition-colors"
            >
              Call Now
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {platforms.map((platform) => (
              <article key={platform.name} className="service-card text-center">
                <h3 className="font-display text-lg font-semibold">{platform.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{platform.users}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container-max">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Our <span className="gradient-text">Services</span>
            </h2>
            <p className="text-muted-foreground mt-3">
              Comprehensive social media solutions tailored to your business goals
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceCards.map((card) => (
              <article key={card.title} className="service-card">
                <h3 className="font-display text-lg font-semibold mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Why <span className="gradient-text">Social Media Marketing?</span>
            </h2>
            <p className="text-muted-foreground mt-3">
              Social media is where your customers spend their time. Make sure your brand stands out.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyCards.map((card) => (
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

      <section className="section-padding bg-card">
        <div className="container-max">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-10">
            Our <span className="gradient-text">Process</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processSteps.map((step, index) => (
              <article key={step} className="service-card">
                <p className="text-xs text-primary font-semibold mb-2">STEP {index + 1}</p>
                <h3 className="font-display text-lg font-semibold">{step}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-10">
            Proven <span className="gradient-text">Results</span>
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {resultStats.map((stat) => (
              <article key={stat.label} className="service-card text-center">
                <p className="font-display text-3xl font-bold gradient-text-orange">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container-max max-w-4xl text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">
            Ready to Grow Your <span className="gradient-text">Social Presence?</span>
          </h2>
          <p className="text-muted-foreground mt-3">
            Let&apos;s create a social media strategy that gets you noticed by the right audience.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 mt-6 gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Get Started Now
            <Megaphone size={16} />
          </Link>
        </div>
      </section>

      <ContactForm />
    </>
  );
};

export default SocialMediaManagementServicePage;
