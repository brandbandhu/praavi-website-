import GoogleAdsSubServiceLayout from "@/components/GoogleAdsSubServiceLayout";

const PerformanceMaxAdsPage = () => {
  return (
    <GoogleAdsSubServiceLayout
      title="Performance Max Ads Service"
      subtitle="Unlock full-channel Google reach with Performance Max campaigns focused on conversion growth."
      intro="Praavi Consultants builds conversion-focused Performance Max campaigns using audience signals, high-quality assets, and strict optimization routines."
      ctaLabel="Start Performance Max"
      benefits={[
        "Access Search, Display, YouTube, Discover, Gmail, and Maps in one campaign",
        "Use automation with guardrails for controlled growth",
        "Improve conversion volume with data-driven audience signals",
        "Scale faster while maintaining CPA and ROAS goals",
      ]}
      deliverables={[
        "Campaign architecture and asset group planning",
        "Audience signal strategy and intent layering",
        "Creative assets for all placements",
        "Conversion tracking and value-based bidding setup",
        "Search theme and placement control strategy",
        "Weekly optimization and performance reporting",
      ]}
      process={[
        { step: "01", title: "Foundation", desc: "Define business goals, tracking, and conversion values." },
        { step: "02", title: "Asset Groups", desc: "Build audience-led asset groups and launch campaigns." },
        { step: "03", title: "Signal Tuning", desc: "Refine audience signals and creative combinations." },
        { step: "04", title: "Scale", desc: "Increase budget where ROAS/CPA targets stay healthy." },
      ]}
    />
  );
};

export default PerformanceMaxAdsPage;
