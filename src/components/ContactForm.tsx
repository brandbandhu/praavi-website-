import { useState } from "react";
import { Send } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";

const ContactForm = () => {
  const ref = useSectionReveal();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const [{ sendLeadToPrivyr }, { saveContactLead }] = await Promise.all([
        import("@/lib/leadWebhook"),
        import("@/lib/contactLeadApi"),
      ]);
      const payload = {
        sourceForm: "contact-form",
        name: form.name,
        email: form.email,
        phone: form.phone,
        service: form.service,
        message: form.message,
      } as const;
      await Promise.all([
        sendLeadToPrivyr(payload),
        saveContactLead({
          name: form.name,
          email: form.email,
          phone: form.phone,
          service: form.service,
          message: form.message,
        }),
      ]);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setForm({ name: "", email: "", phone: "", service: "", message: "" });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not submit the form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-padding" ref={ref}>
      <div className="container-max">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left side */}
          <div className="section-reveal">
            <span className="text-sm text-primary font-medium uppercase tracking-wider">Get In Touch</span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">
              Have any questions?{" "}
              <span className="gradient-text">Reach out!</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Fill out the form and our team will get back to you shortly. We're here to help your business grow.
            </p>

            <div className="space-y-4">
              <h3 className="font-display font-semibold text-sm text-accent">Our Services</h3>
              <div className="flex flex-wrap gap-2">
                {["Website Development", "SEO", "Google Ads", "Social Media Ads", "Branding"].map((s) => (
                  <span key={s} className="text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground border border-border">
                    {s}
                  </span>
                ))}
              </div>

              <h3 className="font-display font-semibold text-sm text-accent mt-6">Why Choose Us?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 150+ Satisfied Clients</li>
                <li>✓ 24/7 Support</li>
                <li>✓ Data-Driven Approach</li>
                <li>✓ Transparent Pricing</li>
              </ul>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="section-reveal">
            {submitted ? (
              <div className="service-card flex flex-col items-center justify-center py-16 text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="font-display text-xl font-bold mb-2">Thank You!</h3>
                <p className="text-sm text-muted-foreground">We'll reach out within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="service-card p-6 sm:p-8 space-y-4">
                {submitError ? <p role="alert" className="text-sm text-destructive">{submitError}</p> : null}
                <input
                  type="text"
                  required
                  aria-label="Your name"
                  placeholder="Your Name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <input
                  type="email"
                  required
                  aria-label="Email address"
                  placeholder="Email Address *"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <input
                  type="tel"
                  aria-label="Phone number"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <select
                  aria-label="Select service"
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
                  aria-label="Your message"
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
