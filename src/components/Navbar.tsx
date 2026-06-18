import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Services", path: "/services" },
  { label: "AI Solutions", path: "/ai-solutions" },
  { label: "Our Work", path: "/portfolio" },
  { label: "Case Studies", path: "/case-studies" },
  { label: "Team", path: "/team" },
  { label: "Our Clients", path: "/clients" },
  { label: "About", path: "/about" },
  { label: "Blog", path: "/blog" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-lg shadow-black/20"
          : "bg-background border-b border-border"
      }`}
    >
      <div className="container-max flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        <Link to="/" className="font-display text-xl sm:text-2xl font-bold tracking-tight">
          <span className="gradient-text-orange">Praavi</span>
          <span className="text-foreground"> Consultants</span>
        </Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                location.pathname === link.path
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/contact"
            className="ml-3 gradient-bg px-4 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Get Quote
          </Link>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
