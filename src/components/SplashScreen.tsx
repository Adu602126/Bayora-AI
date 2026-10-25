'use client';
import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 4;
      if (p >= 100) { p = 100; clearInterval(iv); }
      setProgress(Math.min(p, 100));
    }, 120);

    // Sequence: fade in → hold → fade out → done
    const t1 = setTimeout(() => setPhase('hold'), 400);
    const t2 = setTimeout(() => setPhase('out'),  2200);
    const t3 = setTimeout(onDone,                 2900);

    return () => { clearInterval(iv); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#080d18',
      opacity: phase === 'out' ? 0 : 1,
      transition: phase === 'out' ? 'opacity 0.7s cubic-bezier(0.4,0,0.2,1)' : 'none',
      pointerEvents: phase === 'out' ? 'none' : 'all',
    }}>

      {/* ── Animated background rings ──────────────────────────────────────── */}
      {[1,2,3].map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: `${180 + i * 90}px`,
          height: `${180 + i * 90}px`,
          borderRadius: '50%',
          border: `1px solid rgba(20,184,166,${0.12 - i * 0.03})`,
          animation: `splash-ring ${2 + i * 0.6}s ease-in-out infinite`,
          animationDelay: `${i * 0.3}s`,
        }} />
      ))}

      {/* ── Glow orbs ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: '20%', left: '10%',
        width: 240, height: 240,
        background: 'radial-gradient(circle, rgba(20,184,166,0.18) 0%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'splash-float 4s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '8%',
        width: 200, height: 200,
        background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'splash-float 5s ease-in-out infinite reverse',
      }} />
      <div style={{
        position: 'absolute', top: '55%', left: '5%',
        width: 160, height: 160,
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
        filter: 'blur(36px)',
        animation: 'splash-float 6s ease-in-out infinite',
        animationDelay: '1s',
      }} />

      {/* ── Logo block ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        animation: 'splash-in 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}>
        {/* Shield icon */}
        <div style={{
          width: 88, height: 88,
          borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(20,184,166,0.2), rgba(59,130,246,0.15))',
          border: '1.5px solid rgba(20,184,166,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 42,
          boxShadow: '0 0 40px rgba(20,184,166,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
        }}>
          🛡️
        </div>

        {/* App name */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-head)',
            fontSize: 34, fontWeight: 900,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #14b8a6 0%, #3b82f6 50%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.1,
          }}>
            SafePath
          </div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13, color: 'rgba(148,163,184,0.8)',
            letterSpacing: '3px', textTransform: 'uppercase',
            marginTop: 6,
          }}>
            Indore · Safe Routes
          </div>
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 13, color: 'rgba(148,163,184,0.6)',
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.3px',
          animation: 'splash-in 0.7s ease 0.3s both',
        }}>
          Your safety, always on.
        </div>

        {/* Progress bar */}
        <div style={{
          width: 180, marginTop: 12,
          animation: 'splash-in 0.5s ease 0.4s both',
        }}>
          <div style={{
            height: 3, background: 'rgba(255,255,255,0.07)',
            borderRadius: 3, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #14b8a6, #3b82f6)',
              borderRadius: 3,
              transition: 'width 0.15s ease',
              boxShadow: '0 0 8px rgba(20,184,166,0.6)',
            }} />
          </div>
          <div style={{
            textAlign: 'center', marginTop: 8,
            fontSize: 10, color: 'rgba(84,106,138,0.8)',
            fontFamily: 'var(--font-body)', letterSpacing: '1px',
          }}>
            {progress < 100 ? 'Loading…' : 'Ready'}
          </div>
        </div>
      </div>

      {/* ── Powered by tag ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 40,
        fontSize: 11, color: 'rgba(84,106,138,0.6)',
        fontFamily: 'var(--font-body)', letterSpacing: '0.5px',
        animation: 'splash-in 0.6s ease 0.5s both',
      }}>
        Team The Riser · BGI Hackathon 2026
      </div>

      <style>{`
        @keyframes splash-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splash-ring {
          0%, 100% { transform: scale(1);    opacity: 0.6; }
          50%       { transform: scale(1.06); opacity: 1; }
        }
        @keyframes splash-float {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(12px, -18px); }
        }
      `}</style>
    </div>
  );
}
