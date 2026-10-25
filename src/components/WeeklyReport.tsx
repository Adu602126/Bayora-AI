'use client';
import { X, Star } from 'lucide-react';

interface WeeklyReportProps {
  onClose: () => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const RISK_DATA = [62, 45, 78, 34, 88, 55, 70]; // mock daily safety scores

export default function WeeklyReport({ onClose }: WeeklyReportProps) {
  const avg = Math.round(RISK_DATA.reduce((a, b) => a + b, 0) / RISK_DATA.length);
  const best = Math.max(...RISK_DATA);
  const bestDay = DAYS[RISK_DATA.indexOf(best)];

  const stats = [
    { icon: '🗺️', label: 'Journeys', value: '14', sub: 'this week' },
    { icon: '✅', label: 'Safe Arrivals', value: '14/14', sub: '100%' },
    { icon: '🚨', label: 'SOS Used', value: '0', sub: 'times' },
    { icon: '📍', label: 'Reports Filed', value: '3', sub: 'community' },
  ];

  const achievements = [
    { emoji: '🛡️', label: 'Safety Streak', desc: '7 days safe', earned: true },
    { emoji: '🗺️', label: 'Route Explorer', desc: '10+ journeys', earned: true },
    { emoji: '👥', label: 'Community Hero', desc: '3 reports filed', earned: true },
    { emoji: '⭐', label: 'Perfect Week', desc: 'Zero incidents', earned: avg >= 70 },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-end',
      backdropFilter: 'blur(6px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fade-in-up" style={{
        width: '100%', maxWidth: 430, margin: '0 auto',
        background: 'var(--bg-2)',
        border: '1px solid var(--border-2)',
        borderRadius: '24px 24px 0 0',
        padding: '20px 20px 50px',
        maxHeight: '88vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800 }}>
            📊 Weekly Safety Report
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 20 }}>
          Week of May 5–11, 2026
        </div>

        {/* Overall score ring */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(20,184,166,0.08), rgba(59,130,246,0.06))',
          border: '1px solid rgba(20,184,166,0.2)',
          borderRadius: 16, padding: '20px 16px',
          display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20,
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none"
                stroke={avg >= 70 ? '#22c55e' : avg >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - avg / 100)}`}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 900, color: avg >= 70 ? '#22c55e' : avg >= 50 ? '#f59e0b' : '#ef4444' }}>
                {avg}
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
              {avg >= 70 ? 'Excellent Week! 🎉' : avg >= 50 ? 'Good Week 👍' : 'Stay Safe 💙'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
              Avg safety score: <strong>{avg}/100</strong><br />
              Best day: <strong>{bestDay} ({best}/100)</strong>
            </div>
          </div>
        </div>

        {/* Daily bar chart */}
        <div className="section-h">Daily Safety Scores</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80, marginBottom: 8 }}>
          {RISK_DATA.map((val, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: '100%',
                height: `${(val / 100) * 64}px`,
                background: val >= 70
                  ? 'linear-gradient(180deg, #22c55e, #16a34a)'
                  : val >= 50
                  ? 'linear-gradient(180deg, #f59e0b, #d97706)'
                  : 'linear-gradient(180deg, #ef4444, #dc2626)',
                borderRadius: '4px 4px 2px 2px',
                transition: 'height 0.6s ease',
                boxShadow: val >= 70 ? '0 0 8px rgba(34,197,94,0.3)' : 'none',
              }} />
              <div style={{ fontSize: 9, color: 'var(--text-3)' }}>{DAYS[i]}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[['🟢', '70+', 'Safe'], ['🟡', '50–69', 'Moderate'], ['🔴', '<50', 'Risk']].map(([e, r, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-3)' }}>
              <span>{e}</span>{r} {l}
            </div>
          ))}
        </div>

        {/* Stats grid */}
        <div className="section-h">This Week</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-3)', border: '1px solid var(--border-2)',
              borderRadius: 12, padding: '14px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: 'var(--teal)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div className="section-h">Achievements</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {achievements.map(a => (
            <div key={a.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: a.earned ? 'rgba(20,184,166,0.06)' : 'var(--bg-3)',
              border: `1px solid ${a.earned ? 'rgba(20,184,166,0.2)' : 'var(--border-2)'}`,
              borderRadius: 12, padding: '12px 14px',
              opacity: a.earned ? 1 : 0.4,
            }}>
              <div style={{ fontSize: 24 }}>{a.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{a.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.desc}</div>
              </div>
              {a.earned && <Star size={14} color="var(--amber)" fill="var(--amber)" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
