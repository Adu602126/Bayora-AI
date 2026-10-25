'use client';
import { useState, useEffect, useRef } from 'react';
import { Square } from 'lucide-react';

interface AudioRecordingProps {
  onStop: () => void;
}

export default function AudioRecordingOverlay({ onStop }: AudioRecordingProps) {
  const [elapsed, setElapsed] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(Array(32).fill(4));
  const animRef = useRef<NodeJS.Timeout | null>(null);

  // Timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Animate waveform
  useEffect(() => {
    animRef.current = setInterval(() => {
      setWaveform(Array(32).fill(0).map(() => Math.random() * 36 + 4));
    }, 120);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'linear-gradient(180deg, rgba(8,13,24,0.97) 0%, rgba(20,5,5,0.98) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32,
    }}>
      {/* Pulsing record dot */}
      <div style={{ position: 'relative', marginBottom: 32 }}>
        {[1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute',
            inset: `-${i * 18}px`,
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)',
            animation: `recPulse ${1 + i * 0.4}s ease-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'radial-gradient(circle, #ef4444, #dc2626)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(239,68,68,0.5)',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff' }} />
        </div>
      </div>

      {/* Recording label */}
      <div style={{
        fontSize: 13, letterSpacing: '3px', textTransform: 'uppercase',
        color: '#ef4444', fontWeight: 700, marginBottom: 8,
        animation: 'livePulse 1s infinite',
      }}>
        ● Recording
      </div>

      {/* Timer */}
      <div style={{
        fontFamily: 'var(--font-head)', fontSize: 40, fontWeight: 900,
        color: '#fff', letterSpacing: '2px', marginBottom: 24,
      }}>
        {fmt(elapsed)}
      </div>

      {/* Waveform */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2,
        height: 48, marginBottom: 32, width: '100%', justifyContent: 'center',
      }}>
        {waveform.map((h, i) => (
          <div key={i} style={{
            width: 3, height: h, borderRadius: 2,
            background: `rgba(239,68,68,${0.4 + (h / 40) * 0.6})`,
            transition: 'height 0.1s ease',
            flexShrink: 0,
          }} />
        ))}
      </div>

      <div style={{
        fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 40, textAlign: 'center',
        lineHeight: 1.6,
      }}>
        Audio recording in progress<br />
        Shared automatically with guardians on SOS
      </div>

      {/* Stop button */}
      <button onClick={onStop} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 16, padding: '14px 28px',
        color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700,
        transition: 'all 0.2s',
      }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
      >
        <Square size={16} fill="#fff" /> Stop Recording
      </button>

      <style>{`
        @keyframes recPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
