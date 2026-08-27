import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const PARTICLE_COUNT = 110;
const LINK_DISTANCE = 140;
const MOUSE_RADIUS = 110;
const MOUSE_FORCE = 0.6;
const BASE_SPEED = 0.45;
const MIN_SPEED = 0.4;
const JITTER = 0.12;
const MAX_SPEED = 1.4;
const DAMPING = 0.995;

export function ParticleNetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // jsdom (unit tests) has no canvas 2D backend and throws rather than
    // returning null, so this needs a try/catch, not just a null check.
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      return;
    }
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999 };
    let width = 0;
    let height = 0;
    let frameId: number | undefined;

    function resize() {
      const parent = canvas!.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }

    function handleMouseLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * BASE_SPEED,
      vy: (Math.random() - 0.5) * BASE_SPEED
    }));

    function drawFrame() {
      ctx!.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < LINK_DISTANCE) {
            ctx!.strokeStyle = `rgba(150, 102, 42, ${(1 - dist / LINK_DISTANCE) * 0.65})`;
            ctx!.lineWidth = 1.2;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(150, 102, 42, 0.85)";
        ctx!.fill();
      }
    }

    // Particles gently push away from the cursor (even through the card on top,
    // since mouse position is tracked on window) and otherwise keep roaming the
    // full canvas: light damping plus a firm minimum-speed floor stop them from
    // settling into a local wobble the way heavier friction would.
    function step() {
      for (const p of particles) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < MOUSE_RADIUS) {
          const push = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          p.vx += (dx / dist) * push * MOUSE_FORCE;
          p.vy += (dy / dist) * push * MOUSE_FORCE;
        }

        // Continuous random perturbation every frame (not just when slow) gives
        // an erratic, jittery drift instead of smooth straight-line motion.
        p.vx += (Math.random() - 0.5) * JITTER;
        p.vy += (Math.random() - 0.5) * JITTER;

        p.vx *= DAMPING;
        p.vy *= DAMPING;

        const speed = Math.hypot(p.vx, p.vy);
        if (speed > MAX_SPEED) {
          p.vx = (p.vx / speed) * MAX_SPEED;
          p.vy = (p.vy / speed) * MAX_SPEED;
        } else if (speed < MIN_SPEED) {
          const boost = MIN_SPEED / Math.max(speed, 0.0001);
          p.vx *= boost;
          p.vy *= boost;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Respawning off-screen particles at a fresh random point (instead of
        // bouncing them off the edge) avoids the "stuck at the border" look,
        // and self-corrects any pile-up along an edge after the window shrinks.
        if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          const angle = Math.random() * Math.PI * 2;
          p.vx = Math.cos(angle) * BASE_SPEED;
          p.vy = Math.sin(angle) * BASE_SPEED;
        }
      }

      drawFrame();
      frameId = requestAnimationFrame(step);
    }

    if (prefersReducedMotion) {
      drawFrame();
    } else {
      frameId = requestAnimationFrame(step);
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      if (frameId !== undefined) cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" />;
}
