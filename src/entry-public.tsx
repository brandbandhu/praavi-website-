import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/Layout";
import type { SeoHeadProps } from "./components/SeoHead";
import { PublicRenderContext, type PublicData } from "./lib/publicPrerender";
import { fetchPublishedBlogPosts, fetchPublishedPortfolioItems, fetchActiveClients, fetchPublishedCaseStudies } from "./lib/contentApi";
import { fetchJobs } from "./lib/careerApi";
import Index from "./pages/Index";
import Services from "./pages/Services";
import WebsiteDevelopment from "./pages/WebsiteDevelopment";
import SEOService from "./pages/SEOService";
import GoogleAdsService from "./pages/GoogleAdsService";
import GraphicDesignService from "./pages/GraphicDesignService";
import DigitalMarketingService from "./pages/DigitalMarketingService";
import SocialMediaManagementService from "./pages/SocialMediaManagementService";
import ShopifyDevelopmentService from "./pages/ShopifyDevelopmentService";
import SearchAds from "./pages/SearchAds";
import DisplayAds from "./pages/DisplayAds";
import ShoppingAds from "./pages/ShoppingAds";
import VideoAds from "./pages/VideoAds";
import AppAds from "./pages/AppAds";
import PerformanceMaxAds from "./pages/PerformanceMaxAds";
import FacebookAdsService from "./pages/FacebookAdsService";
import SubServicePage from "./pages/SubServicePage";
import Portfolio from "./pages/Portfolio";
import CaseStudies from "./pages/CaseStudies";
import Clients from "./pages/Clients";
import About from "./pages/About";
import Team from "./pages/Team";
import AISolutions from "./pages/AISolutions";
import IndustryPage from "./pages/IndustryPage";
import PuneLandingPage from "./pages/PuneLandingPage";
import Career from "./pages/Career";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
export const loadPublicData = async () => {
  const [blogs, portfolio, clients, caseStudies, jobs] = await Promise.all([fetchPublishedBlogPosts(), fetchPublishedPortfolioItems(), fetchActiveClients(), fetchPublishedCaseStudies(), fetchJobs()]);
  return { blogs, portfolio, clients, caseStudies, jobs };
};
export const renderPublic = (pathname: string, data: PublicData = {}) => {
  let seo: SeoHeadProps | undefined;
  const markup = renderToString(<PublicRenderContext.Provider value={{ data, capture: value => { seo = value; } }}><QueryClientProvider client={new QueryClient()}><StaticRouter location={pathname}><Layout><Routes>
    <Route path="/" element={<Index />} />
    <Route path="/services" element={<Services />} />
    <Route path="/services/website-development" element={<WebsiteDevelopment />} />
    <Route path="/website-development" element={<WebsiteDevelopment />} />
    <Route path="/services/seo" element={<SEOService />} />
    <Route path="/seo-services" element={<SEOService />} />
    <Route path="/services/google-ads" element={<GoogleAdsService />} />
    <Route path="/services/graphic-design" element={<GraphicDesignService />} />
    <Route path="/services/digital-marketing" element={<DigitalMarketingService />} />
    <Route path="/services/social-media-management" element={<SocialMediaManagementService />} />
    <Route path="/services/social-media-marketing" element={<SocialMediaManagementService />} />
    <Route path="/social-media-marketing" element={<SocialMediaManagementService />} />
    <Route path="/services/shopify-development" element={<ShopifyDevelopmentService />} />
    <Route path="/services/google-ads/search-ads" element={<SearchAds />} />
    <Route path="/services/google-ads/display-ads" element={<DisplayAds />} />
    <Route path="/services/google-ads/shopping-ads" element={<ShoppingAds />} />
    <Route path="/services/google-ads/video-ads" element={<VideoAds />} />
    <Route path="/services/google-ads/app-ads" element={<AppAds />} />
    <Route path="/services/google-ads/performance-max-ads" element={<PerformanceMaxAds />} />
    <Route path="/services/social-ads/facebook-ads" element={<FacebookAdsService />} />
    <Route path="/services/:categorySlug/:serviceSlug" element={<SubServicePage />} />
    <Route path="/portfolio" element={<Portfolio />} />
    <Route path="/case-studies" element={<CaseStudies />} />
    <Route path="/clients" element={<Clients />} />
    <Route path="/about" element={<About />} />
    <Route path="/team" element={<Team />} />
    <Route path="/ai-solutions" element={<AISolutions />} />
    <Route path="/industries/:slug" element={<IndustryPage />} />
    <Route path="/pune/:slug" element={<PuneLandingPage />} />
    <Route path="/career" element={<Career />} />
    <Route path="/blog" element={<Blog />} />
    <Route path="/blog/:slug" element={<BlogPost />} />
    <Route path="/contact" element={<Contact />} />

  </Routes></Layout></StaticRouter></QueryClientProvider></PublicRenderContext.Provider>);
  if (!seo) throw new Error('Missing page-specific SEO: ' + pathname);
  return { seo, markup };
};
