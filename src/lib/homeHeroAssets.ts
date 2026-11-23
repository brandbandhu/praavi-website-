const assetDirectory = "/assets/home-hero";

export const homeHeroSources = {
  mobile: {
    media: "(max-width: 479px)",
    srcSet: `${assetDirectory}/banner-2-mobile-480.avif 480w, ${assetDirectory}/banner-2-mobile-900.avif 900w`,
    sizes: "100vw",
  },
  wide: {
    srcSet: `${assetDirectory}/banner-2-wide-960.avif 960w, ${assetDirectory}/banner-2-wide-1440.avif 1440w, ${assetDirectory}/banner-2-wide-1920.avif 1920w`,
    sizes: "(max-width: 1067px) 1067px, 100vw",
  },
};
