import { Phone, MessageCircle } from "lucide-react";

const FloatingButtons = () => {
  return (
    <div className="hidden lg:flex fixed right-5 bottom-24 z-50 flex-col items-center gap-3">
      <a
        href="tel:+919699369117"
        aria-label="Call Now"
        className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        <Phone size={20} />
      </a>
      <a
        href="https://wa.me/919699369117"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="w-14 h-14 rounded-full bg-[#25D366] text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        <MessageCircle size={20} />
      </a>
    </div>
  );
};

export default FloatingButtons;
