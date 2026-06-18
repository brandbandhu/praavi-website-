export interface CaseStudyItem {
  id: string;
  client: string;
  title: string;
  problem: string;
  solution: string;
  technology: string[];
  before: string;
  after: string;
  trafficGrowth: string;
  leadsGenerated: string;
  testimonial: string;
  screenshot: string;
  createdAt: number;
}

const CASE_STUDIES_STORAGE_KEY = "praavi_case_study_items";
const DEFAULT_IMAGE = "/placeholder.svg";

export const defaultCaseStudies: CaseStudyItem[] = [
  {
    id: "case-study-1",
    client: "Kamou Solar",
    title: "Solar Lead Generation & Digital Presence",
    problem:
      "Kamou Solar had no strong online presence and was missing high-intent customers searching for rooftop and commercial solar solutions.",
    solution:
      "Praavi created a professional website, SEO-ready service pages, Google Ads landing flow, and analytics setup to capture and measure enquiries.",
    technology: ["React", "SEO", "Google Ads", "Analytics", "Lead Forms"],
    before: "Offline enquiries, weak digital trust, and scattered brand visibility.",
    after: "Professional web presence with campaign-ready pages and clear enquiry paths.",
    trafficGrowth: "200% engagement increase",
    leadsGenerated: "45+ qualified monthly enquiries",
    testimonial: "Praavi helped us move from basic visibility to a serious online lead channel.",
    screenshot: DEFAULT_IMAGE,
    createdAt: 1739145600000,
  },
  {
    id: "case-study-2",
    client: "Vynk Parking",
    title: "Smart Parking Website & Brand Clarity",
    problem:
      "The smart parking solution needed a clearer digital product story and stronger trust signals for customers and partners.",
    solution:
      "Praavi designed a responsive website, simplified the product narrative, improved visual presentation, and created an SEO-friendly structure.",
    technology: ["React", "Branding", "SEO", "Dashboard UI"],
    before: "Complex offering with low clarity and limited digital credibility.",
    after: "Clear solution narrative supported by modern design and stronger trust signals.",
    trafficGrowth: "150% traffic increase",
    leadsGenerated: "30+ partner enquiries",
    testimonial: "The new website made our product easier to understand and present.",
    screenshot: DEFAULT_IMAGE,
    createdAt: 1738022400000,
  },
  {
    id: "case-study-3",
    client: "BanquetBee",
    title: "Venue Discovery Platform Experience",
    problem:
      "BanquetBee needed more than a brochure website; users needed a platform-style experience to discover venues and submit enquiries.",
    solution:
      "Praavi built a listing platform with admin workflows, structured venue pages, SEO foundations, and conversion-focused enquiry paths.",
    technology: ["React", "Platform UI", "SEO", "Admin Dashboard"],
    before: "Manual venue discovery, poor search reach, and no scalable browsing experience.",
    after: "Search-friendly platform with structured venue browsing and lead capture.",
    trafficGrowth: "300% user engagement",
    leadsGenerated: "80+ venue enquiries",
    testimonial: "Praavi converted our idea into a usable platform with growth potential.",
    screenshot: DEFAULT_IMAGE,
    createdAt: 1736899200000,
  },
  {
    id: "case-study-4",
    client: "RealTrips",
    title: "Travel Package Enquiry Growth",
    problem:
      "RealTrips needed to present travel packages more clearly online and generate qualified enquiries from customers comparing destinations and itineraries.",
    solution:
      "Praavi improved the travel offer presentation with destination-led content, campaign-friendly pages, and enquiry flows for WhatsApp and form leads.",
    technology: ["Website Development", "SEO", "Social Media", "WhatsApp Leads"],
    before: "Package discovery was scattered and interested users had no clear next step.",
    after: "Destination pages and lead paths made it easier for travellers to enquire quickly.",
    trafficGrowth: "220% package page engagement",
    leadsGenerated: "75+ travel enquiries",
    testimonial: "Praavi helped us present our travel packages professionally and generate more serious enquiries.",
    screenshot: "/landing/assets/RealTrips-C0YTP2sd.png",
    createdAt: 1734652800000,
  },
];

const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

const normalizeItem = (item: Partial<CaseStudyItem>): CaseStudyItem | null => {
  if (!item.id || !item.client || !item.title || !item.problem || !item.solution) return null;
  return {
    id: item.id,
    client: item.client,
    title: item.title,
    problem: item.problem,
    solution: item.solution,
    technology: Array.isArray(item.technology) ? item.technology.filter(Boolean) : [],
    before: item.before || "",
    after: item.after || "",
    trafficGrowth: item.trafficGrowth || "",
    leadsGenerated: item.leadsGenerated || "",
    testimonial: item.testimonial || "",
    screenshot: item.screenshot?.trim() || DEFAULT_IMAGE,
    createdAt: typeof item.createdAt === "number" ? item.createdAt : Date.now(),
  };
};

const normalizeItems = (items: Partial<CaseStudyItem>[]) =>
  items
    .map(normalizeItem)
    .filter((item): item is CaseStudyItem => !!item)
    .sort((a, b) => b.createdAt - a.createdAt);

const mergeWithDefaultItems = (items: CaseStudyItem[]) => {
  const filteredItems = items.filter(
    (item) =>
      `${item.client.trim().toLowerCase()}::${item.title.trim().toLowerCase()}` !==
      "skincity::healthcare website visibility & appointment leads"
  );
  const existingKeys = new Set(
    filteredItems.map((item) => `${item.client.trim().toLowerCase()}::${item.title.trim().toLowerCase()}`)
  );
  const missingDefaults = normalizeItems(defaultCaseStudies).filter(
    (item) => !existingKeys.has(`${item.client.trim().toLowerCase()}::${item.title.trim().toLowerCase()}`)
  );
  return normalizeItems([...filteredItems, ...missingDefaults]);
};

export const getCaseStudyItems = (): CaseStudyItem[] => {
  if (!canUseStorage()) return normalizeItems(defaultCaseStudies);
  try {
    const raw = localStorage.getItem(CASE_STUDIES_STORAGE_KEY);
    if (!raw) return normalizeItems(defaultCaseStudies);
    const parsed = JSON.parse(raw) as Partial<CaseStudyItem>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return normalizeItems(defaultCaseStudies);
    const normalized = normalizeItems(parsed);
    const merged = normalized.length > 0 ? mergeWithDefaultItems(normalized) : normalizeItems(defaultCaseStudies);
    localStorage.setItem(CASE_STUDIES_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return normalizeItems(defaultCaseStudies);
  }
};

export const saveCaseStudyItems = (items: CaseStudyItem[]) => {
  if (!canUseStorage()) return;
  localStorage.setItem(CASE_STUDIES_STORAGE_KEY, JSON.stringify(normalizeItems(items)));
};
