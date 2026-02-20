import GoogleAdsSubServiceLayout from "@/components/GoogleAdsSubServiceLayout";

const DisplayAdsPage = () => {
  return <GoogleAdsSubServiceLayout
    title="Display Ads Service"
    subtitle="Build visibility and drive conversions with performance-focused Google Display Ads campaigns."
    intro="Praavi Consultants helps brands run result-oriented Google Display Ads across high-quality inventory with smart audience targeting."
    ctaLabel="Start Display Ads"
    benefits={[
      "Build strong brand awareness at scale",
      "Use visual creatives for stronger recall and engagement",
      "Target by audience interests, in-market behavior, and demographics",
      "Retarget site visitors to improve conversion rate",
    ]}
    deliverables={[
      "Creative strategy and banner ad setup",
      "Audience research and segmentation",
      "Placement and device optimization",
      "Remarketing campaign structure",
      "Bid and budget optimization for CPM/CPC efficiency",
      "Weekly performance analysis and reporting",
    ]}
    process={[
      { step: "01", title: "Audience Planning", desc: "Define audience cohorts and campaign objectives." },
      { step: "02", title: "Creative Launch", desc: "Launch responsive display creatives with conversion tracking." },
      { step: "03", title: "Retargeting", desc: "Reconnect with past visitors using intent-based ads." },
      { step: "04", title: "Optimization", desc: "Improve CTR, CPC, and lead quality continuously." },
    ]}
  />;
};

export default DisplayAdsPage;
