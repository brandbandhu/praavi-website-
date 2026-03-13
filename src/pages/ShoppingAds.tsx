import GoogleAdsSubServiceLayout from "@/components/GoogleAdsSubServiceLayout";

const ShoppingAdsPage = () => {
  return (
    <GoogleAdsSubServiceLayout
      title="Shopping Ads Service"
      subtitle="Promote products with image-rich Google Shopping Ads that drive qualified e-commerce sales."
      intro="Our Shopping Ads strategy focuses on product feed quality, campaign structure, and bid optimization to improve ROAS."
      ctaLabel="Start Shopping Ads"
      benefits={[
        "Show product image, price, and brand directly in search results",
        "Capture high-intent buyers ready to compare products",
        "Scale catalog visibility across top-performing categories",
        "Improve revenue with data-backed feed and bid optimization",
      ]}
      deliverables={[
        "Merchant Center setup and diagnostics",
        "Product feed optimization and attribute fixes",
        "Campaign segmentation by margin and category",
        "Negative keywords and search term control",
        "Bid strategy for ROAS and profitability",
        "Performance reports by SKU and category",
      ]}
      process={[
        { step: "01", title: "Feed Audit", desc: "Fix data quality issues impacting impressions and clicks." },
        { step: "02", title: "Campaign Build", desc: "Structure campaigns by product priority and margins." },
        { step: "03", title: "Bid Strategy", desc: "Optimize tROAS/manual bidding for profitability." },
        { step: "04", title: "Scale", desc: "Expand winning categories and improve product coverage." },
      ]}
    />
  );
};

export default ShoppingAdsPage;
