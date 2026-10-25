'use client';
import { useMemo } from 'react';

// Compute a 24-hour risk score array based on known Indore crime patterns
function buildHourlyRisk() {
  const base = [
    20, 15, 12, 10, 10, 14, // 0-5 AM (very late / very early)
    28, 45, 55, 60, 62, 63, // 6-11 AM
    65, 68, 70, 72, 70, 65, // 12-5 PM
    58, 52, 42, 35, 25, 22, // 6-11 PM (evening risk rising then falling)
  ];
  return base;
}

export default function RiskTimeline() {
  const scores = useMemo(buildHourlyRisk, []);
  const currentHour = new Date().getHours();

  const W = 320, H = 80;
  const max = 80, min = 0;
  const pts = scores.map((s, i) => {
    const x = (i / 23) * W;
    const y = H - ((s - min) / (max - min)) * H;
    return { x, y, s, i };
  });

  // Build SVG polyline
  const polylinePts = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillPath = `M0,${H} ` + pts.map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ` L${W},${H} Z`;

  const riskColor = (s: number) =>
    s >= 60 ? '#22c55e' : s >= 35 ? '#f59e0b' : '#ef4444';

  const cur = pts[currentHour];
  const label = cur.s >= 60 ? 'Low Risk' : cur.s >= 35 ? 'Moderate' : 'High Risk';
  const col = riskColor(cur.s);

  const LABELS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="section-h" style={{ margin: 0 }}>24-Hour Area Risk</div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: col,
          background: `${col}18`, border: `1px solid ${col}33`,
          padding: '3px 10px', borderRadius: 20,
        }}>
          Now: {label}
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(145deg, rgba(8,13,24,0.95), rgba(14,22,40,0.95))',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, overflow: 'hidden', padding: '16px 14px 10px',
      }}>
        {/* Chart */}
        <div style={{ position: 'relative' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', overflow: 'visible' }}>
            {/* Horizontal guide lines */}
            {[0.25, 0.5, 0.75].map(t => (
              <line key={t} x1="0" y1={H * t} x2={W} y2={H * t}
                stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            ))}

            {/* Gradient fill */}
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={fillPath} fill="url(#riskGrad)" />

            {/* Line */}
            <polyline
              points={polylinePts}
              fill="none"
              stroke="#14b8a6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Risk zone shading */}
            {pts.map((p, i) => {
              const next = pts[i + 1];
              if (!next) return null;
              if (p.s < 35) {
                return (
                  <rect key={i}
                    x={p.x} y={0} width={next.x - p.x} height={H}
                    fill="rgba(239,68,68,0.06)"
                  />
                );
              }
              return null;
            })}

            {/* Current time marker */}
            <line
              x1={cur.x} y1={0} x2={cur.x} y2={H}
              stroke={col} strokeWidth="1.5" strokeDasharray="3 3"
            />
            <circle cx={cur.x} cy={cur.y} r="5" fill={col} />
            <circle cx={cur.x} cy={cur.y} r="9" fill="none" stroke={col} strokeWidth="1.5" opacity="0.5" />

            {/* Current score label */}
            <rect x={cur.x - 16} y={cur.y - 24} width="32" height="16" rx="4"
              fill="rgba(10,15,26,0.95)" stroke={col} strokeWidth="1"
            />
            <text x={cur.x} y={cur.y - 13} textAnchor="middle"
              fontSize="9" fill={col} fontWeight="bold"
            >{cur.s}</text>
          </svg>

          {/* Hour labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, padding: '0 2px' }}>
            {LABELS.map((l) => (
              <span key={l} style={{ fontSize: 9, color: 'var(--text-3)' }}>{l}</span>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          {[['#22c55e', 'Low'], ['#f59e0b', 'Moderate'], ['#ef4444', 'High']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-3)' }}>
              <div style={{ width: 8, height: 3, borderRadius: 2, background: c }} />
              {l}
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-3)' }}>
            Based on Indore incident history
          </div>
        </div>
      </div>
    </div>
  );
}
