import { createContext, useContext } from "react";
import type { SeoHeadProps } from "@/components/SeoHead";
import type { BlogPost } from "./blogStore";
import type { PortfolioItem } from "./portfolioStore";
import type { ClientItem } from "./clientsStore";
import type { CaseStudyItem } from "./caseStudyStore";
import type { JobPost } from "./careerApi";

export interface PublicData {
  blogs?: BlogPost[];
  portfolio?: PortfolioItem[];
  clients?: ClientItem[];
  caseStudies?: CaseStudyItem[];
  jobs?: JobPost[];
}
export const PublicRenderContext = createContext<{ data: PublicData; capture?: (seo: SeoHeadProps) => void } | null>(null);
export const usePublicData = (): PublicData => {
  const context = useContext(PublicRenderContext);
  if (context) return context.data;
  if (typeof document === "undefined") return {};
  try {
    const snapshot = JSON.parse(document.getElementById("public-prerender-data")?.textContent ?? "null");
    if (snapshot?.pathname === window.location.pathname.replace(/\/$/, "") || (snapshot?.pathname === "/" && window.location.pathname === "/")) return snapshot.data ?? {};
  } catch { /* A malformed or previous route snapshot must not replace live data. */ }
  return {};
};
