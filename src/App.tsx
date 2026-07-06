import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Services from "./pages/Services";
import SearchAds from "./pages/SearchAds";
import DisplayAds from "./pages/DisplayAds";
import ShoppingAds from "./pages/ShoppingAds";
import VideoAds from "./pages/VideoAds";
import AppAds from "./pages/AppAds";
import PerformanceMaxAds from "./pages/PerformanceMaxAds";
import SubServicePage from "./pages/SubServicePage";
import WebsiteDevelopment from "./pages/WebsiteDevelopment";
import SEOService from "./pages/SEOService";
import GoogleAdsService from "./pages/GoogleAdsService";
import FacebookAdsService from "./pages/FacebookAdsService";
import GraphicDesignService from "./pages/GraphicDesignService";
import DigitalMarketingService from "./pages/DigitalMarketingService";
import SocialMediaManagementService from "./pages/SocialMediaManagementService";
import ShopifyDevelopmentService from "./pages/ShopifyDevelopmentService";
import Portfolio from "./pages/Portfolio";
import CaseStudies from "./pages/CaseStudies";
import Clients from "./pages/Clients";
import About from "./pages/About";
import Team from "./pages/Team";
import AISolutions from "./pages/AISolutions";
import IndustryPage from "./pages/IndustryPage";
import PuneLandingPage from "./pages/PuneLandingPage";
import Contact from "./pages/Contact";
import Career from "./pages/Career";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { ADMIN_DASHBOARD_PATH, ADMIN_LOGIN_PATH } from "./lib/adminRoutes";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const QuoteToolRedirect = () => {
  useEffect(() => {
    window.location.replace("/internal/quote-tool/myadmin/index.html");
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Layout>
          <AppErrorBoundary>
            <Routes>
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
            <Route path="/internal/quote-tool/myadmin" element={<QuoteToolRedirect />} />
            <Route path={ADMIN_LOGIN_PATH} element={<AdminLogin />} />
            <Route
              path={ADMIN_DASHBOARD_PATH}
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AppErrorBoundary>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

