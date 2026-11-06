import { motion } from "framer-motion";
import styles from "./diwali.module.css";

export default function DiwaliGreeting({ reducedMotion }) {
  return (
    <motion.aside
      className={styles.greeting}
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.96 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: reducedMotion ? 1 : [0.96, 1, 1, 0.98],
      }}
      transition={{
        duration: reducedMotion ? 4.8 : 2.8,
        delay: reducedMotion ? 0 : 2,
        times: [0, 0.18, 0.72, 1],
        ease: "easeInOut",
      }}
    >
      <p className={styles.title}>
        <span aria-hidden="true">✧ </span>Happy Diwali<span aria-hidden="true"> ✧</span>
      </p>
      <p className={styles.wish}>Wishing You Prosperity, Growth &amp; Success</p>
      <p className={styles.signature}>— Team Praavi Consultants</p>
    </motion.aside>
  );
}
