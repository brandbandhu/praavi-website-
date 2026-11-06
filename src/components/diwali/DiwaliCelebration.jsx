import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";
import FireworksCanvas from "./FireworksCanvas";
import { DIWALI_CONFIG } from "./config";
import styles from "./diwali.module.css";

export default function DiwaliCelebration() {
  const sceneryRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!DIWALI_CONFIG.enabled) return;
    let timer;
    let heroVisible = false;
    const beginWhenVisible = () => {
      window.clearTimeout(timer);
      if (!heroVisible || document.hidden || reducedMotion) {
        setPlaying(false);
        return;
      }
      if (document.readyState !== "complete") return;
      // Let the loaded hero paint before starting the celebration.
      timer = window.setTimeout(() => {
        if (heroVisible && !document.hidden) setPlaying(true);
      }, 400);
    };
    const observer = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      beginWhenVisible();
    });
    observer.observe(sceneryRef.current);
    window.addEventListener("load", beginWhenVisible);
    document.addEventListener("visibilitychange", beginWhenVisible);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("load", beginWhenVisible);
      document.removeEventListener("visibilitychange", beginWhenVisible);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!playing) return;
    const stopTimer = reducedMotion ? window.setTimeout(
      () => setPlaying(false), DIWALI_CONFIG.durationMs,
    ) : null;
    // Keep fireworks running while the homepage hero is visible.
    const loopTimer = reducedMotion ? null : window.setInterval(
      () => setCycle((value) => value + 1),
      DIWALI_CONFIG.durationMs,
    );
    return () => {
      if (stopTimer !== null) window.clearTimeout(stopTimer);
      if (loopTimer !== null) window.clearInterval(loopTimer);
    };
  }, [playing, reducedMotion]);

  if (!DIWALI_CONFIG.enabled) return null;

  return (
    <>
      <div ref={sceneryRef} className={styles.scenery} aria-hidden="true">
        {playing && !reducedMotion && (
          <div key={cycle} className={styles.scenery}>
            <div className={styles.glow} />
            <FireworksCanvas durationMs={DIWALI_CONFIG.durationMs} />
          </div>
        )}
      </div>
      {createPortal(
        <>
          <button
            type="button"
            className={styles.replay}
            onClick={() => setPlaying(true)}
            disabled={playing}
            aria-label="Replay Diwali celebration"
            title="Replay Diwali celebration"
          >
            <Sparkles size={18} aria-hidden="true" />
            <span>Diwali</span>
          </button>
        </>,
        document.body,
      )}
    </>
  );
}
