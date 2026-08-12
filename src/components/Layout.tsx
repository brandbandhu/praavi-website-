import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingButtons from "./FloatingButtons";
import MobileFooterMenu from "./MobileFooterMenu";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { pathname } = useLocation();
  const isInnerPage = pathname !== "/";
  const isFinanceManagementSystem = pathname.startsWith("/finance-management-system/fms");

  if (isFinanceManagementSystem) {
    return <>{children}</>;
  }

  return (
    <div className={`min-h-screen bg-background text-foreground ${isInnerPage ? "internal-page" : ""}`}>
      <TopBar />
      <Navbar />
      <main className="pb-20 lg:pb-0">{children}</main>
      <Footer />
      <MobileFooterMenu />
      <FloatingButtons />
    </div>
  );
};

export default Layout;
