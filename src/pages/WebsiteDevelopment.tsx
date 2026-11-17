import { ArrowRight, Code2 } from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import SeoHead from "@/components/SeoHead";

const subServices = [
  { label: "React Development", path: "/services/web-development/react-development" },
  { label: "E-Commerce", path: "/services/web-development/e-commerce" },
  { label: "Landing Pages", path: "/services/web-development/landing-pages" },
  { label: "CMS Development", path: "/services/web-development/cms-development" },
  { label: "Shopify", path: "/services/web-development/shopify" },
  { label: "WordPress", path: "/services/web-development/wordpress" },
];

const developmentServices = [
  {
    title: "Custom Web Design",
    desc: "Page layouts, navigation and calls to action shaped around your brand and the information your customers need.",
    tags: ["UI/UX", "Figma", "Adobe XD"],
  },
  {
    title: "Frontend Development",
    desc: "Responsive interfaces using React, Next.js and Tailwind CSS, so visitors can browse and enquire across devices.",
    tags: ["React", "Next.js", "Tailwind CSS"],
  },
  {
    title: "Backend Development",
    desc: "Node.js, Express and database integrations that support the forms, workflows and data your website needs.",
    tags: ["Node.js", "Express", "Databases"],
  },
  {
    title: "E-Commerce Solutions",
    desc: "Product, cart and checkout journeys using Shopify, WooCommerce or a custom build, matched to your store requirements.",
    tags: ["Shopify", "WooCommerce", "Payment Integration"],
  },
  {
    title: "CMS Development",
    desc: "CMS solutions for content management and workflow optimization.",
    tags: ["WordPress", "Drupal", "Content Management"],
  },
  {
    title: "Full Stack Development",
    desc: "End-to-end development covering frontend and backend seamlessly.",
    tags: ["Frontend", "Backend", "API Integration"],
  },
  {
    title: "Website Maintenance",
    desc: "Updates, maintenance and optimization help keep your website useful after launch. Confirm the ongoing support scope for your project.",
    tags: ["Support", "Updates", "Optimization"],
  },
  {
    title: "PHP Development",
    desc: "Custom PHP applications and dynamic websites tailored to your needs.",
    tags: ["PHP", "Laravel", "CodeIgniter"],
  },
  {
    title: "React Development",
    desc: "High-performance React applications with modern frontend architecture.",
    tags: ["React", "JSX", "Component Architecture"],
  },
  {
    title: "Real Estate Websites",
    desc: "Specialized websites for property listings and real estate workflows.",
    tags: ["Property Listings", "Booking", "Maps Integration"],
  },
  {
    title: "WordPress Development",
    desc: "Custom WordPress websites with themes, plugins, and optimization.",
    tags: ["WordPress", "Plugins", "Themes"],
  },
  {
    title: "Shopify Development",
    desc: "Build and scale Shopify stores with conversion-focused implementation.",
    tags: ["Shopify", "Store Management", "Payment Gateways"],
  },
  {
    title: "School Websites",
    desc: "Professional school websites with admissions and notice workflows.",
    tags: ["Admissions", "Timetable", "Notice Board"],
  },
];

const techStack = [
  "React/Next.js",
  "Tailwind CSS",
  "Node.js",
  "MongoDB/PostgreSQL",
  "GraphQL",
  "AWS/Vercel",
];

const WebsiteDevelopmentPage = () => {
  return (
    <>
      <SeoHead
        title="Website Development Company in Pune | Praavi Consultants"
        description="Website design and development for Pune businesses, including business websites, WordPress and ecommerce. Discuss your project with Praavi Consultants."
        canonicalPath="/website-development"
      />
      <PageHero
        tag="Web Development Services"
        title="Website Development Company in Pune"
        highlightWord="Website Development"
        subtitle="Website design and development that connects your business information, customer journey and enquiry goals."
      />

      <section className="section-padding">
        <div className="container-max grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="service-card border-primary/25 shadow-[0_0_0_1px_rgba(249,115,22,0.15)]">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center mb-5">
              <Code2 size={24} className="text-white" />
            </div>
            <h2 className="font-display text-3xl font-bold mb-3">What Your Website Needs to Deliver</h2>
            <p className="text-muted-foreground leading-relaxed mb-5">
              We plan business websites, landing pages and ecommerce stores around the information visitors need and
              the actions you want them to take. Design, development, CMS and API integrations are discussed around your
              project scope and wider <Link to="/" className="text-primary hover:underline">digital marketing goals</Link>.
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {["React & Next.js", "E-Commerce", "CMS Integration", "API Development"].map((item) => (
                <span
                  key={item}
                  className="text-sm px-3.5 py-1.5 rounded-full bg-secondary text-muted-foreground border border-border"
                >
                  {item}
                </span>
              ))}
            </div>

            <Link to="/contact" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline mb-6">
              Discuss Your Website Project
              <ArrowRight size={16} />
            </Link>

            <div className="flex flex-wrap gap-2">
              {subServices.map((sub) => (
                <Link
                  key={sub.path}
                  to={sub.path}
                  className="text-sm px-3.5 py-1.5 rounded-full border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {sub.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="service-card">
            <h3 className="font-display text-2xl font-bold mb-4">Core Capabilities</h3>
            <div className="grid grid-cols-2 gap-3">
              {["Web Apps", "Mobile Ready", "E-Commerce", "SEO Friendly", "Secure", "Fast"].map((item) => (
                <div key={item} className="rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm text-center">
                  {item}
                </div>
              ))}
            </div>
            <h4 className="font-display text-xl font-semibold mt-8 mb-3">Technology Stack</h4>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <span key={tech} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container-max">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Our <span className="gradient-text">Website Development Services</span>
            </h2>
            <p className="text-muted-foreground mt-3">
              Discovery and design lead into development, testing and launch, with maintenance and support agreed around
              your requirements. Read our <Link to="/blog/website-development-process-from-idea-to-launch" className="text-primary hover:underline">website development process guide</Link> and
              discuss <Link to="/seo-services" className="text-primary hover:underline">SEO requirements</Link> alongside your build.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {developmentServices.map((service) => (
              <article key={service.title} className="service-card">
                <h3 className="font-display text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{service.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {service.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ContactForm />
    </>
  );
};

export default WebsiteDevelopmentPage;
