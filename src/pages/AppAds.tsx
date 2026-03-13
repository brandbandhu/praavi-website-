import GoogleAdsSubServiceLayout from "@/components/GoogleAdsSubServiceLayout";

const AppAdsPage = () => {
  return (
    <GoogleAdsSubServiceLayout
      title="App Ads Service"
      subtitle="Drive app installs and in-app actions with Google App Campaigns optimized for growth."
      intro="We run app campaigns focused on quality users, not just installs, by optimizing for in-app events and retention signals."
      ctaLabel="Start App Ads"
      benefits={[
        "Promote your app across Search, YouTube, Display, and Play",
        "Optimize for installs, registrations, purchases, or custom events",
        "Scale app growth with AI-assisted bidding and creative testing",
        "Improve user quality by focusing on post-install performance",
      ]}
      deliverables={[
        "App campaign setup with event tracking",
        "Creative asset planning and testing",
        "Audience and geo strategy",
        "Bidding optimization for CPI/CPA goals",
        "In-app event performance analysis",
        "Weekly reports on installs and actions",
      ]}
      process={[
        { step: "01", title: "Tracking Setup", desc: "Configure app attribution and in-app event measurement." },
        { step: "02", title: "Campaign Launch", desc: "Launch campaigns with multiple creative asset sets." },
        { step: "03", title: "Event Optimization", desc: "Shift bidding to high-value in-app outcomes." },
        { step: "04", title: "Scale", desc: "Expand channels and budgets on winning combinations." },
      ]}
    />
  );
};

export default AppAdsPage;
