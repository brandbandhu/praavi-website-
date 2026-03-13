export interface PortfolioItem {
  id: string;
  title: string;
  client: string;
  desc: string;
  tags: string[];
  stat: string;
  imageUrl: string;
  liveUrl?: string;
  createdAt: number;
}

const PORTFOLIO_STORAGE_KEY = "praavi_portfolio_items";
const DEFAULT_IMAGE = "/placeholder.svg";

const defaultItems: PortfolioItem[] = [
  {
    id: "portfolio-1",
    title: "Kamou Solar - Digital Transformation",
    client: "Kamou Solar",
    desc: "Developed a high-end website with React and custom analytics dashboard. Comprehensive SEO and social media strategies.",
    tags: ["Web Development", "SEO", "Social Media"],
    stat: "+200% increase in engagement",
    imageUrl: DEFAULT_IMAGE,
    liveUrl: "",
    createdAt: 1739145600000,
  },
  {
    id: "portfolio-2",
    title: "Vynk Parking - Smart Solutions",
    client: "Vynk Parking",
    desc: "Designed and developed a responsive website with modern brand identity and real-time dashboard.",
    tags: ["Web Development", "Branding", "SEO"],
    stat: "+150% traffic increase",
    imageUrl: DEFAULT_IMAGE,
    liveUrl: "",
    createdAt: 1738022400000,
  },
  {
    id: "portfolio-3",
    title: "BanquetBee - Platform Development",
    client: "BanquetBee",
    desc: "Built a listing platform with admin dashboard for banquet and event management with end-to-end SEO optimization.",
    tags: ["Web Development", "E-commerce", "SEO"],
    stat: "+300% user engagement",
    imageUrl: DEFAULT_IMAGE,
    liveUrl: "",
    createdAt: 1736899200000,
  },
];

const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

const normalizeItem = (item: Partial<PortfolioItem>): PortfolioItem | null => {
  if (!item.id || !item.title || !item.client || !item.desc || !item.stat) return null;
  return {
    id: item.id,
    title: item.title,
    client: item.client,
    desc: item.desc,
    tags: Array.isArray(item.tags) ? item.tags.filter(Boolean) : [],
    stat: item.stat,
    imageUrl: item.imageUrl?.trim() || DEFAULT_IMAGE,
    liveUrl: item.liveUrl?.trim() || "",
    createdAt: typeof item.createdAt === "number" ? item.createdAt : Date.now(),
  };
};

const normalizeItems = (items: Partial<PortfolioItem>[]) =>
  items
    .map(normalizeItem)
    .filter((item): item is PortfolioItem => !!item)
    .sort((a, b) => b.createdAt - a.createdAt);

export const getPortfolioItems = (): PortfolioItem[] => {
  if (!canUseStorage()) return normalizeItems(defaultItems);
  try {
    const raw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (!raw) return normalizeItems(defaultItems);
    const parsed = JSON.parse(raw) as Partial<PortfolioItem>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return normalizeItems(defaultItems);
    const normalized = normalizeItems(parsed);
    return normalized.length > 0 ? normalized : normalizeItems(defaultItems);
  } catch {
    return normalizeItems(defaultItems);
  }
};

export const savePortfolioItems = (items: PortfolioItem[]) => {
  if (!canUseStorage()) return;
  localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(normalizeItems(items)));
};
