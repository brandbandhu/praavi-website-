import { useEffect, useRef } from "react";

export function useSectionReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = ref.current;
    if (!section || !window.IntersectionObserver ||
      !window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)").matches) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      section.dataset.revealed = "true";
      observer.disconnect();
    }, { rootMargin: "0px 0px -48px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  return ref;
}
