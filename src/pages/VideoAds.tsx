import GoogleAdsSubServiceLayout from "@/components/GoogleAdsSubServiceLayout";

const VideoAdsPage = () => {
  return (
    <GoogleAdsSubServiceLayout
      title="Video Ads Service"
      subtitle="Reach and convert audiences on YouTube with strategic video ad campaigns."
      intro="We build full-funnel YouTube ad strategies from awareness to conversion using audience intent and creative sequencing."
      ctaLabel="Start Video Ads"
      benefits={[
        "Build trust and brand recall with engaging video storytelling",
        "Reach high-value audiences across YouTube inventory",
        "Retarget viewers with offer-focused follow-up campaigns",
        "Track watch rate, engagement, and conversion impact",
      ]}
      deliverables={[
        "Campaign planning for awareness, consideration, and action",
        "Audience targeting and custom intent segments",
        "Video ad sequencing and ad format selection",
        "Companion creatives and CTA overlays",
        "Budget allocation and bid optimization",
        "Weekly performance reporting and creative insights",
      ]}
      process={[
        { step: "01", title: "Strategy", desc: "Define goals, funnel stage, and audience segments." },
        { step: "02", title: "Launch", desc: "Set up campaigns, creatives, and conversion tracking." },
        { step: "03", title: "Retarget", desc: "Remarket to viewers based on engagement behavior." },
        { step: "04", title: "Optimize", desc: "Improve CPV, watch rate, and conversion outcomes." },
      ]}
    />
  );
};

export default VideoAdsPage;
