'use client';
import { useEffect, useRef } from 'react';

// ── Canvas particle mesh background ──────────────────────────────────────────
export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    let W = canvas.width  = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    let raf: number;

    // ── Particles ──────────────────────────────────────────────────────────
    const COUNT = 38;
    interface Particle { x: number; y: number; vx: number; vy: number; r: number; a: number; }
    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.8 + 0.5,
      a: Math.random() * 0.5 + 0.15,
    }));

    const LINK_DIST = 110;
    const TEAL  = { r: 20,  g: 184, b: 166 };
    const BLUE  = { r: 59,  g: 130, b: 246 };

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Update particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
      }

      // Draw links
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d > LINK_DIST) continue;
          const t   = 1 - d / LINK_DIST;
          const col = d < LINK_DIST / 2 ? TEAL : BLUE;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},${t * 0.18})`;
          ctx.lineWidth = t * 0.8;
          ctx.stroke();
        }
      }

      // Draw dots
      for (const p of particles) {
        const t   = performance.now() / 3000;
        const col = { r: lerp(TEAL.r, BLUE.r, (Math.sin(t + p.x) + 1) / 2), g: lerp(TEAL.g, BLUE.g, (Math.sin(t + p.x) + 1) / 2), b: lerp(TEAL.b, BLUE.b, (Math.sin(t + p.x) + 1) / 2) };
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col.r|0},${col.g|0},${col.b|0},${p.a})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    draw();

    // Resize
    const obs = new ResizeObserver(() => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      for (const p of particles) {
        p.x = Math.random() * W;
        p.y = Math.random() * H;
      }
    });
    obs.observe(canvas);

    return () => { cancelAnimationFrame(raf); obs.disconnect(); };
  }, []);

  return (
    <>
      {/* Canvas particle mesh */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.7,
        }}
      />

      {/* Static gradient orbs behind the canvas */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Top-left teal glow */}
        <div style={{
          position: 'absolute', top: '-15%', left: '-15%',
          width: '65%', height: '65%',
          background: 'radial-gradient(circle at 40% 40%, rgba(20,184,166,0.13) 0%, transparent 70%)',
          animation: 'bgOrb1 18s ease-in-out infinite',
        }} />
        {/* Right-center blue glow */}
        <div style={{
          position: 'absolute', top: '30%', right: '-20%',
          width: '60%', height: '60%',
          background: 'radial-gradient(circle at 60% 50%, rgba(59,130,246,0.10) 0%, transparent 70%)',
          animation: 'bgOrb2 22s ease-in-out infinite',
        }} />
        {/* Bottom-left purple glow */}
        <div style={{
          position: 'absolute', bottom: '5%', left: '5%',
          width: '55%', height: '55%',
          background: 'radial-gradient(circle at 40% 60%, rgba(139,92,246,0.09) 0%, transparent 70%)',
          animation: 'bgOrb3 20s ease-in-out infinite',
        }} />
        {/* Center micro-highlight */}
        <div style={{
          position: 'absolute', top: '45%', left: '35%',
          width: '30%', height: '30%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 80%)',
          animation: 'bgOrb2 26s ease-in-out infinite reverse',
        }} />

        {/* Subtle horizontal grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.018) 39px, rgba(255,255,255,0.018) 40px),
            repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.018) 40px, rgba(255,255,255,0.018) 41px)
          `,
        }} />

        {/* Top vignette edge glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent 0%, rgba(20,184,166,0.5) 30%, rgba(59,130,246,0.5) 70%, transparent 100%)',
          animation: 'topLineGlow 4s ease-in-out infinite',
        }} />
      </div>

      <style>{`
        @keyframes bgOrb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(40px,-50px) scale(1.1); }
          66%      { transform: translate(-30px,30px) scale(0.92); }
        }
        @keyframes bgOrb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(-50px,35px) scale(1.08); }
          70%      { transform: translate(30px,-25px) scale(1.05); }
        }
        @keyframes bgOrb3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(25px,40px) scale(0.9); }
        }
        @keyframes topLineGlow {
          0%,100% { opacity: 0.5; }
          50%      { opacity: 1; }
        }
      `}</style>
    </>
  );
}
