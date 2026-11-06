import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";
import FireworksCanvas from "./FireworksCanvas";
import { DIWALI_CONFIG } from "./config";
import styles from "./diwali.module.css";

// Also remember playback in memory when browser privacy settings block storage.
let playedInMemory = false;

export default function DiwaliCelebration() {
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
    const beginWhenVisible = () => {
      window.clearTimeout(timer);
      if (document.hidden || document.readyState !== "complete") return;
      // Let the loaded hero paint before starting the celebration.
      timer = window.setTimeout(() => {
        let seen = playedInMemory;
        try {
          seen = seen || (!DIWALI_CONFIG.previewOnReload && sessionStorage.getItem(DIWALI_CONFIG.sessionKey) === "true");
        } catch { /* Fall back to session memory when storage is unavailable. */ }
        if (seen || document.hidden || window.scrollY > 0) return;
        playedInMemory = true;
        try {
          sessionStorage.setItem(DIWALI_CONFIG.sessionKey, "true");
        } catch { /* Session memory still prevents replay between routes. */ }
        setPlaying(true);
      }, 400);
    };
    beginWhenVisible();
    window.addEventListener("load", beginWhenVisible);
    document.addEventListener("visibilitychange", beginWhenVisible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("load", beginWhenVisible);
      document.removeEventListener("visibilitychange", beginWhenVisible);
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const stopTimer = reducedMotion ? window.setTimeout(
      () => setPlaying(false), DIWALI_CONFIG.durationMs,
    ) : null;
    // Keep short fireworks sequences running until the visitor scrolls.
    const loopTimer = reducedMotion ? null : window.setInterval(
      () => setCycle((value) => value + 1),
      DIWALI_CONFIG.durationMs,
    );
    const onScroll = () => setPlaying(false);
    window.addEventListener("scroll", onScroll, { passive: true, once: true });
    // Do not return to an old celebration after switching browser tabs.
    const onVisibility = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (stopTimer !== null) window.clearTimeout(stopTimer);
      if (loopTimer !== null) window.clearInterval(loopTimer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [playing, reducedMotion]);

  if (!DIWALI_CONFIG.enabled) return null;

  return (
    <>
      {playing && !reducedMotion && (
        <div key={cycle} className={styles.scenery} aria-hidden="true">
          <div className={styles.glow} />
          <FireworksCanvas durationMs={DIWALI_CONFIG.durationMs} />
        </div>
      )}
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
