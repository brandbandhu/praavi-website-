import { Link, useLocation } from "react-router-dom";
import { House, Briefcase, FolderKanban, BookOpen, Phone, UserRoundPlus } from "lucide-react";

const mobileNavLinks = [
  { label: "Home", path: "/", icon: House },
  { label: "Services", path: "/services", icon: Briefcase },
  { label: "Work", path: "/portfolio", icon: FolderKanban },
  { label: "Career", path: "/career", icon: UserRoundPlus },
  { label: "Blog", path: "/blog", icon: BookOpen },
  { label: "Contact", path: "/contact", icon: Phone },
];

const MobileFooterMenu = () => {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur-md">
      <div className="grid grid-cols-6">
        {mobileNavLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.label}
              to={link.path}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <link.icon size={18} />
              <span className="text-[11px] font-medium leading-none">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileFooterMenu;
