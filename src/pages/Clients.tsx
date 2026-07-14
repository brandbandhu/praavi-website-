import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import PageHero from "@/components/PageHero";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getClientsItems, type ClientItem } from "@/lib/clientsStore";
import { fetchActiveClients } from "@/lib/contentApi";

const ClientsPage = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [clients, setClients] = useState<ClientItem[]>(getClientsItems());

  useEffect(() => {
    let mounted = true;
    fetchActiveClients()
      .then((liveClients) => {
        if (!mounted) return;
        if (liveClients.length > 0) setClients(liveClients);
      })
      .catch(() => {
        // Keep local fallback clients when Supabase is not configured or empty.
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <PageHero
        title="Our Valuable Clients"
        highlightWord="Clients"
        subtitle="Partners in Success with Praavi, the Best Digital Marketing Agency Worldwide"
      />

      <div className="text-center py-6">
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 gradient-bg px-8 py-3 rounded-xl font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Get Started <ArrowRight size={16} />
        </Link>
      </div>

      <section className="section-padding pt-8" ref={ref}>
        <div className="container-max">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {clients.map((client, i) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className="client-logo-card flex-col gap-3 p-6"
              >
                <div className="w-36 h-24 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden border border-border">
                  <img
                    src={client.logoUrl}
                    alt={`${client.name} - social media marketing agency Pune client`}
                    className="w-full h-full object-contain p-3"
                  />
                </div>
                <span className="font-medium text-base text-foreground text-center">{client.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default ClientsPage;
