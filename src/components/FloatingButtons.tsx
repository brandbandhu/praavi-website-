import { Phone } from "lucide-react";

const FloatingButtons = () => {
  return (
    <div className="hidden lg:flex fixed right-5 bottom-24 z-50 flex-col items-center gap-3">
      <a
        href="tel:+919699369117"
        aria-label="Call Now"
        className="w-14 h-14 rounded-full bg-yellow-400 text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        <Phone size={26} />
      </a>
      <a
        href="https://wa.me/919699369117"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-105 shadow-[0_8px_24px_rgba(37,211,102,0.45)] bg-[#25D366]"
      >
        <i className="fa-brands fa-whatsapp text-4xl" aria-hidden="true"></i>
      </a>
    </div>
  );
};

export default FloatingButtons;
