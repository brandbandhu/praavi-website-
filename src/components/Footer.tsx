import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container-max section-padding pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <Link to="/" className="mb-4 inline-flex items-center" aria-label="Praavi Consultants home">
              <img
                src={logo}
                alt="Praavi Consultants"
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium digital agency crafting high-converting experiences for ambitious brands across India and worldwide.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider text-accent">Pages</h4>
            <div className="flex flex-col gap-2">
              {[
                { label: "Home", path: "/" },
                { label: "Services", path: "/services" },
                { label: "AI Solutions", path: "/ai-solutions" },
                { label: "Our Work", path: "/portfolio" },
                { label: "Case Studies", path: "/case-studies" },
                { label: "Team", path: "/team" },
                { label: "Our Clients", path: "/clients" },
                { label: "About", path: "/about" },
                { label: "Career", path: "/career" },
                { label: "Blog", path: "/blog" },
              ].map((l) => (
                <Link
                  key={l.label}
                  to={l.path}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider text-accent">Services</h4>
            <div className="flex flex-col gap-2">
              {[
                { label: "Web Development", path: "/services/website-development" },
                { label: "AI Chatbots & Automation", path: "/ai-solutions" },
                { label: "SEO Services", path: "/services/seo" },
                { label: "Google Search Ads", path: "/services/google-ads/search-ads" },
                { label: "Social Media Ads", path: "/services/social-media-management" },
                { label: "Shopify Development", path: "/services/shopify-development" },
                { label: "Branding", path: "/services/graphic-design" },
              ].map((s) =>
                s.path ? (
                  <Link
                    key={s.label}
                    to={s.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {s.label}
                  </Link>
                ) : (
                  <span key={s.label} className="text-sm text-muted-foreground">
                    {s.label}
                  </span>
                )
              )}
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider text-accent">Contact</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={14} className="text-primary flex-shrink-0" />
                <span className="break-all">praavi.consultants@gmail.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone size={14} className="text-primary flex-shrink-0" />
                +91 9699369117
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={14} className="text-primary flex-shrink-0" />
                <span className="break-words">
                  1st Floor, Anand Complex, Solapur - Pune Hwy, near Ambika Jewellers, Loni Kalbhor, Pune,
                  Maharashtra 412201
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Praavi Consultants. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
