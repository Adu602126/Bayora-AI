'use client';
import { useState, useEffect, useRef } from 'react';
import { Shield, Delete, Eye, EyeOff } from 'lucide-react';

interface PINLockProps {
  mode: 'set' | 'verify';
  onSuccess: () => void;
  onCancel?: () => void;
}

const STORAGE_KEY = 'sp-pin-hash';

// Simple hash — good enough for a local PIN
function hashPIN(pin: string) {
  let h = 0;
  for (let i = 0; i < pin.length; i++) h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0;
  return h.toString(36);
}

export function hasPIN() {
  return typeof window !== 'undefined' && !!localStorage.getItem(STORAGE_KEY);
}

export function clearPIN() {
  localStorage.removeItem(STORAGE_KEY);
}

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function PINLock({ mode, onSuccess, onCancel }: PINLockProps) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>(mode === 'set' ? 'enter' : 'enter');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (locked && lockSeconds > 0) {
      timerRef.current = setInterval(() => {
        setLockSeconds(s => {
          if (s <= 1) { setLocked(false); setAttempts(0); clearInterval(timerRef.current!); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [locked, lockSeconds]);

  const triggerShake = (msg: string) => {
    setError(msg);
    setShake(true);
    navigator.vibrate?.([100, 50, 100]);
    setTimeout(() => setShake(false), 500);
  };

  const press = (key: string) => {
    if (locked) return;
    if (key === '⌫') {
      if (step === 'enter' || mode === 'verify') setPin(p => p.slice(0, -1));
      else setConfirm(p => p.slice(0, -1));
      setError('');
      return;
    }
    if (key === '') return;

    const current = (step === 'confirm' && mode === 'set') ? confirm : pin;
    if (current.length >= 4) return;

    const next = current + key;

    if (mode === 'verify') {
      setPin(next);
      if (next.length === 4) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === hashPIN(next)) {
          navigator.vibrate?.([50, 30, 100]);
          onSuccess();
        } else {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          setTimeout(() => setPin(''), 200);
          if (newAttempts >= 5) {
            setLocked(true);
            setLockSeconds(30);
            triggerShake('Too many attempts. Wait 30s.');
          } else {
            triggerShake(`Wrong PIN. ${5 - newAttempts} attempts left.`);
          }
        }
      }
      return;
    }

    // Set mode
    if (step === 'enter') {
      setPin(next);
      if (next.length === 4) {
        setTimeout(() => setStep('confirm'), 150);
        setError('');
      }
    } else {
      setConfirm(next);
      if (next.length === 4) {
        if (next !== pin) {
          setConfirm('');
          triggerShake("PINs don't match. Try again.");
        } else {
          localStorage.setItem(STORAGE_KEY, hashPIN(next));
          navigator.vibrate?.([50, 30, 100]);
          onSuccess();
        }
      }
    }
  };

  const displayPin = (mode === 'set' && step === 'confirm') ? confirm : pin;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(180deg, #080d18 0%, #0a1020 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', zIndex: 9999, padding: '0 32px',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(20,184,166,0.2), rgba(59,130,246,0.15))',
          border: '1.5px solid rgba(20,184,166,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
          boxShadow: '0 0 30px rgba(20,184,166,0.2)',
        }}>
          <Shield size={32} style={{ color: 'var(--teal)' }} />
        </div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: '#fff' }}>SafePath</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
          {locked
            ? `Locked for ${lockSeconds}s`
            : mode === 'verify'
            ? 'Enter your PIN to continue'
            : step === 'enter'
            ? 'Create a 4-digit PIN'
            : 'Confirm your PIN'}
        </div>
      </div>

      {/* PIN dots */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 12,
        animation: shake ? 'shakePIN 0.4s ease' : 'none',
      }}>
        {[0,1,2,3].map(i => {
          const filled = i < displayPin.length;
          return (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: '50%',
              background: filled ? 'var(--teal)' : 'rgba(255,255,255,0.1)',
              border: `2px solid ${filled ? 'var(--teal)' : 'rgba(255,255,255,0.2)'}`,
              boxShadow: filled ? '0 0 12px rgba(20,184,166,0.6)' : 'none',
              transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: filled ? 'scale(1.1)' : 'scale(1)',
            }} />
          );
        })}
        {/* Reveal toggle */}
        <button onClick={() => setRevealed(r => !r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', marginLeft: 4, padding: 0 }}>
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {/* Revealed digits */}
      {revealed && displayPin && (
        <div style={{ fontSize: 22, letterSpacing: 8, color: 'var(--teal)', fontFamily: 'var(--font-head)', fontWeight: 800, marginBottom: 4 }}>
          {displayPin}
        </div>
      )}

      {/* Error */}
      <div style={{ height: 18, fontSize: 12, color: 'var(--red)', fontWeight: 600, marginBottom: 24, textAlign: 'center' }}>
        {error}
      </div>

      {/* Keypad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 280 }}>
        {KEYS.map((key, i) => {
          if (key === '') return <div key={i} />;
          const isDelete = key === '⌫';
          return (
            <button
              key={i}
              onClick={() => press(key)}
              style={{
                height: 65, borderRadius: 16,
                background: isDelete ? 'transparent' : 'rgba(255,255,255,0.06)',
                border: isDelete ? 'none' : '1px solid rgba(255,255,255,0.08)',
                color: '#fff', cursor: locked ? 'not-allowed' : 'pointer',
                fontSize: isDelete ? 18 : 24,
                fontFamily: 'var(--font-head)', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.1s', opacity: locked ? 0.4 : 1,
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseDown={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(20,184,166,0.15)'; (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.background = isDelete ? 'transparent' : 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              {isDelete ? <Delete size={20} /> : key}
            </button>
          );
        })}
      </div>

      {/* Cancel / Skip */}
      {onCancel && (
        <button onClick={onCancel} style={{ marginTop: 24, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
          {mode === 'set' ? 'Skip for now' : 'Use without PIN'}
        </button>
      )}

      <style>{`
        @keyframes shakePIN {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
