import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  Code, Search, Megaphone, Palette, ShoppingCart,
  Globe, BarChart3, PenTool, Layers, Target, TrendingUp, ArrowRight,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";

const services = [
  {
    icon: Code,
    title: "Website Development",
    desc: "Custom-built, high-performance websites using React, Next.js, and modern frameworks. From landing pages to full-stack web applications.",
    features: ["React & Next.js", "E-Commerce", "CMS Integration", "API Development"],
    detailPath: "/services/website-development",
    subServices: [
      { label: "React Development", path: "/services/web-development/react-development" },
      { label: "E-Commerce", path: "/services/web-development/e-commerce" },
      { label: "Landing Pages", path: "/services/web-development/landing-pages" },
      { label: "CMS Development", path: "/services/web-development/cms-development" },
      { label: "Shopify", path: "/services/web-development/shopify" },
      { label: "WordPress", path: "/services/web-development/wordpress" },
    ],
    featuredStyle: true,
  },
  {
    icon: Search,
    title: "SEO Services",
    desc: "Dominate search rankings with our proven SEO strategies. Technical SEO, content optimization, and link building that delivers results.",
    features: ["Technical SEO", "On-Page Optimization", "Link Building", "Local SEO"],
    detailPath: "/services/seo",
    subServices: [
      { label: "Technical SEO", path: "/services/seo-services/technical-seo" },
      { label: "On-Page SEO", path: "/services/seo-services/on-page-seo" },
      { label: "Off-Page SEO", path: "/services/seo-services/off-page-seo" },
      { label: "Local SEO", path: "/services/seo-services/local-seo" },
      { label: "E-Commerce SEO", path: "/services/seo-services/e-commerce-seo" },
      { label: "Content Strategy", path: "/services/seo-services/content-strategy" },
    ],
  },
  {
    icon: Megaphone,
    title: "Google Ads",
    desc: "Maximize ROI with data-driven Google Ads campaigns. Search, display, shopping, and video ads managed by certified experts.",
    features: ["Search Campaigns", "Display Ads", "Shopping Ads", "YouTube Ads"],
    detailPath: "/services/google-ads",
    subServices: [
      { label: "Search Ads", path: "/services/google-ads/search-ads" },
      { label: "Display Ads", path: "/services/google-ads/display-ads" },
      { label: "Shopping Ads", path: "/services/google-ads/shopping-ads" },
      { label: "Video Ads", path: "/services/google-ads/video-ads" },
      { label: "App Ads", path: "/services/google-ads/app-ads" },
      { label: "Performance Max", path: "/services/google-ads/performance-max-ads" },
    ],
  },
  {
    icon: Target,
    title: "Social Media Ads",
    desc: "Targeted advertising across Facebook, Instagram, LinkedIn, and more. Creative campaigns that convert audiences into customers.",
    features: ["Facebook & Instagram", "LinkedIn Ads", "Remarketing", "Creative Design"],
    detailPath: "/services/social-ads/facebook-ads",
    subServices: [
      { label: "Facebook Ads", path: "/services/social-ads/facebook-ads" },
      { label: "Instagram Ads", path: "/services/social-ads/instagram-ads" },
      { label: "LinkedIn Ads", path: "/services/social-ads/linkedin-ads" },
      { label: "YouTube Ads", path: "/services/social-ads/youtube-ads" },
      { label: "Twitter Ads", path: "/services/social-ads/twitter-ads" },
      { label: "Remarketing", path: "/services/social-ads/remarketing" },
    ],
  },
  {
    icon: Palette,
    title: "Graphic Design",
    desc: "Stunning visual designs that elevate your brand. From logos to social media graphics, we create designs that stand out.",
    features: ["Brand Identity", "Social Media", "UI/UX Design", "Print Design"],
    detailPath: "/services/graphic-design",
    subServices: [
      { label: "Brand Identity", path: "/services/graphic-design/brand-identity" },
      { label: "Social Media Design", path: "/services/graphic-design/social-media-design" },
      { label: "UI/UX Design", path: "/services/graphic-design/ui-ux-design" },
      { label: "Print Design", path: "/services/graphic-design/print-design" },
      { label: "Motion Graphics", path: "/services/graphic-design/motion-graphics" },
      { label: "Packaging", path: "/services/graphic-design/packaging" },
    ],
  },
  {
    icon: ShoppingCart,
    title: "Shopify Development",
    desc: "Complete Shopify store setup and customization. Theme development, app integration, and conversion optimization.",
    features: ["Store Setup", "Theme Customization", "App Integration", "Migration"],
    detailPath: "/services/shopify-development",
  },
  {
    icon: BarChart3,
    title: "Digital Marketing",
    desc: "Comprehensive digital marketing strategies that drive growth. Content marketing, email campaigns, and funnel optimization.",
    features: ["Content Marketing", "Email Marketing", "Funnel Strategy", "Analytics"],
    detailPath: "/services/digital-marketing",
  },
  {
    icon: Globe,
    title: "Social Media Management",
    desc: "End-to-end social media management. Content creation, scheduling, engagement, and growth strategies across all platforms.",
    features: ["Content Creation", "Community Management", "Analytics", "Growth Strategy"],
    detailPath: "/services/social-media-management",
  },
];

const ServicesPage = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <>
      <PageHero
        title="Services That Drive Real Results"
        highlightWord="Real Results"
        subtitle="From SEO to social media, we craft data-driven strategies that help your brand grow, engage, and convert."
      />

      {/* Services Grid */}
      <section id="section_services" className="section-padding bg-card" ref={ref}>
        <div className="container-max">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Our <span className="gradient-text">Services</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`service-card group ${"featuredStyle" in service && service.featuredStyle ? "border-primary/25 shadow-[0_0_0_1px_rgba(249,115,22,0.15)]" : ""}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${"featuredStyle" in service && service.featuredStyle ? "bg-gradient-to-br from-orange-500 to-pink-500" : "gradient-bg"}`}>
                  <service.icon size={22} className="text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{service.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {service.features.map((f) => (
                    <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border">
                      {f}
                    </span>
                  ))}
                </div>
                {"detailPath" in service && service.detailPath ? (
                  <Link
                    to={service.detailPath}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    Learn more
                    <ArrowRight size={14} />
                  </Link>
                ) : null}
                {"subServices" in service && service.subServices ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {service.subServices.map((sub) => (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <ContactForm />
    </>
  );
};

export default ServicesPage;
