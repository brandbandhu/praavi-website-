import { useEffect, useRef } from "react";
import styles from "./diwali.module.css";

const COLORS = ["#FFD166", "#FFD166", "#FFBA49", "#FF7A18", "#EC4899"];
const random = (min, max) => min + Math.random() * (max - min);

export default function FireworksCanvas({ durationMs = 5000 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = 0;
    let height = 0;
    let frame;
    let previous = 0;
    let start;
    let particles = [];
    let rockets = [];
    let nextLaunch = 0;
    let compact;
    let glowSprites;
    const launches = [1000, 1320, 1660, 2050, 2350];

    // Cache bloom once; avoid expensive shadowBlur on every particle per frame.
    const makeGlow = (color) => {
      const sprite = document.createElement("canvas");
      sprite.width = sprite.height = 32;
      const paint = sprite.getContext("2d");
      const gradient = paint.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.2, `${color}bb`);
      gradient.addColorStop(1, `${color}00`);
      paint.fillStyle = gradient;
      paint.fillRect(0, 0, 32, 32);
      return sprite;
    };
    glowSprites = COLORS.map(makeGlow);

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      // ResizeObserver also fires on initial observe and unrelated layout changes.
      // Preserve live rockets and trails when the canvas dimensions are unchanged.
      if (width === bounds.width && height === bounds.height) return;
      ({ width, height } = bounds);
      compact = width < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = [];
      rockets = [];
    };

    const burst = (rocket) => {
      const count = compact ? 48 : 96;
      const speed = Math.min(width, height) * random(0.28, 0.4);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + random(-0.07, 0.07);
        const velocity = speed * (Math.random() < 0.7 ? random(0.78, 1) : random(0.25, 0.7));
        particles.push({
          x: rocket.x, y: rocket.y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: 0, duration: random(1.2, 1.9),
          color: Math.random() < 0.08 ? 4 : rocket.color,
          radius: random(0.9, 1.6), trail: [],
        });
      }
    };

    const drawTrail = (points, color, opacity, lineWidth) => {
      if (points.length < 2) return;
      ctx.strokeStyle = COLORS[color];
      ctx.lineWidth = lineWidth;
      for (let i = 1; i < points.length; i++) {
        ctx.globalAlpha = opacity * (i / points.length) * 0.8;
        ctx.beginPath();
        ctx.moveTo(points[i - 1].x, points[i - 1].y);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
      }
    };

    const draw = (now) => {
      if (start === undefined) start = now;
      const elapsed = now - start;
      const dt = Math.min((now - (previous || now)) / 1000, 0.033);
      previous = now;
      ctx.clearRect(0, 0, width, height);
      if (elapsed >= durationMs) return;
      const fade = Math.min(elapsed / 700, 1, (durationMs - elapsed) / 900);
      ctx.globalCompositeOperation = "lighter";

      // A handful of slow embers confined to the edges, away from the copy.
      for (let i = 0; i < (compact ? 10 : 20); i++) {
        const x = i % 2 ? width * 0.94 - (i % 4) * 9 : width * 0.04 + (i % 4) * 9;
        const y = (height * (i / 20) + height - elapsed * (0.009 + (i % 3) * 0.003)) % height;
        ctx.globalAlpha = fade * (0.2 + 0.18 * Math.sin(elapsed / 800 + i));
        ctx.drawImage(glowSprites[0], x - 4, y - 4, 8, 8);
      }

      const launchCount = compact ? 3 : 5;
      if (nextLaunch < launchCount && elapsed >= launches[nextLaunch]) {
        const positions = [0.14, 0.85, 0.29, 0.72, 0.5];
        const targetX = width * positions[nextLaunch];
        rockets.push({
          x: targetX + random(-30, 30), y: height * 0.96,
          targetX, targetY: Math.min(height, window.innerHeight * 0.8) * random(0.15, 0.36),
          originY: height * 0.96, originX: targetX + random(-20, 20),
          age: 0, color: nextLaunch % 4, trail: [],
        });
        nextLaunch++;
      }

      rockets = rockets.filter((rocket) => {
        rocket.age += dt;
        const progress = Math.min(rocket.age / 0.62, 1);
        const eased = 1 - (1 - progress) ** 1.6;
        rocket.x = rocket.originX + (rocket.targetX - rocket.originX) * progress;
        rocket.y = rocket.originY + (rocket.targetY - rocket.originY) * eased;
        rocket.trail.push({ x: rocket.x, y: rocket.y });
        if (rocket.trail.length > 12) rocket.trail.shift();
        drawTrail(rocket.trail, rocket.color, fade * 0.65, 1);
        ctx.globalAlpha = fade * 0.8;
        ctx.drawImage(glowSprites[rocket.color], rocket.x - 5, rocket.y - 5, 10, 10);
        if (progress === 1) { burst(rocket); return false; }
        return true;
      });

      particles = particles.filter((particle) => {
        particle.life += dt;
        if (particle.life >= particle.duration) return false;
        const drag = Math.exp(-1.1 * dt);
        particle.vx *= drag;
        particle.vy = particle.vy * drag + 48 * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.trail.push({ x: particle.x, y: particle.y });
        if (particle.trail.length > (compact ? 6 : 9)) particle.trail.shift();
        const alpha = (1 - particle.life / particle.duration) ** 1.4 * fade;
        drawTrail(particle.trail, particle.color, alpha, particle.radius * 0.7);
        ctx.globalAlpha = alpha;
        const size = particle.radius * 8;
        ctx.drawImage(glowSprites[particle.color], particle.x - size / 2, particle.y - size / 2, size, size);
        ctx.fillStyle = COLORS[particle.color];
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 0.65, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      frame = requestAnimationFrame(draw);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      ctx.clearRect(0, 0, width, height);
      particles = [];
      rockets = [];
    };
  }, [durationMs]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
