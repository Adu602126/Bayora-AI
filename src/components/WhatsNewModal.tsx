'use client';
import { X } from 'lucide-react';

const UPDATES = [
  { icon: '🔒', title: 'Smart Evidence Vault', desc: 'Auto-captures audio/video and uses AI to generate ready-to-submit police FIRs', tag: 'Legal' },
  { icon: '🧠', title: 'AI Emotion Sync', desc: 'Monitors heart rate and voice tone for subtle anxiety patterns and burnout', tag: 'AI' },
  { icon: '👁️', title: 'AR Vision Overlay', desc: 'Scan your surroundings for safe havens and danger zones in Augmented Reality', tag: 'AR' },
  { icon: '🔊', title: 'Acoustic AI SOS', desc: 'Auto-detects screams and glass breaking to trigger SOS', tag: 'AI' },
  { icon: '🛡️', title: "Dead Man's Switch", desc: 'Hold button while walking. Auto SOS if dropped.', tag: 'Safety' },
  { icon: '🧮', title: 'Decoy Calculator',    desc: 'Hide SafePath with a fake calculator screen',    tag: 'Safety' },
  { icon: '📞', title: 'Emergency Quick-Dial', desc: 'One-tap 112, 100, 108 — no dialing needed',      tag: 'Safety' },
  { icon: '🎙️', title: 'Audio Recording',      desc: 'Auto-records during SOS, deters attackers',      tag: 'SOS'    },
  { icon: '📊', title: '24-Hour Risk Chart',   desc: 'See area risk score hour by hour',               tag: 'Data'   },
  { icon: '🔥', title: 'Safety Streak',        desc: 'Track your safe days and earn achievements',     tag: 'Profile'},
  { icon: '🤖', title: 'Rio Memory + Voice',   desc: 'Rio now remembers context and speaks replies',   tag: 'AI'     },
  { icon: '📱', title: 'QR Guardian Share',    desc: 'Share live tracking via QR code',               tag: 'Guardian'},
  { icon: '🌙', title: 'Dark / Light Mode',    desc: 'Toggle in the top bar — saved to your profile', tag: 'UI'     },
];

const TAG_COLORS: Record<string, string> = {
  Safety:  '#ef4444',
  SOS:     '#f97316',
  Data:    '#3b82f6',
  Profile: '#f59e0b',
  AI:      '#8b5cf6',
  Guardian:'#14b8a6',
  UI:      '#22c55e',
};

export default function WhatsNewModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fade-in-up" style={{
        width: '100%', maxWidth: 430,
        background: 'linear-gradient(180deg, rgba(14,22,40,0.99) 0%, rgba(8,13,24,0.99) 100%)',
        borderRadius: '24px 24px 0 0',
        border: '1px solid rgba(20,184,166,0.2)',
        borderBottom: 'none',
        overflow: 'hidden',
        maxHeight: '90vh',
      }}>
        {/* Top glow line */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #14b8a6, #8b5cf6, transparent)' }} />

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>🚀</span>
              <span style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 900 }}>What&apos;s New</span>
              <span style={{
                fontSize: 10, background: 'rgba(20,184,166,0.15)', color: 'var(--teal)',
                padding: '2px 8px', borderRadius: 20, fontWeight: 700,
              }}>v2.0</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Latest features in SafePath Indore</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Updates list */}
        <div style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 160px)', padding: '0 16px' }}>
          {UPDATES.map((u, i) => (
            <div key={i} className="fade-in" style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '12px 0',
              borderBottom: i < UPDATES.length - 1 ? '1px solid var(--border)' : 'none',
              animationDelay: `${i * 50}ms`,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>{u.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{u.title}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    color: TAG_COLORS[u.tag] || '#888',
                    background: `${TAG_COLORS[u.tag] || '#888'}18`,
                    padding: '2px 6px', borderRadius: 10,
                  }}>{u.tag}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>{u.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding: '14px 16px 28px' }}>
          <button onClick={onClose} className="btn-primary" style={{ fontSize: 14 }}>
            🎉 Let&apos;s Go!
          </button>
        </div>
      </div>
    </div>
  );
}
