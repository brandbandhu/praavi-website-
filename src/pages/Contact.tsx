import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import { Mail, MapPin, Phone } from "lucide-react";

const contactInfo = [
  {
    title: "Address",
    icon: MapPin,
    content: [
      "1st Floor, Anand Complex, Solapur - Pune Hwy,",
      "near Ambika Jewellers, Loni Kalbhor, Pune,",
      "Maharashtra 412201",
    ],
  },
  {
    title: "Call Us",
    icon: Phone,
    content: ["+91 9699369117"],
  },
  {
    title: "Email Us",
    icon: Mail,
    content: ["praavi.consultants@gmail.com"],
  },
];

const ContactInfoSection = () => {
  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-10 pb-2">
      <div className="container-max">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactInfo.map((item) => (
            <div
              key={item.title}
              className="service-card text-center p-7 sm:p-8"
            >
              <div className="mx-auto mb-5 w-16 h-16 rounded-full gradient-bg flex items-center justify-center">
                <item.icon size={28} className="text-primary-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4">{item.title}</h3>
              <div className="space-y-1.5 text-muted-foreground leading-relaxed">
                {item.content.map((line) => (
                  <p key={line} className="text-sm sm:text-base">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ContactPage = () => {
  return (
    <>
      <PageHero
        tag="Contact Us"
        title="Let's Build Something Great"
        highlightWord="Great"
        subtitle="Ready to transform your digital presence? Get in touch today."
      />
      <ContactInfoSection />
      <ContactForm />
    </>
  );
};

export default ContactPage;
