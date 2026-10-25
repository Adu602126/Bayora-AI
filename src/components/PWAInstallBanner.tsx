'use client';
import { useState } from 'react';
import { Download, X, Smartphone, Zap, WifiOff } from 'lucide-react';

interface PWAInstallBannerProps {
  onInstall: () => Promise<string | null>;
  onDismiss: () => void;
}

export default function PWAInstallBanner({ onInstall, onDismiss }: PWAInstallBannerProps) {
  const [installing, setInstalling] = useState(false);
  const [done, setDone] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    navigator.vibrate?.([100]);
    const result = await onInstall();
    setInstalling(false);
    if (result === 'accepted') {
      setDone(true);
      setTimeout(onDismiss, 2000);
    }
  };

  if (done) return (
    <div className="fade-in" style={{
      position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)', maxWidth: 398,
      background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(20,184,166,0.12))',
      border: '1px solid rgba(34,197,94,0.35)',
      borderRadius: 18, padding: '16px 18px', zIndex: 800,
      display: 'flex', alignItems: 'center', gap: 10,
      backdropFilter: 'blur(20px)',
    }}>
      <span style={{ fontSize: 24 }}>✅</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>SafePath Installed!</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Find it on your home screen</div>
      </div>
    </div>
  );

  return (
    <div className="fade-in-up" style={{
      position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)', maxWidth: 398,
      background: 'linear-gradient(145deg, rgba(8,13,24,0.97), rgba(14,22,40,0.97))',
      border: '1px solid rgba(20,184,166,0.3)',
      borderRadius: 20, zIndex: 800,
      overflow: 'hidden',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 16px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(20,184,166,0.08)',
    }}>
      {/* Top glow line */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #14b8a6, #3b82f6, transparent)' }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(20,184,166,0.2), rgba(59,130,246,0.15))',
              border: '1px solid rgba(20,184,166,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>🛡️</div>
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 800 }}>Install SafePath</div>
              <div style={{ fontSize: 11, color: 'var(--teal)' }}>Add to Home Screen</div>
            </div>
          </div>
          <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2 }}>
            <X size={16} />
          </button>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { icon: <WifiOff size={11} />, label: 'Works Offline' },
            { icon: <Zap size={11} />, label: 'Instant SOS' },
            { icon: <Smartphone size={11} />, label: 'Native Feel' },
          ].map(f => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.18)',
              borderRadius: 20, padding: '4px 10px',
              fontSize: 10, color: 'var(--teal)', fontWeight: 600,
            }}>
              {f.icon} {f.label}
            </div>
          ))}
        </div>

        {/* Install button */}
        <button
          onClick={handleInstall}
          disabled={installing}
          style={{
            width: '100%', padding: '13px',
            background: installing ? 'rgba(20,184,166,0.1)' : 'linear-gradient(135deg, #14b8a6, #2563eb)',
            border: 'none', borderRadius: 12, cursor: installing ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: '#fff',
            boxShadow: '0 4px 20px rgba(20,184,166,0.3)',
            transition: 'all 0.2s',
          }}
        >
          {installing
            ? <><div className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Installing…</>
            : <><Download size={16} /> Install for Free</>
          }
        </button>

        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 10, color: 'var(--text-3)' }}>
          No app store needed · 2MB · Zero permissions required
        </div>
      </div>
    </div>
  );
}
