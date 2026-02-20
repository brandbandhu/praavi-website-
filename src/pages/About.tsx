import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Users, Trophy, Clock, Target, Rocket } from "lucide-react";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import aboutImage from "@/assets/about.png";

const values = [
  { icon: Target, title: "Data-Driven", desc: "Every decision backed by analytics and measurable outcomes." },
  { icon: Users, title: "Client-First", desc: "Your success is our success. We grow together." },
  { icon: Rocket, title: "Innovation", desc: "Staying ahead with the latest technologies and trends." },
  { icon: Trophy, title: "Excellence", desc: "We never settle for less than extraordinary results." },
];

const stats = [
  { value: "150+", label: "Happy Clients" },
  { value: "500+", label: "Projects Delivered" },
  { value: "5+", label: "Years Experience" },
  { value: "98%", label: "Client Retention" },
];

const AboutPage = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-50px" });

  return (
    <>
      <PageHero
        title="Promote With Us"
        subtitle="Discover why Praavi Consultants is the trusted digital partner for 150+ brands."
      />

      {/* About Content */}
      <section id="about-content" className="section-padding" ref={ref}>
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image placeholder with gradient */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="rounded-2xl overflow-hidden aspect-[4/3] border border-border/60 bg-card"
            >
              <img
                src={aboutImage}
                alt="About Praavi Consultants"
                className="w-full h-full object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2">
                About <span className="gradient-text">Praavi Consultants</span>
              </h2>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                India's Best Digital Marketing & Web Development Agency
              </h3>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  We're committed to delivering the <strong className="text-foreground">Best Digital Marketing Services</strong> for your business.
                  Praavi Consultants is your complete digital marketing and web development agency, ready to provide{" "}
                  <span className="text-accent">SEO, social media marketing, Google Ads, and web development services</span> tailored to your business needs.
                </p>
                <p>
                  We are dedicated to creating a <strong className="text-foreground">strong visual identity</strong> for your brand, ensuring your online presence is engaging, professional, and results-driven.
                </p>
                <p>
                  We give wings to your business through <strong className="text-foreground">custom web design, digital marketing strategies</strong> crafted for maximum impact.
                </p>
              </div>

              <ul className="grid grid-cols-2 gap-3 mt-6">
                {["Develop a vision statement", "Grow your customer base", "Increase your monthly sales", "Beat your competition"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to="/contact"
                className="inline-block mt-8 gradient-bg px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Contact Us Now
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-card" ref={statsRef}>
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="font-display text-3xl sm:text-4xl font-bold gradient-text-orange">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding">
        <div className="container-max">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Our <span className="gradient-text">Core Values</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="service-card text-center"
              >
                <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
                  <v.icon size={24} className="text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <ContactForm />
    </>
  );
};

export default AboutPage;
