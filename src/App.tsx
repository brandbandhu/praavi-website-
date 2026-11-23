import { lazy, Suspense, useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import Index from "./pages/Index";
import { ADMIN_DASHBOARD_PATH, ADMIN_LOGIN_PATH } from "./lib/adminRoutes";

const ProtectedRoute = lazy(() => import("@/components/ProtectedRoute"));
const Services = lazy(() => import("./pages/Services"));
const SearchAds = lazy(() => import("./pages/SearchAds"));
const DisplayAds = lazy(() => import("./pages/DisplayAds"));
const ShoppingAds = lazy(() => import("./pages/ShoppingAds"));
const VideoAds = lazy(() => import("./pages/VideoAds"));
const AppAds = lazy(() => import("./pages/AppAds"));
const PerformanceMaxAds = lazy(() => import("./pages/PerformanceMaxAds"));
const SubServicePage = lazy(() => import("./pages/SubServicePage"));
const WebsiteDevelopment = lazy(() => import("./pages/WebsiteDevelopment"));
const SEOService = lazy(() => import("./pages/SEOService"));
const GoogleAdsService = lazy(() => import("./pages/GoogleAdsService"));
const FacebookAdsService = lazy(() => import("./pages/FacebookAdsService"));
const GraphicDesignService = lazy(() => import("./pages/GraphicDesignService"));
const DigitalMarketingService = lazy(() => import("./pages/DigitalMarketingService"));
const SocialMediaManagementService = lazy(() => import("./pages/SocialMediaManagementService"));
const ShopifyDevelopmentService = lazy(() => import("./pages/ShopifyDevelopmentService"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const CaseStudies = lazy(() => import("./pages/CaseStudies"));
const Clients = lazy(() => import("./pages/Clients"));
const About = lazy(() => import("./pages/About"));
const Team = lazy(() => import("./pages/Team"));
const AISolutions = lazy(() => import("./pages/AISolutions"));
const IndustryPage = lazy(() => import("./pages/IndustryPage"));
const PuneLandingPage = lazy(() => import("./pages/PuneLandingPage"));
const Contact = lazy(() => import("./pages/Contact"));
const Career = lazy(() => import("./pages/Career"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const FinanceManagementSystem = lazy(() => import("./pages/FinanceManagementSystem"));
const SocialDeskRoutes = lazy(() => import("./pages/social-desk/SocialDeskRoutes"));
const DigitalMarketingTeamRoutes = lazy(() => import("./pages/digital-marketing-team/DigitalMarketingTeamRoutes"));
const NotFound = lazy(() => import("./pages/NotFound"));

const RoutePending = () => <p role="status" className="container-max px-4 py-12">Loading page?</p>;

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

const DiwaliWishesRedirect = () => {
  useEffect(() => {
    window.location.replace(`/diwali-wishes/index.html${window.location.search}${window.location.hash}`);
  }, []);

  return <p role="status">Opening Diwali wishes…</p>;
};

const AppRoutes = () => (
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
    <Route path="/finance-management-system/fms/login" element={<FinanceManagementSystem />} />
    <Route path="/finance-management-system/fms/*" element={<FinanceManagementSystem />} />
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
);

const AppShell = () => {
  const { pathname } = useLocation();
  const isSocialDesk = pathname.startsWith("/social_desk");
  const isDigitalMarketingTeam = pathname.startsWith("/digital_marketing_team");

  if (/^\/diwali-wishes\/?$/.test(pathname)) {
    return <DiwaliWishesRedirect />;
  }

  if (isSocialDesk) {
    return (
      <AppErrorBoundary>
        <Suspense fallback={<RoutePending />}>
          <Routes>
            <Route path="/social_desk/*" element={<SocialDeskRoutes />} />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    );
  }

  if (isDigitalMarketingTeam) {
    return (
      <AppErrorBoundary>
        <Suspense fallback={<RoutePending />}>
          <Routes>
            <Route path="/digital_marketing_team/*" element={<DigitalMarketingTeamRoutes />} />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    );
  }

  return (
    <Layout>
      <AppErrorBoundary>
        <Suspense fallback={<RoutePending />}>
          <AppRoutes />
        </Suspense>
      </AppErrorBoundary>
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Sonner />
    <BrowserRouter>
      <ScrollToTop />
      <AppShell />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

