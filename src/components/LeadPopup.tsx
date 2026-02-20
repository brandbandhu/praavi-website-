import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import popupImage from "@/assets/popup-left.jpg.png";
import { sendLeadToPrivyr } from "@/lib/leadWebhook";

const LeadPopup = () => {
  const [show, setShow] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", budget: "" });

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      await sendLeadToPrivyr({
        sourceForm: "lead-popup",
        name: form.name,
        email: form.email,
        phone: form.phone,
        service: form.budget,
      });
      setSubmitted(true);
      setTimeout(() => setShow(false), 2000);
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShow(false)} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-5xl relative z-10 rounded-3xl overflow-hidden border border-border bg-card shadow-2xl"
        >
          <button
            onClick={() => setShow(false)}
            className="absolute top-3 right-3 z-20 rounded-full bg-background/80 backdrop-blur px-3 py-1.5 text-sm border border-border hover:border-primary/50 transition-colors"
          >
            <span className="inline-flex items-center gap-1.5">
              <X size={14} />
              Close
            </span>
          </button>

          {submitted ? (
            <div className="text-center py-16 px-6">
              <div className="text-3xl font-display font-bold gradient-text mb-3">Success</div>
              <h3 className="font-display text-xl font-bold mb-2">Thank You!</h3>
              <p className="text-sm text-muted-foreground">We will reach out within 24 hours.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[560px]">
              <div className="relative hidden md:block">
                <img
                  src={popupImage}
                  alt="Growth strategy visual"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="inline-flex text-xs px-3 py-1 rounded-full border border-primary/40 bg-background/40 backdrop-blur text-primary mb-3">
                    Limited Offer
                  </p>
                  <h3 className="font-display text-2xl font-bold leading-tight">
                    Let us craft your next high-converting campaign.
                  </h3>
                </div>
              </div>

              <div className="bg-card p-6 sm:p-8 flex flex-col justify-center">
                <p className="inline-flex w-fit text-xs px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary mb-4">
                  Limited Time Growth Offer
                </p>
                <h3 className="font-display text-2xl sm:text-3xl font-bold leading-tight mb-2">
                  Turn Your Website Into a <span className="gradient-text">Lead Machine</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Get a free growth blueprint with clear actions to increase leads in the next 30 days.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6 text-xs text-muted-foreground">
                  <span className="px-2 py-1 rounded-lg bg-secondary border border-border text-center">SEO Plan</span>
                  <span className="px-2 py-1 rounded-lg bg-secondary border border-border text-center">Ads Audit</span>
                  <span className="px-2 py-1 rounded-lg bg-secondary border border-border text-center">Quick Wins</span>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm mb-2">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="For example: John"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="0000 0000 00"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Looking For *</label>
                    <select
                      required
                      value={form.budget}
                      onChange={(e) => setForm({ ...form, budget: e.target.value })}
                      className="bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-full"
                    >
                      <option value="" disabled>Select service</option>
                      <option value="website-development">Website Development</option>
                      <option value="seo">SEO Services</option>
                      <option value="google-ads">Google Ads</option>
                      <option value="social-media">Social Media Marketing</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="gradient-bg px-6 py-3 rounded-xl font-semibold text-foreground hover:opacity-90 transition-opacity mt-2"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LeadPopup;
