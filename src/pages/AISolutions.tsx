import { motion } from "framer-motion";
import { ArrowRight, Bot, BrainCircuit, Headphones, MessageCircle, Share2, Workflow, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import SeoHead from "@/components/SeoHead";

const aiServices = [
  { icon: Bot, title: "AI Chatbot Development", desc: "Website chatbots trained for FAQs, service enquiries, lead capture, and appointment booking." },
  { icon: MessageCircle, title: "WhatsApp Automation", desc: "Automated WhatsApp replies, follow-ups, reminders, and enquiry qualification flows." },
  { icon: Workflow, title: "CRM Automation", desc: "Lead routing, pipeline stages, task reminders, and sales-team visibility in one clean process." },
  { icon: Zap, title: "Lead Automation", desc: "Instant alerts, lead scoring, nurture messages, and conversion tracking from every source." },
  { icon: Headphones, title: "AI Customer Support", desc: "Support assistants that answer common questions and escalate serious issues to your team." },
  { icon: Share2, title: "AI Marketing Solutions", desc: "Campaign ideas, content workflows, reporting summaries, and audience follow-up automation." },
];

const AISolutionsPage = () => (
  <>
    <SeoHead
      title="AI Solutions for Business | Chatbots, WhatsApp & CRM Automation | Praavi"
      description="Praavi Consultants builds AI chatbots, WhatsApp automation, CRM automation, lead automation, AI customer support, and AI marketing solutions for growing businesses."
      canonicalPath="/ai-solutions"
    />
    <PageHero
      title="AI Solutions for Faster Leads and Smarter Follow-Ups"
      highlightWord="AI Solutions"
      subtitle="Automate chat, WhatsApp, CRM, lead routing, and customer support without losing the human touch."
    />

    <section className="section-padding">
      <div className="container-max">
        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8 items-start">
          <div className="service-card lg:sticky lg:top-28">
            <BrainCircuit size={36} className="text-primary mb-4" />
            <h2 className="font-display text-3xl font-bold mb-3">Automations that respond while your team is busy.</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              We connect your website, ads, forms, WhatsApp, and CRM so leads are captured, qualified, followed up, and tracked in real time.
            </p>
            <Link to="/contact" className="inline-flex items-center gap-2 gradient-bg px-5 py-3 rounded-xl text-sm font-semibold text-primary-foreground">
              Build My Automation <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aiServices.map((service, index) => (
              <motion.article
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="service-card"
              >
                <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center mb-4">
                  <service.icon size={20} className="text-primary-foreground" />
                </div>
                <h2 className="font-display text-lg font-semibold mb-2">{service.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
    <ContactForm />
  </>
);

export default AISolutionsPage;
