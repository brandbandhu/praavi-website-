import { Sparkles } from "lucide-react";
import { DIWALI_CONFIG } from "./config";
import styles from "./diwali.module.css";

export default function DiwaliHeroWish() {
  if (!DIWALI_CONFIG.enabled) return null;

  return (
    <div className={styles.heroWish}>
      <p className={styles.heroWishTitle}>
        <Sparkles aria-hidden="true" size={20} />
        <span>Happy Diwali</span>
        <Sparkles aria-hidden="true" size={20} />
      </p>
      <p className={styles.heroWishMessage}>
        Wishing you prosperity, growth &amp; success
      </p>
    </div>
  );
}
