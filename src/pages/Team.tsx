import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Users } from "lucide-react";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import SeoHead from "@/components/SeoHead";
import founderImage from "@/assets/founders/founder .png";
import ceoImage from "@/assets/founders/CEO.png";

const trustPoints = [
  "Founder-led planning for every important website and marketing decision.",
  "Transparent communication with clear timelines, scope, and reporting.",
  "Growth decisions backed by data, not guesswork or generic templates.",
  "Long-term client relationships built on measurable business outcomes.",
];

const ceoPoints = [
  "Leads daily execution across web, SEO, performance marketing, and automation teams.",
  "Reviews campaign quality, lead flow, and conversion opportunities before scale.",
  "Keeps delivery focused on speed, accountability, and client-visible progress.",
];

const TeamPage = () => (
  <>
    <SeoHead
      title="Praavi Consultants Team | Developers, Designers, SEO & Marketing Experts"
      description="Meet the Praavi Consultants team including founder-led strategy, developers, designers, SEO experts, and performance marketing specialists."
      canonicalPath="/team"
    />
    <PageHero
      title="Meet the People Growing Your Business"
      highlightWord="People"
      subtitle="Founder-led strategy supported by developers, designers, SEO specialists, and performance marketers."
    />

    <section className="section-padding">
      <div className="container-max">
        <div className="space-y-8 mb-14">
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="service-card overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 items-center">
              <div className="h-[460px] lg:h-[620px] rounded-xl border border-border bg-secondary/60 overflow-hidden">
                <img src={founderImage} alt="Praavi Consultants founder" className="w-full h-full object-cover object-[center_18%]" />
              </div>
              <div>
                <p className="text-sm text-primary font-semibold mb-2">Founder</p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Founder-Led Strategy, Built on Trust</h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                  Praavi's founder works closely on business discovery, brand positioning, website direction, and
                  growth strategy so every client gets senior-level thinking from the first conversation.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trustPoints.map((point) => (
                    <div key={point} className="flex items-start gap-3 rounded-xl border border-border bg-secondary/50 p-4">
                      <ShieldCheck size={18} className="text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="service-card overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
              <div className="order-2 lg:order-1">
                <p className="text-sm text-primary font-semibold mb-2">CEO</p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Execution Leadership That Keeps Growth Moving</h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                  The CEO leads daily delivery, coordinates specialist teams, and keeps every project focused on
                  practical outcomes: better websites, stronger visibility, faster follow-up, and qualified leads.
                </p>
                <div className="space-y-3">
                  {ceoPoints.map((point) => (
                    <div key={point} className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-1 lg:order-2 h-[460px] lg:h-[620px] rounded-xl border border-border bg-secondary/60 overflow-hidden">
                <img src={ceoImage} alt="Praavi Consultants CEO" className="w-full h-full object-cover object-[center_18%]" />
              </div>
            </div>
          </motion.article>
        </div>

        <div className="service-card mt-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-2">
              <Users size={16} />
              People trust people
            </div>
            <h2 className="font-display text-2xl font-bold">Your account is handled by specialists, not a generic support queue.</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Every project is planned with strategy, executed by the right function, and reviewed through measurable outcomes.
          </p>
        </div>
      </div>
    </section>
    <ContactForm />
  </>
);

export default TeamPage;
