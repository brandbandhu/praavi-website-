import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
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
import Clients from "./pages/Clients";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/website-development" element={<WebsiteDevelopment />} />
            <Route path="/services/seo" element={<SEOService />} />
            <Route path="/services/google-ads" element={<GoogleAdsService />} />
            <Route path="/services/graphic-design" element={<GraphicDesignService />} />
            <Route path="/services/digital-marketing" element={<DigitalMarketingService />} />
            <Route path="/services/social-media-management" element={<SocialMediaManagementService />} />
            <Route path="/services/social-media-marketing" element={<SocialMediaManagementService />} />
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
            <Route path="/clients" element={<Clients />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
