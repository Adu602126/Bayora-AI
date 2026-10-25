'use client';
import { Phone, User } from 'lucide-react';
import { haptic } from '@/hooks/useHaptics';
import { useStore } from '@/store/useStore';

const NUMBERS = [
  { label: '🚨 Emergency', number: '112', sub: 'National · Free · No SIM needed', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  { label: '👮 Police',    number: '100', sub: 'Madhya Pradesh Police',          color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
  { label: '🚑 Ambulance', number: '108', sub: 'Free ambulance service',          color: '#22c55e', bg: 'rgba(34,197,94,0.1)'   },
  { label: '🤝 Women Help',number: '1091',sub: 'Women helpline 24/7',             color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  { label: '👧 Child Help', number: '1098',sub: 'Child helpline',                  color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  { label: '🔥 Fire',       number: '101', sub: 'Fire brigade',                   color: '#f97316', bg: 'rgba(249,115,22,0.1)'  },
];

export default function EmergencyDial() {
  const { profile } = useStore();
  const personalContacts = profile?.contacts || [];
  const call = (number: string) => {
    haptic('heavy');
    window.location.href = `tel:${number}`;
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div className="section-h">Emergency Contacts</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        
        {/* ── PERSONAL SAVED CONTACTS ── */}
        {personalContacts.map(c => (
          <button
            key={c.id}
            onClick={() => call(c.phone)}
            style={{
              background: 'rgba(20,184,166,0.08)',
              border: `1px solid rgba(20,184,166,0.3)`,
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: 'pointer', width: '100%', textAlign: 'left',
              transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(4px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: `rgba(20,184,166,0.15)`,
              border: `1px solid rgba(20,184,166,0.4)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--teal)',
            }}>
              <User size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                {c.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 600 }}>
                {c.relation} (Saved Contact)
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--teal)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 2px 10px rgba(20,184,166,0.4)`,
              }}>
                <Phone size={13} color="#fff" />
              </div>
            </div>
          </button>
        ))}

        {/* ── AUTHORITIES ── */}
        {NUMBERS.map(n => (
          <button
            key={n.number}
            onClick={() => call(n.number)}
            style={{
              background: n.bg,
              border: `1px solid ${n.color}33`,
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: 'pointer', width: '100%', textAlign: 'left',
              transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(4px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: `${n.color}22`,
              border: `1px solid ${n.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>{n.label.split(' ')[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                {n.label.split(' ').slice(1).join(' ')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{n.sub}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 900, color: n.color }}>{n.number}</span>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: n.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 2px 10px ${n.color}44`,
              }}>
                <Phone size={13} color="#fff" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
