'use client';
import { Plus, Share2, Clock, MapPin, Phone, Shield, ChevronRight } from 'lucide-react';
import TopBar from '@/components/TopBar';
import AppShell from '@/components/AppShell';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/translations';

const ALERT_HISTORY = [
  { time: 'Today 9:41 PM',      msg: 'Check-in confirmed — Vijay Nagar',    color: 'var(--green)',  icon: '✅' },
  { time: 'Today 9:20 PM',      msg: 'Journey started — LIG to Vijay Nagar', color: 'var(--teal)',  icon: '🗺️' },
  { time: 'Yesterday 11:02 PM', msg: 'Arrived safely at destination',        color: 'var(--green)',  icon: '🏠' },
  { time: 'Yesterday 10:45 PM', msg: 'Deviation detected — auto alert sent', color: 'var(--amber)', icon: '⚠️' },
  { time: 'Yesterday 10:30 PM', msg: 'Journey started — Palasia to LIG',     color: 'var(--teal)',  icon: '🗺️' },
];

export default function GuardianPage() {
  const { profile, journey, language } = useStore();
  const t = useTranslation(language);

  const contacts = profile.contacts.length > 0
    ? profile.contacts
    : [
        { id: '1', name: 'Mom',  phone: '+91 98765 43210', relation: 'Mother' },
        { id: '2', name: 'Riya', phone: '+91 91234 56789', relation: 'Friend' },
      ];

  return (
    <AppShell>
      <TopBar showLogo />
      <div style={{ padding: '16px 16px 100px', overflowY: 'auto' }}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Shield size={18} style={{ color: 'var(--teal)' }} />
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800 }}>{t('guardianDashboard')}</div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{t('guardianSubtitle')}</div>
        </div>

        {/* ── LIVE LOCATION CARD ───────────────────────────────────────────── */}
        <div className="hero-card fade-in-scale" style={{ marginBottom: 16 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                {profile.name || 'User'}&apos;s {t('liveLocation')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Vijay Nagar, Indore</div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: journey.active ? 'rgba(34,197,94,0.12)' : 'rgba(100,116,139,0.12)',
              border: `1px solid ${journey.active ? 'rgba(34,197,94,0.3)' : 'rgba(100,116,139,0.25)'}`,
              borderRadius: 8, padding: '5px 10px',
            }}>
              <div className={journey.active ? 'live-dot' : ''} style={!journey.active ? {
                width: 7, height: 7, background: 'var(--text-3)', borderRadius: '50%',
              } : {}} />
              <span style={{ fontSize: 11, fontWeight: 700, color: journey.active ? 'var(--green)' : 'var(--text-3)' }}>
                {journey.active ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Animated map area */}
          <div style={{
            height: 160, borderRadius: 14, marginBottom: 14,
            background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-2) 100%)',
            border: '1px solid var(--border-2)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Grid */}
            <div className="map-grid" />

            {/* Fake road lines */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 360 160">
              <path d="M0,80 Q90,60 180,80 T360,80" fill="none" stroke="rgba(20,184,166,0.12)" strokeWidth="8" strokeLinecap="round" />
              <path d="M0,80 Q90,60 180,80 T360,80" fill="none" stroke="rgba(20,184,166,0.06)" strokeWidth="16" strokeLinecap="round" />
              <path d="M60,0 Q80,80 60,160" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
              <path d="M280,0 Q300,80 280,160" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
            </svg>

            {/* Safe zone circles */}
            <div style={{ position: 'absolute', top: '30%', left: '55%', width: 50, height: 50, borderRadius: '50%', border: '1.5px dashed rgba(20,184,166,0.2)', background: 'rgba(20,184,166,0.04)' }} />

            {/* Animated trail dots */}
            {journey.active && [
              { left: '32%', top: '48%', delay: '0s',    size: 4, opacity: 0.25 },
              { left: '38%', top: '50%', delay: '0.2s',  size: 5, opacity: 0.40 },
              { left: '44%', top: '49%', delay: '0.4s',  size: 5, opacity: 0.55 },
              { left: '50%', top: '50%', delay: '0.6s',  size: 6, opacity: 0.70 },
            ].map((dot, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: dot.left, top: dot.top,
                width: dot.size, height: dot.size,
                background: 'var(--teal)',
                borderRadius: '50%',
                opacity: dot.opacity,
                transform: 'translate(-50%,-50%)',
              }} />
            ))}

            {/* Live pulse dot */}
            {journey.active && (
              <div style={{ position: 'absolute', top: '50%', left: '57%', transform: 'translate(-50%,-50%)' }}>
                {/* outer ring */}
                <div className="teal-pulse" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 28, height: 28, borderRadius: '50%', border: '1.5px solid rgba(20,184,166,0.35)', background: 'rgba(20,184,166,0.06)' }} />
                {/* inner dot */}
                <div style={{ width: 14, height: 14, background: 'var(--teal)', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 10px rgba(20,184,166,0.6)' }} />
              </div>
            )}

            {/* Status chip */}
            <div style={{
              position: 'absolute', bottom: 10, left: 10,
              background: 'rgba(8,13,24,0.88)', backdropFilter: 'blur(8px)',
              padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border-2)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                <MapPin size={9} style={{ color: 'var(--teal)', marginRight: 3, verticalAlign: 'middle' }} />
                {journey.active ? 'Vijay Nagar · Updated 12s ago' : 'Last seen: Vijay Nagar, 9:41 PM'}
              </div>
            </div>

            {/* Speed chip */}
            {journey.active && (
              <div style={{
                position: 'absolute', bottom: 10, right: 10,
                background: 'rgba(8,13,24,0.88)', backdropFilter: 'blur(8px)',
                padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border-2)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>⚡ 24 km/h</div>
              </div>
            )}
          </div>

          {/* Route stats */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Route',  val: journey.active ? 'Via Vijay Nagar' : '—', color: undefined, icon: '🗺️' },
              { label: 'ETA',    val: journey.active ? '14 min' : '—',           color: undefined, icon: '⏱' },
              { label: 'Safety', val: journey.active ? '87/100' : '—',           color: 'var(--green)', icon: '🛡' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 14, marginBottom: 3 }}>{s.icon}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.color ?? 'var(--text)' }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Share link */}
          <button
            className="btn-secondary"
            onClick={() => alert('Shareable link: safepath.app/track/xyz123\n\nConnect Firebase for real-time tracking links.')}
          >
            <Share2 size={15} /> {t('shareLink')}
          </button>
        </div>

        {/* ── GUARDIANS LIST ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="section-h" style={{ margin: 0 }}>Guardians ({contacts.length})</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>All notified on SOS</div>
        </div>

        {contacts.map((c, i) => (
          <div key={c.id} className="guardian-card fade-in-up" style={{ marginBottom: 10, animationDelay: `${i * 60}ms` }}>
            {/* Avatar */}
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(20,184,166,0.2), rgba(59,130,246,0.1))',
              border: '1.5px solid rgba(20,184,166,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 16, color: 'var(--teal)', flexShrink: 0,
            }}>
              {c.name[0]}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={9} />
                {c.phone} · {c.relation}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{
                fontSize: 10, background: 'rgba(34,197,94,0.12)', color: '#4ade80',
                padding: '3px 8px', borderRadius: 6, fontWeight: 700, border: '1px solid rgba(34,197,94,0.2)',
              }}>Active</span>
              <ChevronRight size={13} style={{ color: 'var(--text-3)' }} />
            </div>
          </div>
        ))}

        <button
          className="btn-secondary"
          style={{ marginBottom: 24 }}
          onClick={() => alert('Add guardian — they receive an invite link.\nConnect Firebase Auth to enable.')}
        >
          <Plus size={16} /> {t('addGuardian')}
        </button>

        <div className="divider-glow" />

        {/* ── ALERT TIMELINE ───────────────────────────────────────────────── */}
        <div className="section-h" style={{ marginBottom: 16 }}>{t('alertHistory')}</div>
        <div style={{ position: 'relative' }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: 12, top: 6, bottom: 6, width: 1, background: 'var(--border-2)' }} />

          {ALERT_HISTORY.map((a, i) => (
            <div key={i} className="fade-in-up" style={{
              display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 18,
              paddingLeft: 2, animationDelay: `${i * 80}ms`,
            }}>
              {/* Timeline dot */}
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: `${a.color}18`, border: `1.5px solid ${a.color}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, zIndex: 1,
              }}>
                {a.icon}
              </div>
              <div style={{ flex: 1, paddingTop: 1 }}>
                <div style={{ fontSize: 13, lineHeight: 1.45, marginBottom: 3 }}>{a.msg}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-3)' }}>
                  <Clock size={9} /> {a.time}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </AppShell>
  );
}
