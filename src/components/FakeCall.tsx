'use client';
import { useEffect, useState, useRef } from 'react';
import { Phone, PhoneOff } from 'lucide-react';

const CALLERS = [
  { name: 'Mom 💛', number: '+91 98765 43210', avatar: '👩' },
  { name: 'Priya (Friend) 💙', number: '+91 87654 32109', avatar: '👧' },
  { name: 'Dad 🧡', number: '+91 76543 21098', avatar: '👨' },
  { name: 'Rahul Bhaiya 💚', number: '+91 65432 10987', avatar: '👦' },
];

interface FakeCallProps {
  onClose: () => void;
}

export default function FakeCall({ onClose }: FakeCallProps) {
  const [answered, setAnswered] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const caller = CALLERS[Math.floor(Math.random() * CALLERS.length)];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Vibration pattern (SOS-like ringing)
  useEffect(() => {
    if (!answered && 'vibrate' in navigator) {
      const v = setInterval(() => navigator.vibrate([400, 200, 400]), 1800);
      return () => { clearInterval(v); navigator.vibrate(0); };
    }
  }, [answered]);

  // Call duration counter
  useEffect(() => {
    if (!answered) return;
    timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [answered]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const answer = () => {
    navigator.vibrate?.(0);
    setAnswered(true);
  };

  const hangup = () => {
    navigator.vibrate?.(0);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'linear-gradient(180deg, #0a1628 0%, #0d1f3c 50%, #080d18 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'space-between', padding: '60px 32px 70px',
      animation: 'fadeIn 0.3s ease',
    }}>
      {/* Top — caller info */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 11, color: 'var(--teal)', letterSpacing: '2px',
          textTransform: 'uppercase', marginBottom: 20,
        }}>
          {answered ? '📞 On Call' : '📲 Incoming Call'}
        </div>

        {/* Avatar with rings */}
        <div style={{ position: 'relative', display: 'inline-flex', marginBottom: 20 }}>
          {!answered && [1, 2, 3].map(i => (
            <div key={i} style={{
              position: 'absolute',
              inset: `-${i * 18}px`,
              borderRadius: '50%',
              border: '1.5px solid rgba(20,184,166,0.2)',
              animation: `ring-expand ${1.2 + i * 0.3}s ease-out infinite`,
              animationDelay: `${i * 0.25}s`,
            }} />
          ))}
          <div style={{
            width: 110, height: 110, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(20,184,166,0.25), rgba(59,130,246,0.2))',
            border: '3px solid rgba(20,184,166,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 52,
            boxShadow: '0 0 40px rgba(20,184,166,0.25)',
            position: 'relative', zIndex: 1,
          }}>
            {caller.avatar}
          </div>
        </div>

        <div style={{
          fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800,
          color: 'var(--text)', marginBottom: 8,
        }}>{caller.name}</div>
        <div style={{ fontSize: 14, color: 'var(--text-3)' }}>{caller.number}</div>

        {answered && (
          <div style={{
            marginTop: 14, fontSize: 22, fontWeight: 700,
            fontFamily: 'var(--font-head)', color: 'var(--teal)',
            letterSpacing: '2px',
          }}>
            {fmt(callDuration)}
          </div>
        )}
        {!answered && (
          <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-3)', animation: 'livePulse 1.5s infinite' }}>
            Ringing…
          </div>
        )}
      </div>

      {/* Middle — this is a simulated call notice */}
      <div style={{
        background: 'rgba(20,184,166,0.06)',
        border: '1px solid rgba(20,184,166,0.15)',
        borderRadius: 12, padding: '10px 18px',
        fontSize: 11, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.6,
      }}>
        🔒 Simulated for your safety · Use to escape uncomfortable situations
      </div>

      {/* Bottom — call buttons */}
      <div style={{
        display: 'flex', gap: answered ? 40 : 60,
        alignItems: 'center', justifyContent: 'center', width: '100%',
      }}>
        {/* Decline / Hang up */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={hangup} style={{
            width: 68, height: 68, borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(239,68,68,0.4)',
            transition: 'transform 0.15s',
          }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <PhoneOff size={26} color="#fff" />
          </button>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
            {answered ? 'End' : 'Decline'}
          </div>
        </div>

        {/* Answer (only before answering) */}
        {!answered && (
          <div style={{ textAlign: 'center' }}>
            <button onClick={answer} style={{
              width: 68, height: 68, borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 24px rgba(34,197,94,0.4)',
              animation: 'teal-pulse 1.5s infinite',
              transition: 'transform 0.15s',
            }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Phone size={26} color="#fff" />
            </button>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>Answer</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ring-expand {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
