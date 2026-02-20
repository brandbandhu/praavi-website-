import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";

interface ProcessStep {
  step: string;
  title: string;
  desc: string;
}

interface GoogleAdsSubServiceLayoutProps {
  tag?: string;
  title: string;
  subtitle: string;
  intro: string;
  ctaLabel: string;
  benefits: string[];
  deliverables: string[];
  process: ProcessStep[];
}

const GoogleAdsSubServiceLayout = ({
  tag = "Service Details",
  title,
  subtitle,
  intro,
  ctaLabel,
  benefits,
  deliverables,
  process,
}: GoogleAdsSubServiceLayoutProps) => {
  const highlightWord = title.replace(" Service", "");

  return (
    <>
      <PageHero
        tag={tag}
        title={title}
        highlightWord={highlightWord}
        subtitle={subtitle}
      />

      <section className="section-padding">
        <div className="container-max max-w-4xl text-center">
          <p className="text-muted-foreground leading-relaxed">{intro}</p>
          <Link
            to="/contact"
            className="inline-block mt-6 gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {ctaLabel}
          </Link>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container-max">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-10">
            Why Use <span className="gradient-text">{highlightWord}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {benefits.map((item) => (
              <article key={item} className="service-card flex items-start gap-3">
                <CheckCircle2 size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max max-w-5xl">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-10">
            What We Deliver In <span className="gradient-text">{highlightWord}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {deliverables.map((item) => (
              <div key={item} className="service-card">
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container-max">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-10">
            Our <span className="gradient-text">{highlightWord}</span> Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {process.map((item) => (
              <article key={item.step} className="service-card">
                <p className="text-xs font-semibold text-primary mb-2">STEP {item.step}</p>
                <h3 className="font-display text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </article>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/contact"
              className="inline-block gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get Free Strategy Plan
            </Link>
          </div>
        </div>
      </section>

      <ContactForm />
    </>
  );
};

export default GoogleAdsSubServiceLayout;
