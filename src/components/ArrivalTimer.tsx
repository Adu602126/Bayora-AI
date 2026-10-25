'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Timer, AlertTriangle, CheckCircle } from 'lucide-react';
import Confetti from '@/components/Confetti';
import { toast } from '@/components/Toast';

interface ArrivalTimerProps {
  onSOS: () => void;
  onClose: () => void;
}

const PRESETS = [5, 10, 15, 20, 30];

export default function ArrivalTimer({ onSOS, onClose }: ArrivalTimerProps) {
  const [minutes, setMinutes] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(intervalRef.current!);
          setTriggered(true);
          onSOS();
          return 0;
        }
        // Vibrate every 30s as warning
        if (r % 30 === 0) navigator.vibrate?.([200, 100, 200]);
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [running, onSOS]);

  const start = (m: number) => {
    setMinutes(m);
    setRemaining(m * 60);
    setRunning(true);
  };

  const dismiss = () => {
    clearInterval(intervalRef.current!);
    navigator.vibrate?.([100, 50, 100]);
    setShowConfetti(true);
    toast.success('You arrived safely! 🎉', 'Timer dismissed — guardians notified.');
    setTimeout(() => onClose(), 2800);
  };

  const pct = minutes ? ((minutes * 60 - remaining) / (minutes * 60)) * 100 : 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isWarning = remaining > 0 && remaining <= 60;
  const isDanger  = remaining > 0 && remaining <= 30;

  return (
    <>
    {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-end',
      backdropFilter: 'blur(6px)',
    }} onClick={e => { if (e.target === e.currentTarget && !running) onClose(); }}>
      <div className="fade-in-up" style={{
        width: '100%', maxWidth: 430, margin: '0 auto',
        background: 'var(--bg-2)',
        border: `1px solid ${isDanger ? 'rgba(239,68,68,0.4)' : isWarning ? 'rgba(245,158,11,0.3)' : 'var(--border-2)'}`,
        borderRadius: '24px 24px 0 0',
        padding: '20px 20px 40px',
        transition: 'border-color 0.3s',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Timer size={18} color={isDanger ? 'var(--red)' : isWarning ? 'var(--amber)' : 'var(--teal)'} />
            <span style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 800 }}>
              Safe Arrival Timer
            </span>
          </div>
          {!running && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={18} /></button>}
        </div>

        {triggered ? (
          /* Triggered state */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <AlertTriangle size={48} color="var(--red)" style={{ marginBottom: 12 }} />
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: 'var(--red)', marginBottom: 8 }}>
              SOS Triggered!
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
              Your emergency contacts have been alerted. Help is on the way.
            </div>
            <button className="btn-danger" onClick={onClose}>Close</button>
          </div>
        ) : !running ? (
          /* Setup state */
          <>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 18, lineHeight: 1.6 }}>
              ⏱️ Set a timer. If you don&apos;t dismiss it when you arrive safely, <strong>SOS will auto-trigger</strong> and alert your emergency contacts.
            </div>
            <div className="section-h">Choose duration</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {PRESETS.map(m => (
                <button key={m} onClick={() => start(m)} style={{
                  background: 'rgba(20,184,166,0.08)',
                  border: '1px solid rgba(20,184,166,0.25)',
                  color: 'var(--teal)',
                  borderRadius: 10, padding: '10px 16px',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s',
                }}>
                  {m} min
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Running state */
          <>
            {/* Circular timer */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 24px' }}>
              <div style={{ position: 'relative', width: 150, height: 150, marginBottom: 20 }}>
                <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="75" cy="75" r="65" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <circle
                    cx="75" cy="75" r="65" fill="none"
                    stroke={isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#14b8a6'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 65}`}
                    strokeDashoffset={`${2 * Math.PI * 65 * (pct / 100)}`}
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 900,
                    color: isDanger ? 'var(--red)' : isWarning ? 'var(--amber)' : 'var(--text)',
                    animation: isDanger ? 'livePulse 0.8s infinite' : 'none',
                  }}>
                    {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.5px' }}>remaining</div>
                </div>
              </div>

              {isWarning && (
                <div style={{
                  background: isDanger ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                  border: `1px solid ${isDanger ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  borderRadius: 10, padding: '8px 14px',
                  fontSize: 12, color: isDanger ? 'var(--red)' : 'var(--amber)',
                  marginBottom: 16, textAlign: 'center',
                  animation: 'livePulse 1s infinite',
                }}>
                  {isDanger ? '🚨 SOS activating soon!' : '⚠️ Almost time — tap dismiss if safe'}
                </div>
              )}

              <button
                onClick={dismiss}
                style={{
                  width: '100%', padding: '16px',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  border: 'none', borderRadius: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 800, color: '#fff',
                  boxShadow: '0 4px 20px rgba(34,197,94,0.35)',
                  transition: 'transform 0.15s',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <CheckCircle size={20} /> ✅ I&apos;m Safe — Dismiss
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}
