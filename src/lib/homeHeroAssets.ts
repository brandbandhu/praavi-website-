const assetDirectory = "/assets/home-hero";

export const homeHeroSources = {
  mobile: {
    media: "(max-width: 479px)",
    srcSet: `${assetDirectory}/praavi-waves-480.avif 480w, ${assetDirectory}/praavi-waves-900.avif 900w`,
    sizes: "100vw",
  },
  wide: {
    srcSet: `${assetDirectory}/praavi-waves-900.avif 900w, ${assetDirectory}/praavi-waves-1200.avif 1200w`,
    sizes: "(max-width: 1067px) 1067px, 100vw",
  },
};
