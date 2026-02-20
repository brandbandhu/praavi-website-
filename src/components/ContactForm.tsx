import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Send } from "lucide-react";
import { sendLeadToPrivyr } from "@/lib/leadWebhook";

const ContactForm = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      await sendLeadToPrivyr({
        sourceForm: "contact-form",
        name: form.name,
        email: form.email,
        phone: form.phone,
        service: form.service,
        message: form.message,
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setForm({ name: "", email: "", phone: "", service: "", message: "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-padding" ref={ref}>
      <div className="container-max">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm text-primary font-medium uppercase tracking-wider">Get In Touch</span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">
              Have any questions?{" "}
              <span className="gradient-text">Reach out!</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Fill out the form and our team will get back to you shortly. We're here to help your business grow.
            </p>

            <div className="space-y-4">
              <h4 className="font-display font-semibold text-sm text-accent">Our Services</h4>
              <div className="flex flex-wrap gap-2">
                {["Website Development", "SEO", "Google Ads", "Social Media Ads", "Branding"].map((s) => (
                  <span key={s} className="text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground border border-border">
                    {s}
                  </span>
                ))}
              </div>

              <h4 className="font-display font-semibold text-sm text-accent mt-6">Why Choose Us?</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 150+ Satisfied Clients</li>
                <li>✓ 24/7 Support</li>
                <li>✓ Data-Driven Approach</li>
                <li>✓ Transparent Pricing</li>
              </ul>
            </div>
          </motion.div>

          {/* Right side - Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {submitted ? (
              <div className="service-card flex flex-col items-center justify-center py-16 text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="font-display text-xl font-bold mb-2">Thank You!</h3>
                <p className="text-sm text-muted-foreground">We'll reach out within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="service-card p-6 sm:p-8 space-y-4">
                <input
                  type="text"
                  required
                  placeholder="Your Name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <input
                  type="email"
                  required
                  placeholder="Email Address *"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <select
                  required
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  <option value="" disabled>Select Service *</option>
                  <option value="web-development">Website Development</option>
                  <option value="seo">SEO</option>
                  <option value="google-ads">Google Ads</option>
                  <option value="social-ads">Instagram & Facebook Ads</option>
                  <option value="branding">Branding</option>
                </select>
                <textarea
                  placeholder="Your Message"
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full gradient-bg px-6 py-3.5 rounded-xl font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {submitting ? "Submitting..." : "Submit"}
                  <Send size={16} />
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
