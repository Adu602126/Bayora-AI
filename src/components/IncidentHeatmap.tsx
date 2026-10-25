'use client';
import { useMemo } from 'react';

// Incident data (mock — would be real community reports in production)
const INCIDENTS = [
  { id: 1, lat: 22.7196, lng: 75.8577, type: 'harassment',    severity: 3, time: '11pm', area: 'Vijay Nagar' },
  { id: 2, lat: 22.7180, lng: 75.8530, type: 'poor-lighting', severity: 2, time: '10pm', area: 'Bhanwarkua' },
  { id: 3, lat: 22.7160, lng: 75.8490, type: 'stalking',      severity: 4, time: '9pm',  area: 'Old Palasia' },
  { id: 4, lat: 22.7250, lng: 75.8650, type: 'safe-zone',     severity: 0, time: 'All',  area: 'Scheme 54' },
  { id: 5, lat: 22.7120, lng: 75.8510, type: 'suspicious',    severity: 3, time: '8pm',  area: 'Old Palasia' },
  { id: 6, lat: 22.7220, lng: 75.8600, type: 'safe-zone',     severity: 0, time: 'All',  area: 'Vijay Nagar' },
  { id: 7, lat: 22.7145, lng: 75.8475, type: 'harassment',    severity: 4, time: '11pm', area: 'Old Palasia' },
  { id: 8, lat: 22.7188, lng: 75.8542, type: 'poor-lighting', severity: 2, time: '9pm',  area: 'Bhanwarkua' },
];

const TYPE_INFO: Record<string, { color: string; emoji: string; label: string }> = {
  harassment:    { color: '#ef4444', emoji: '⚠️', label: 'Harassment' },
  stalking:      { color: '#f97316', emoji: '👁️', label: 'Stalking'   },
  suspicious:    { color: '#f59e0b', emoji: '❓', label: 'Suspicious' },
  'poor-lighting': { color: '#8b5cf6', emoji: '🔦', label: 'Dark Area' },
  'safe-zone':   { color: '#22c55e', emoji: '✅', label: 'Safe Zone'  },
};

// Compute a live area risk score from incidents + current time
function computeRiskScore(): { score: number; label: string; color: string; factors: string[] } {
  const hour = new Date().getHours();
  const isNight = hour >= 21 || hour < 6;
  const isEvening = hour >= 18 && hour < 21;

  const dangerCount = INCIDENTS.filter(i => i.severity >= 3).length;
  const darkCount   = INCIDENTS.filter(i => i.type === 'poor-lighting').length;
  const safeCount   = INCIDENTS.filter(i => i.type === 'safe-zone').length;

  let base = 100 - (dangerCount * 10) - (darkCount * 5) + (safeCount * 5);
  if (isNight)   base -= 20;
  if (isEvening) base -= 8;

  const score = Math.max(10, Math.min(100, base));
  const factors: string[] = [];
  if (isNight) factors.push('Late night hours (−20)');
  if (dangerCount > 0) factors.push(`${dangerCount} danger reports nearby`);
  if (darkCount > 0)   factors.push(`${darkCount} poorly lit zones`);
  if (safeCount > 0)   factors.push(`${safeCount} safe zones active ✅`);

  const label = score >= 70 ? 'Low Risk' : score >= 45 ? 'Moderate' : 'High Risk';
  const color = score >= 70 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444';

  return { score, label, color, factors };
}

// Scale lat/lng to SVG coordinate
function toSVG(lat: number, lng: number, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }, w: number, h: number) {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * w;
  const y = h - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * h;
  return { x, y };
}

export default function IncidentHeatmap() {
  const risk = useMemo(() => computeRiskScore(), []);
  const W = 320, H = 200;

  const bounds = {
    minLat: 22.7100, maxLat: 22.7280,
    minLng: 75.8460, maxLng: 75.8680,
  };

  const points = INCIDENTS.map(inc => ({ ...inc, ...toSVG(inc.lat, inc.lng, bounds, W, H) }));

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Live Risk Score Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(14,22,40,0.9), rgba(20,31,53,0.9))',
        border: `1px solid ${risk.color}44`,
        borderRadius: 16, padding: '14px 16px', marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: `0 0 20px ${risk.color}18`,
      }}>
        {/* Score ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle cx="30" cy="30" r="24" fill="none"
              stroke={risk.color} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - risk.score / 100)}`}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 900, color: risk.color }}>{risk.score}</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 800, marginBottom: 4 }}>
            Live Area Score: <span style={{ color: risk.color }}>{risk.label}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {risk.factors.map((f, i) => (
              <div key={i} style={{ fontSize: 10, color: 'var(--text-3)' }}>• {f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap SVG */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(8,13,24,0.95), rgba(14,22,40,0.98))',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        <div style={{ padding: '10px 14px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>📍 Incident Heatmap</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Vijay Nagar area</div>
        </div>

        <div style={{ position: 'relative', width: '100%' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
            {/* Background grid */}
            <rect width={W} height={H} fill="rgba(8,13,24,0.5)" />
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map(t => (
              <g key={t}>
                <line x1={0} y1={H * t} x2={W} y2={H * t} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                <line x1={W * t} y1={0} x2={W * t} y2={H} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              </g>
            ))}

            {/* Heatmap blobs */}
            {points.filter(p => p.severity > 0).map(p => (
              <ellipse key={p.id}
                cx={p.x} cy={p.y}
                rx={p.severity * 10} ry={p.severity * 8}
                fill={`${TYPE_INFO[p.type]?.color || '#888'}22`}
                style={{ filter: `blur(${p.severity * 2}px)` }}
              />
            ))}

            {/* Incident markers */}
            {points.map(p => {
              const info = TYPE_INFO[p.type] || { color: '#888', emoji: '•', label: p.type };
              return (
                <g key={p.id}>
                  {/* Outer ring */}
                  {p.severity > 0 && (
                    <circle cx={p.x} cy={p.y} r={8 + p.severity * 2}
                      fill="none" stroke={info.color} strokeWidth="1"
                      opacity="0.3"
                    />
                  )}
                  {/* Dot */}
                  <circle cx={p.x} cy={p.y} r={5}
                    fill={info.color}
                    opacity="0.9"
                  />
                  {/* Area label */}
                  <text x={p.x} y={p.y - 9} textAnchor="middle"
                    fill={info.color} fontSize="7" fontWeight="600"
                    opacity="0.8"
                  >
                    {p.area.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 10, padding: '8px 14px 12px', flexWrap: 'wrap' }}>
          {Object.entries(TYPE_INFO).map(([key, info]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-3)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: info.color, flexShrink: 0 }} />
              {info.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
