import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Code, Palette, TrendingUp, Layers, Zap, BarChart3, Search, Monitor, Megaphone, Smartphone, PenTool, ShoppingCart, ChevronRight, Play, AppWindow, Rocket, Paintbrush, Share2, Youtube, MessageCircle, Repeat, ShoppingBag, FileCode2, LayoutTemplate, Store, Globe, Wrench, FileText, MapPin, ScanSearch, Brush, Package, Building2, Plane, HeartPulse, GraduationCap, Clapperboard, Landmark, HandHeart, Truck, Factory, Wallet, Clock3, Car, Gamepad2, UtensilsCrossed, Scale, Trophy, Dumbbell, KeyRound, Bot, Database, Server, IndianRupee, Star, Quote } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import LeadPopup from "@/components/LeadPopup";
import SeoHead from "@/components/SeoHead";
import heroBanner from "@/assets/banner.jpg";

/* ---- Hero ---- */
const Hero = () => (
  <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
    {/* Banner background image */}
    <div
      className="absolute inset-0 bg-cover bg-center opacity-35"
      style={{ backgroundImage: `url(${heroBanner})` }}
    />
    <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/50 to-background/70" />

    {/* Glow */}
    <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-primary/5 blur-[120px]" />
    <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-accent/5 blur-[100px]" />

    <div className="relative z-10 container-max px-4 sm:px-6 lg:px-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-6"
      >
        <Sparkles size={14} className="text-primary" />
        <span className="text-xs sm:text-sm text-muted-foreground">Pune Growth Agency for Websites, Leads & Scale</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight max-w-5xl mx-auto"
      >
        We Build Websites, Generate Leads & Scale Businesses
      </motion.h1>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="font-display text-lg sm:text-xl md:text-2xl font-semibold text-accent mt-4"
      >
        150+ Clients • 500+ Projects • 98% Retention
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-muted-foreground mt-3 text-sm sm:text-base max-w-3xl mx-auto"
      >
        Praavi Consultants helps ambitious businesses in Pune turn online visibility into qualified enquiries with websites, SEO, Google Ads, social media, and automation.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-4"
      >
        <Link
          to="/contact"
          className="gradient-bg px-8 py-3.5 rounded-xl font-semibold text-primary-foreground flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          Get Free Strategy Call <ArrowRight size={18} />
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-10 grid grid-cols-3 gap-3 max-w-2xl mx-auto"
      >
        {[
          ["150+", "Clients"],
          ["500+", "Projects"],
          ["98%", "Retention"],
        ].map(([value, label]) => (
          <div key={label} className="glass-card rounded-xl px-4 py-4">
            <div className="font-display text-2xl sm:text-3xl font-bold gradient-text-orange">{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ---- Service Tabs (like Promfly) ---- */
const serviceTabs = [
  { icon: Search, label: "Google Ads", items: ["Search Ads", "Display Ads", "Shopping Ads", "Video Ads", "App Ads", "Performance Max"] },
  { icon: Megaphone, label: "Social Ads", items: ["Facebook Ads", "Instagram Ads", "LinkedIn Ads", "YouTube Ads", "Twitter Ads", "Remarketing"] },
  { icon: Code, label: "Web Development", items: ["React Development", "E-Commerce", "Landing Pages", "CMS Development", "Shopify", "WordPress"] },
  { icon: TrendingUp, label: "SEO Services", items: ["Technical SEO", "On-Page SEO", "Off-Page SEO", "Local SEO", "E-Commerce SEO", "Content Strategy"] },
  { icon: Palette, label: "Graphic Design", items: ["Brand Identity", "Social Media Design", "UI/UX Design", "Print Design", "Motion Graphics", "Packaging"] },
  { icon: Bot, label: "AI Solutions", items: ["AI Chatbot Development", "WhatsApp Automation", "CRM Automation", "Lead Automation", "AI Customer Support", "AI Marketing Solutions"] },
];

const serviceItemLinks: Record<string, string> = {
  "Google Ads::Search Ads": "/services/google-ads/search-ads",
  "Google Ads::Display Ads": "/services/google-ads/display-ads",
  "Google Ads::Shopping Ads": "/services/google-ads/shopping-ads",
  "Google Ads::Video Ads": "/services/google-ads/video-ads",
  "Google Ads::App Ads": "/services/google-ads/app-ads",
  "Google Ads::Performance Max": "/services/google-ads/performance-max-ads",
  "Social Ads::Facebook Ads": "/services/social-ads/facebook-ads",
  "Social Ads::Instagram Ads": "/services/social-ads/instagram-ads",
  "Social Ads::LinkedIn Ads": "/services/social-ads/linkedin-ads",
  "Social Ads::YouTube Ads": "/services/social-ads/youtube-ads",
  "Social Ads::Twitter Ads": "/services/social-ads/twitter-ads",
  "Social Ads::Remarketing": "/services/social-ads/remarketing",
  "Web Development::React Development": "/services/web-development/react-development",
  "Web Development::E-Commerce": "/services/web-development/e-commerce",
  "Web Development::Landing Pages": "/services/web-development/landing-pages",
  "Web Development::CMS Development": "/services/web-development/cms-development",
  "Web Development::Shopify": "/services/web-development/shopify",
  "Web Development::WordPress": "/services/web-development/wordpress",
  "SEO Services::Technical SEO": "/services/seo-services/technical-seo",
  "SEO Services::On-Page SEO": "/services/seo-services/on-page-seo",
  "SEO Services::Off-Page SEO": "/services/seo-services/off-page-seo",
  "SEO Services::Local SEO": "/services/seo-services/local-seo",
  "SEO Services::E-Commerce SEO": "/services/seo-services/e-commerce-seo",
  "SEO Services::Content Strategy": "/services/seo-services/content-strategy",
  "Graphic Design::Brand Identity": "/services/graphic-design/brand-identity",
  "Graphic Design::Social Media Design": "/services/graphic-design/social-media-design",
  "Graphic Design::UI/UX Design": "/services/graphic-design/ui-ux-design",
  "Graphic Design::Print Design": "/services/graphic-design/print-design",
  "Graphic Design::Motion Graphics": "/services/graphic-design/motion-graphics",
  "Graphic Design::Packaging": "/services/graphic-design/packaging",
  "AI Solutions::AI Chatbot Development": "/ai-solutions",
  "AI Solutions::WhatsApp Automation": "/ai-solutions",
  "AI Solutions::CRM Automation": "/ai-solutions",
  "AI Solutions::Lead Automation": "/ai-solutions",
  "AI Solutions::AI Customer Support": "/ai-solutions",
  "AI Solutions::AI Marketing Solutions": "/ai-solutions",
};

const serviceItemIcons: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; className: string }> = {
  "Google Ads::Search Ads": { icon: Search, className: "text-blue-400" },
  "Google Ads::Display Ads": { icon: Monitor, className: "text-emerald-400" },
  "Google Ads::Shopping Ads": { icon: ShoppingCart, className: "text-yellow-400" },
  "Google Ads::Video Ads": { icon: Play, className: "text-rose-400" },
  "Google Ads::App Ads": { icon: AppWindow, className: "text-violet-400" },
  "Google Ads::Performance Max": { icon: Rocket, className: "text-cyan-400" },
  "Social Ads::Facebook Ads": { icon: Megaphone, className: "text-blue-400" },
  "Social Ads::Instagram Ads": { icon: Paintbrush, className: "text-pink-400" },
  "Social Ads::LinkedIn Ads": { icon: Share2, className: "text-sky-400" },
  "Social Ads::YouTube Ads": { icon: Youtube, className: "text-red-400" },
  "Social Ads::Twitter Ads": { icon: MessageCircle, className: "text-cyan-400" },
  "Social Ads::Remarketing": { icon: Repeat, className: "text-amber-400" },
  "Web Development::React Development": { icon: FileCode2, className: "text-cyan-400" },
  "Web Development::E-Commerce": { icon: ShoppingBag, className: "text-emerald-400" },
  "Web Development::Landing Pages": { icon: LayoutTemplate, className: "text-orange-400" },
  "Web Development::CMS Development": { icon: Wrench, className: "text-indigo-400" },
  "Web Development::Shopify": { icon: Store, className: "text-green-400" },
  "Web Development::WordPress": { icon: Globe, className: "text-blue-400" },
  "SEO Services::Technical SEO": { icon: Wrench, className: "text-slate-400" },
  "SEO Services::On-Page SEO": { icon: FileText, className: "text-teal-400" },
  "SEO Services::Off-Page SEO": { icon: Share2, className: "text-violet-400" },
  "SEO Services::Local SEO": { icon: MapPin, className: "text-orange-400" },
  "SEO Services::E-Commerce SEO": { icon: ShoppingCart, className: "text-emerald-400" },
  "SEO Services::Content Strategy": { icon: ScanSearch, className: "text-pink-400" },
  "Graphic Design::Brand Identity": { icon: Brush, className: "text-rose-400" },
  "Graphic Design::Social Media Design": { icon: Share2, className: "text-fuchsia-400" },
  "Graphic Design::UI/UX Design": { icon: PenTool, className: "text-cyan-400" },
  "Graphic Design::Print Design": { icon: FileText, className: "text-amber-400" },
  "Graphic Design::Motion Graphics": { icon: Play, className: "text-red-400" },
  "Graphic Design::Packaging": { icon: Package, className: "text-purple-400" },
  "AI Solutions::AI Chatbot Development": { icon: Bot, className: "text-cyan-400" },
  "AI Solutions::WhatsApp Automation": { icon: MessageCircle, className: "text-emerald-400" },
  "AI Solutions::CRM Automation": { icon: Database, className: "text-blue-400" },
  "AI Solutions::Lead Automation": { icon: Zap, className: "text-yellow-400" },
  "AI Solutions::AI Customer Support": { icon: Smartphone, className: "text-pink-400" },
  "AI Solutions::AI Marketing Solutions": { icon: Megaphone, className: "text-orange-400" },
};

const ServiceTabsSection = () => {
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="section-padding" ref={ref}>
      <div className="container-max">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10"
        >
          {serviceTabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActive(i)}
              className={`filter-pill flex items-center gap-2 ${active === i ? "active" : ""}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Active tab content */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {(() => {
            const ActiveIcon = serviceTabs[active].icon;
            return (
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <ActiveIcon size={24} className="text-primary" />
                  {serviceTabs[active].label}
                </h3>
                <Link to="/services" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View All <ChevronRight size={14} />
                </Link>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {serviceTabs[active].items.map((item) => {
              const itemKey = `${serviceTabs[active].label}::${item}`;
              const itemPath = serviceItemLinks[itemKey];
              const itemIconData = serviceItemIcons[itemKey];
              const ItemIcon = itemIconData?.icon;

              return itemPath ? (
                <Link
                  key={item}
                  to={itemPath}
                  className="service-card flex items-center justify-between group"
                >
                  <span className="flex items-center gap-3">
                    {ItemIcon ? (
                      <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <ItemIcon size={16} className={itemIconData.className} />
                      </span>
                    ) : null}
                    <span className="text-sm font-medium">{item}</span>
                  </span>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ) : (
                <div
                  key={item}
                  className="service-card flex items-center justify-between group"
                >
                  <span className="flex items-center gap-3">
                    {ItemIcon ? (
                      <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <ItemIcon size={16} className={itemIconData.className} />
                      </span>
                    ) : null}
                    <span className="text-sm font-medium">{item}</span>
                  </span>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* ---- Industries We Serve ---- */
const industriesWeServe = [
  { label: "Retail", icon: Store },
  { label: "Real Estate", icon: Building2, path: "/industries/real-estate" },
  { label: "Travel & Tourism", icon: Plane, path: "/industries/travel-agencies" },
  { label: "Healthcare", icon: HeartPulse, path: "/industries/hospitals" },
  { label: "Education", icon: GraduationCap, path: "/industries/schools" },
  { label: "E-Commerce", icon: ShoppingBag },
  { label: "Startups", icon: Rocket },
  { label: "Media", icon: Clapperboard },
  { label: "Government & Public", icon: Landmark },
  { label: "Nonprofits & NGOs", icon: HandHeart },
  { label: "Logistics", icon: Truck },
  { label: "Manufacturing", icon: Factory, path: "/industries/manufacturers" },
  { label: "Finance", icon: Wallet },
  { label: "On-Demand", icon: Clock3 },
  { label: "Automotive", icon: Car },
  { label: "Gaming", icon: Gamepad2 },
  { label: "Advertising", icon: Megaphone },
  { label: "Food & Beverages", icon: UtensilsCrossed },
  { label: "Legal Services", icon: Scale },
  { label: "Sports", icon: Trophy },
  { label: "Fitness", icon: Dumbbell },
  { label: "Rentals", icon: KeyRound },
];

const IndustriesSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-16 sm:pb-20 lg:pb-24" ref={ref}>
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold">
            Industries <span className="gradient-text">We Serve</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {industriesWeServe.map((industry, i) => {
            const content = (
              <>
                <span className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <industry.icon size={22} className="text-primary" />
                </span>
                <h3 className="text-sm font-medium leading-tight">{industry.label}</h3>
              </>
            );

            return (
            <motion.div
              key={industry.label}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className="service-card flex flex-col items-center justify-center text-center gap-3 min-h-[120px]"
            >
              {industry.path ? <Link to={industry.path} className="flex flex-col items-center justify-center gap-3 h-full w-full">{content}</Link> : content}
            </motion.div>
          )})}
        </div>
      </div>
    </section>
  );
};

/* ---- Why Choose Us ---- */
const whyItems = [
  { icon: Sparkles, title: "Data-Driven", desc: "Every strategy backed by analytics and real-time data." },
  { icon: Zap, title: "Fast Delivery", desc: "Rapid execution without compromising quality." },
  { icon: BarChart3, title: "Proven ROI", desc: "Measurable results with transparent reporting." },
  { icon: Layers, title: "Full Service", desc: "End-to-end digital solutions under one roof." },
];

const WhyChooseUs = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="section-padding bg-card" ref={ref}>
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-sm text-primary font-medium uppercase tracking-wider">Why Us</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3">
            Why Choose <span className="gradient-text">Praavi?</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="service-card text-center"
            >
              <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
                <item.icon size={24} className="text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const clientLogos = [
  "aiems-R3CvcNqc.png",
  "abk-CdGf5VGA.png",
  "creo-DOaj1ts3.png",
  "dadhchi-YDEcEBl5.png",
  "impactinfra-BMopwPl3.png",
  "insiderview-CjarhEse.png",
  "jkscuk-BbX_ttjn.png",
  "kalidas-hDkP2ZMv.png",
  "krayons-BLCOAATw.png",
  "mediport-BlzfapUd.png",
  "RealTrips-C0YTP2sd.png",
  "samratholidays-6rTTv7j-.png",
  "skincity-DKkG2hQT.png",
  "Transvolt-CkBpN8z8.png",
  "watsoft-BF1YD8YW.png",
  "Vishvanirmal Ayurveda-CtiqTuU5.png",
];

const ClientLogoWall = () => {
  const logos = [...clientLogos, ...clientLogos];

  return (
    <section className="py-12 border-y border-border bg-card/70 overflow-hidden">
      <div className="container-max px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl sm:text-3xl font-bold">Brands That Trust Praavi</h2>
          <Link to="/clients" className="hidden sm:inline-flex items-center gap-1 text-sm text-primary hover:underline">
            View clients <ChevronRight size={14} />
          </Link>
        </div>
      </div>
      <div className="logo-marquee">
        <div className="logo-marquee-track">
          {logos.map((logo, index) => (
            <div key={`${logo}-${index}`} className="client-logo-card logo-marquee-item">
              <img src={`/landing/assets/${logo}`} alt="Praavi client logo" className="max-h-20 max-w-48 object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ProcessSection = () => {
  const steps = ["Discovery Call", "Market Research", "Strategy Planning", "Website / Marketing Setup", "Campaign Launch", "Optimization", "Scale Growth"];

  return (
    <section className="section-padding">
      <div className="container-max">
        <div className="text-center mb-12">
          <span className="text-sm text-primary font-medium uppercase tracking-wider">Why Praavi Process</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3">How We Grow Businesses</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {steps.map((step, index) => (
            <div key={step} className="service-card p-4">
              <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center text-sm font-bold text-primary-foreground mb-4">
                {index + 1}
              </div>
              <h3 className="font-display text-sm font-semibold leading-tight">{step}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TechStackSection = () => {
  const tech = [
    ["React", Code],
    ["Next.js", FileCode2],
    ["Node.js", Server],
    ["MySQL", Database],
    ["MongoDB", Database],
    ["Shopify", Store],
    ["WordPress", Globe],
    ["AWS", Server],
    ["Vercel", Rocket],
  ];

  return (
    <section className="section-padding bg-card">
      <div className="container-max">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">Technologies We Use</h2>
          <p className="text-sm text-muted-foreground mt-3">Modern, scalable tools for corporate websites, ecommerce, automation, and marketing systems.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-4">
          {tech.map(([label, Icon]) => (
            <div key={label as string} className="service-card p-4 text-center">
              <Icon size={22} className="text-primary mx-auto mb-3" />
              <div className="text-sm font-medium">{label as string}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const PricingSection = () => {
  const packages = [
    ["Starter", "₹15,000+", "Website package for small businesses and landing pages."],
    ["Business", "₹35,000+", "Growth website with SEO structure, analytics, and lead forms."],
    ["Enterprise", "Custom", "Advanced web, ecommerce, CRM, automation, and marketing systems."],
  ];
  const marketing = ["SEO Packages", "Google Ads Packages", "Social Media Packages"];

  return (
    <section className="section-padding">
      <div className="container-max">
        <div className="text-center mb-12">
          <span className="text-sm text-primary font-medium uppercase tracking-wider">Transparent Starting Points</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3">Pricing That Helps You Plan</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map(([name, price, desc]) => (
            <article key={name} className="service-card">
              <IndianRupee size={24} className="text-primary mb-4" />
              <h3 className="font-display text-xl font-bold">{name}</h3>
              <p className="font-display text-3xl font-bold gradient-text-orange mt-3">{price}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">{desc}</p>
            </article>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {marketing.map((item) => (
            <Link key={item} to="/contact" className="filter-pill">
              {item}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const VideoTestimonialsSection = () => {
  const stories = [
    ["Client Video Review", "Short video testimonial placeholder for campaign experience and delivery confidence."],
    ["Google Review Screenshot", "Google review proof can be uploaded here to add third-party trust."],
    ["Before/After Story", "Showcase traffic, lead quality, and conversion gains from recent projects."],
  ];

  return (
    <section className="section-padding">
      <div className="container-max">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">Client Proof & Success Stories</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stories.map(([title, desc]) => (
            <article key={title} className="service-card">
              <div className="aspect-video rounded-xl border border-border bg-secondary/70 flex items-center justify-center mb-4">
                {title.includes("Video") ? <Play size={30} className="text-primary" /> : title.includes("Google") ? <Star size={30} className="text-primary" /> : <Quote size={30} className="text-primary" />}
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

const localSeoSections = [
  {
    title: "Website Development Services in Pune",
    description:
      "We are a website development company in Loni Kalbhor and web development company in Pune delivering business website development Pune brands can scale with. As a website design company Pune businesses trust and a website development agency near me option, our team includes some of the best website designers in Pune.",
  },
  {
    title: "SEO Services in Loni Kalbhor",
    description:
      "As an SEO company in Pune, we provide professional SEO services Pune businesses use to improve rankings, leads, and conversions. If you are searching for an SEO expert near me or best SEO agency near me, our local SEO services in Pune are designed for measurable growth.",
  },
  {
    title: "Social Media Marketing Agency in Pune",
    description:
      "Praavi is a top social media marketing agency Pune brands trust for platform strategy, content, and paid campaigns. As a social media marketing agency in Pune, we support small business digital marketing Pune companies need to improve visibility and generate qualified inquiries.",
  },
  {
    title: "Google Ads & PPC Services Pune",
    description:
      "Need a Google Ads agency in Pune with performance focus? We manage PPC services Pune businesses rely on, including search, display, video, and remarketing. Our media buyers include a Google Ads expert in Pune and provide Meta Ads agency in Pune campaign planning and optimization.",
  },
  {
    title: "E-Commerce Website Development Pune",
    description:
      "Our ecommerce website development Pune service includes conversion-focused storefronts, product architecture, secure checkout, and marketing integrations. We also deliver WordPress website development Pune companies choose for flexible content management and growth.",
  },
  {
    title: "Local SEO Services for Small Businesses",
    description:
      "For businesses in Loni Kalbhor, Hadapsar, Manjri, Uruli Kanchan, and across Pune, we combine maps optimization, local landing pages, and review strategies to improve local discovery. That makes us a best digital marketing company in Loni Kalbhor Pune option for near-me intent searches.",
  },
];

const LocalSeoContentSection = () => {
  return (
    <section className="section-padding bg-card">
      <div className="container-max">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">
            Digital Marketing Services in <span className="gradient-text">Loni Kalbhor & Pune</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-3xl mx-auto text-sm sm:text-base">
            We work as your digital marketing company near me partner for growth-focused campaigns and websites, with
            digital marketing services in Loni Kalbhor Pune businesses can grow from.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {localSeoSections.map((section) => (
            <article key={section.title} className="service-card">
              <h2 className="font-display text-2xl font-bold mb-3">{section.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.description}</p>
            </article>
          ))}
        </div>

        <div className="service-card mt-8">
          <h3 className="font-display text-xl font-semibold mb-3">Helpful Links</h3>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link to="/services" className="text-primary hover:underline">
              best digital marketing agency in Pune
            </Link>
            <Link to="/website-development" className="text-primary hover:underline">
              professional website development services
            </Link>
            <Link to="/seo-services" className="text-primary hover:underline">
              SEO experts in Loni Kalbhor
            </Link>
            <Link to="/social-media-marketing" className="text-primary hover:underline">
              top digital marketing company near me
            </Link>
            <Link to="/contact" className="text-primary hover:underline">
              best digital marketing agency in Loni Kalbhor
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ---- Page ---- */
const Index = () => {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "DigitalMarketingAgency",
    name: "Praavi Consultants",
    url: "https://www.praaviconsultants.in",
    image: "https://www.praaviconsultants.in/favicon.png",
    address: {
      "@type": "PostalAddress",
      streetAddress: "1st Floor, Anand Complex, Solapur - Pune Hwy, near Ambika Jewellers, Loni Kalbhor",
      addressLocality: "Pune",
      addressRegion: "Maharashtra",
      postalCode: "412201",
      addressCountry: "IN",
    },
    areaServed: ["Loni Kalbhor", "Hadapsar", "Manjri", "Uruli Kanchan", "Pune"],
    knowsAbout: [
      "Digital Marketing",
      "Website Development",
      "SEO Services",
      "Google Ads",
      "Social Media Marketing",
    ],
    telephone: "+91-9699369117",
  };

  return (
    <>
    <SeoHead
      title="Best Digital Marketing Agency in Pune | Website Development & SEO Services | Praavi Consultants"
      description="Praavi Consultants is a leading digital marketing agency in Pune offering website development, SEO services, social media marketing, and Google Ads management to grow your business online."
        canonicalPath="/"
        schema={localBusinessSchema}
      />
      <Hero />
      <ClientLogoWall />
      <ServiceTabsSection />
      <LocalSeoContentSection />
      <IndustriesSection />
      <ProcessSection />
      <TechStackSection />
      <PricingSection />
      <VideoTestimonialsSection />
      <WhyChooseUs />
      <ContactForm />
      <LeadPopup />
    </>
  );
};

export default Index;
