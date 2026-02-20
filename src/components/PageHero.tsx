import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

interface PageHeroProps {
  tag?: string;
  title: string;
  highlightWord?: string;
  subtitle?: string;
  showCTA?: boolean;
  ctaText?: string;
  ctaHref?: string;
}

const PageHero = ({ tag, title, highlightWord, subtitle }: PageHeroProps) => {
  const location = useLocation();

  const breadcrumbItems = location.pathname
    .split("/")
    .filter(Boolean)
    .map((segment, index, arr) => {
      const href = `/${arr.slice(0, index + 1).join("/")}`;
      const label = segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
      return { href, label };
    });

  // Split title to highlight a word
  let beforeHighlight = title;
  let afterHighlight = "";
  if (highlightWord) {
    const idx = title.indexOf(highlightWord);
    if (idx !== -1) {
      beforeHighlight = title.slice(0, idx);
      afterHighlight = title.slice(idx + highlightWord.length);
    }
  }

  return (
    <section className="page-hero">
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] rounded-full bg-primary/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-56 h-56 rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
      <div className="relative z-10 container-max px-4 sm:px-6 lg:px-8">
        {breadcrumbItems.length > 0 && (
          <motion.nav
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            aria-label="Breadcrumb"
            className="mb-4"
          >
            <ol className="inline-flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              {breadcrumbItems.map((item, index) => {
                const isLast = index === breadcrumbItems.length - 1;
                return (
                  <li key={item.href} className="inline-flex items-center gap-2">
                    <span className="text-muted-foreground/50">/</span>
                    {isLast ? (
                      <span className="text-primary font-medium">{item.label}</span>
                    ) : (
                      <Link to={item.href} className="text-muted-foreground hover:text-foreground transition-colors">
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </motion.nav>
        )}

        {tag && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs sm:text-sm text-muted-foreground uppercase tracking-[0.2em] mb-4"
          >
            {tag}
          </motion.p>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight"
        >
          {highlightWord ? (
            <>
              {beforeHighlight}
              <span className="gradient-text">{highlightWord}</span>
              {afterHighlight}
            </>
          ) : (
            title
          )}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto"
          >
            {subtitle}
          </motion.p>
        )}

      </div>
    </section>
  );
};

export default PageHero;
