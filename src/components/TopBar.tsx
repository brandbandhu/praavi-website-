import { Facebook, Instagram, Linkedin, Phone, MapPin } from "lucide-react";

const TopBar = () => {
  return (
    <div className="bg-secondary border-b border-border">
      <div className="container-max flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
          Best Digital Marketing & Web Development Agency
        </p>
        <div className="flex items-center gap-3 sm:gap-5">
          <div
            className="hidden xl:flex items-center gap-1.5 text-xs text-muted-foreground max-w-[460px] truncate"
            title="Second floor, next to Ankur Balrugnalay, above Nakoda Jewellers, Pune, Loni Kalbhor, Maharashtra 412201"
          >
            <MapPin size={12} className="text-primary flex-shrink-0" />
            <span className="truncate">
              Second floor, next to Ankur Balrugnalay, above Nakoda Jewellers, Pune, Loni Kalbhor, Maharashtra 412201
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Facebook size={14} /></a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Instagram size={14} /></a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin size={14} /></a>
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
            <Phone size={12} className="text-primary" />
            <span>+91 9699369117</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
