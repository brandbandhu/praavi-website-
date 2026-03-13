import GoogleAdsSubServiceLayout from "@/components/GoogleAdsSubServiceLayout";

const SearchAdsPage = () => {
  return <GoogleAdsSubServiceLayout
    title="Search Ads Service"
    subtitle="Drive high-intent traffic and quality leads with performance-focused Google Search Ads management."
    intro="Praavi Consultants offers result-driven Google Search Ads services for businesses that want faster lead generation and better ROI."
    ctaLabel="Start Search Ads"
    benefits={[
      "Appear on top when users actively search for your services",
      "Capture high-intent leads with commercial keyword targeting",
      "Control spend with smart bid strategy and budget planning",
      "Track calls, forms, and revenue with conversion reporting",
    ]}
    deliverables={[
      "Account setup and campaign architecture",
      "Keyword research for intent and location",
      "Ad copy writing and A/B testing",
      "Landing page alignment for higher conversion rate",
      "Negative keyword strategy and quality score improvement",
      "Weekly optimization and performance reporting",
    ]}
    process={[
      { step: "01", title: "Research", desc: "Analyze market, competitors, and high-intent keyword opportunities." },
      { step: "02", title: "Launch", desc: "Build campaigns, write ads, set tracking, and publish." },
      { step: "03", title: "Optimize", desc: "Improve CTR, CPC, and conversion quality through testing." },
      { step: "04", title: "Scale", desc: "Increase budget on winning ad groups to grow lead volume." },
    ]}
  />;
};

export default SearchAdsPage;
