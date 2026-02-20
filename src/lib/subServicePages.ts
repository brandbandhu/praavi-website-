export interface SubServicePageContent {
  tag: string;
  title: string;
  subtitle: string;
  intro: string;
  ctaLabel: string;
  benefits: string[];
  deliverables: string[];
  process: Array<{ step: string; title: string; desc: string }>;
}

const baseProcess = [
  { step: "01", title: "Audit", desc: "Review current setup, goals, and audience expectations." },
  { step: "02", title: "Strategy", desc: "Build a focused plan aligned with growth and conversion goals." },
  { step: "03", title: "Execution", desc: "Launch campaigns/tasks with quality checks and tracking." },
  { step: "04", title: "Optimize", desc: "Continuously improve results with reporting-driven decisions." },
];

const buildContent = (tag: string, title: string, intro: string): SubServicePageContent => ({
  tag,
  title: `${title} Service`,
  subtitle: `${title} solutions designed to improve visibility, engagement, and business growth.`,
  intro,
  ctaLabel: `Start ${title}`,
  benefits: [
    `Custom strategy tailored for your ${title.toLowerCase()} goals`,
    "Performance-focused execution with clear KPI tracking",
    "Audience-first approach to improve lead quality and conversion rate",
    "Regular optimization to maximize ROI and reduce waste",
  ],
  deliverables: [
    "Research and planning based on business objectives",
    "Campaign/asset setup with quality standards",
    "Performance tracking and conversion measurement",
    "Weekly optimization and actionable reporting",
    "Scaling recommendations for consistent growth",
    "Transparent communication and progress updates",
  ],
  process: baseProcess,
});

export const subServicePages: Record<string, SubServicePageContent> = {
  "social-ads/facebook-ads": buildContent("Social Ads Services", "Facebook Ads", "Run conversion-focused Facebook campaigns that reach the right audience segments at the right stage."),
  "social-ads/instagram-ads": buildContent("Social Ads Services", "Instagram Ads", "Drive engagement and sales with creative-first Instagram ad campaigns built for scroll-stopping performance."),
  "social-ads/linkedin-ads": buildContent("Social Ads Services", "LinkedIn Ads", "Generate qualified B2B leads with precision targeting and thought-leadership-driven LinkedIn campaigns."),
  "social-ads/youtube-ads": buildContent("Social Ads Services", "YouTube Ads", "Capture attention with strategic video campaigns designed for reach, recall, and conversions."),
  "social-ads/twitter-ads": buildContent("Social Ads Services", "Twitter Ads", "Boost brand visibility and conversation through timely and relevant X (Twitter) ad campaigns."),
  "social-ads/remarketing": buildContent("Social Ads Services", "Remarketing", "Reconnect with warm audiences and improve conversion rates through behavior-based retargeting campaigns."),

  "web-development/react-development": buildContent("Web Development Services", "React Development", "Build high-performance React applications that are scalable, fast, and conversion-focused."),
  "web-development/e-commerce": buildContent("Web Development Services", "E-Commerce Development", "Launch conversion-optimized online stores with strong UX, speed, and secure checkout experiences."),
  "web-development/landing-pages": buildContent("Web Development Services", "Landing Page Development", "Create focused landing pages that improve ad quality score and maximize lead generation."),
  "web-development/cms-development": buildContent("Web Development Services", "CMS Development", "Develop flexible CMS-powered websites so your team can manage content quickly and safely."),
  "web-development/shopify": buildContent("Web Development Services", "Shopify Development", "Scale your D2C brand with custom Shopify storefronts optimized for growth and retention."),
  "web-development/wordpress": buildContent("Web Development Services", "WordPress Development", "Build easy-to-manage WordPress websites with clean architecture and strong SEO foundations."),

  "seo-services/technical-seo": buildContent("SEO Services", "Technical SEO", "Fix crawl, indexation, speed, and structure issues to improve your site’s organic performance."),
  "seo-services/on-page-seo": buildContent("SEO Services", "On-Page SEO", "Optimize pages with search intent, metadata, and content structure to improve rankings."),
  "seo-services/off-page-seo": buildContent("SEO Services", "Off-Page SEO", "Strengthen authority with ethical link-building and brand mention strategies."),
  "seo-services/local-seo": buildContent("SEO Services", "Local SEO", "Increase local visibility with map optimization, citations, and location-focused content."),
  "seo-services/e-commerce-seo": buildContent("SEO Services", "E-Commerce SEO", "Improve category and product page rankings to drive consistent non-paid revenue."),
  "seo-services/content-strategy": buildContent("SEO Services", "Content Strategy", "Plan and publish high-intent content clusters that support rankings and qualified leads."),

  "graphic-design/brand-identity": buildContent("Graphic Design Services", "Brand Identity Design", "Develop a cohesive identity system that differentiates your brand and improves recognition."),
  "graphic-design/social-media-design": buildContent("Graphic Design Services", "Social Media Design", "Create branded social creatives that increase engagement and campaign performance."),
  "graphic-design/ui-ux-design": buildContent("Graphic Design Services", "UI/UX Design", "Design user journeys and interfaces that make digital products intuitive and conversion-friendly."),
  "graphic-design/print-design": buildContent("Graphic Design Services", "Print Design", "Craft impactful print materials aligned with your brand standards and campaign goals."),
  "graphic-design/motion-graphics": buildContent("Graphic Design Services", "Motion Graphics", "Communicate value quickly with animated visuals for ads, explainers, and social content."),
  "graphic-design/packaging": buildContent("Graphic Design Services", "Packaging Design", "Design product packaging that stands out, informs clearly, and strengthens shelf appeal."),
};

export const getSubServicePage = (categorySlug?: string, serviceSlug?: string) => {
  if (!categorySlug || !serviceSlug) return undefined;
  return subServicePages[`${categorySlug}/${serviceSlug}`];
};
