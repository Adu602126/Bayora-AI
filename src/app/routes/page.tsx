'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation2, ChevronDown, ChevronUp, Locate, RefreshCw, Info } from 'lucide-react';
import TopBar from '@/components/TopBar';
import AppShell from '@/components/AppShell';
import IncidentHeatmap from '@/components/IncidentHeatmap';
import SafeMap from '@/components/SafeMap';
import { useStore, mockRoutes } from '@/store/useStore';
import { useTranslation } from '@/lib/translations';
import { scoreToColor, getDynamicRouteScores } from '@/lib/riskScoring';
import { getDynamicRoutes, getPOIsNearRoute, DynamicRoute, POI } from '@/lib/routing';
import { toast } from '@/components/Toast';

// ── Indore coordinate bounds for SVG mapping ──────────────────────────────
const MAP_BOUNDS = { minLng: 75.82, maxLng: 75.90, minLat: 22.69, maxLat: 22.76 };
const W = 360, H = 200; // SVG canvas size

function lngToX(lng: number) {
  return ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * W;
}
function latToY(lat: number) {
  return H - ((lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * H;
}

// Full route polylines (Indore city geometry, [lng, lat])
const ROUTE_PATHS: Record<number, [number, number][]> = {
  1: [
    [75.8577, 22.7196], [75.8590, 22.7210], [75.8600, 22.7220], [75.8615, 22.7230],
    [75.8625, 22.7238], [75.8640, 22.7244], [75.8650, 22.7250], [75.8658, 22.7255],
  ],
  2: [
    [75.8577, 22.7196], [75.8565, 22.7188], [75.8550, 22.7180], [75.8538, 22.7172],
    [75.8530, 22.7165], [75.8530, 22.7155], [75.8540, 22.7148], [75.8560, 22.7140],
  ],
  3: [
    [75.8577, 22.7196], [75.8555, 22.7185], [75.8530, 22.7175], [75.8510, 22.7165],
    [75.8495, 22.7157], [75.8490, 22.7148], [75.8498, 22.7135], [75.8510, 22.7120],
  ],
};

// Safe zone circles on map [lng, lat, radius-px]
const SAFE_ZONES: [number, number, number][] = [
  [75.8600, 22.7230, 14],
  [75.8530, 22.7165, 10],
  [75.8560, 22.7196, 12],
];

// Landmark dots
const LANDMARKS: { pos: [number, number]; label: string }[] = [
  { pos: [75.8577, 22.7196], label: 'A' },
  { pos: [75.8650, 22.7250], label: 'B' },
];

// FIX: constant moved outside component to avoid recreation on every render
const ROUTE_COLORS: Record<number, string> = {
  1: '#22c55e', 2: '#f59e0b', 3: '#ef4444',
};

// Convert coords to SVG path string
function toSvgPath(coords: [number, number][]) {
  return coords
    .map(([lng, lat], i) => `${i === 0 ? 'M' : 'L'}${lngToX(lng).toFixed(1)},${latToY(lat).toFixed(1)}`)
    .join(' ');
}

// Risk score animated arc (SVG circle)
function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = scoreToColor(score);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        strokeDashoffset={`${circ - fill}`}
        style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
      />
    </svg>
  );
}

// Factor icon map
const FACTOR_ICONS: Record<string, string> = {
  'CCTV Coverage': '📷',
  'Street Lighting': '💡',
  'Police Patrolling': '👮',
  'Crowd Density': '👥',
  'Emergency Services': '🚑',
  'Historical Incidents': '📊',
};

const FACTOR_GOOD: Record<string, string[]> = {
  'CCTV Coverage': ['High', 'Very High'],
  'Street Lighting': ['Excellent', 'Good'],
  'Police Patrolling': ['Active', 'Frequent'],
  'Crowd Density': ['Moderate', 'High'],
  'Emergency Services': ['< 2 km'],
  'Historical Incidents': ['Very Low', 'Low'],
};

function factorSentiment(label: string, value: string): 'good' | 'bad' | 'neutral' {
  const goodVals = FACTOR_GOOD[label] || [];
  if (goodVals.some(v => value.includes(v))) return 'good';
  // FIX: added parentheses to clarify && vs || precedence
  if (value === 'None' || value === 'Poor' || value === 'Very Low' || (value.includes('High') && label === 'Historical Incidents')) return 'bad';
  return 'neutral';
}

export default function RoutesPage() {
  const router = useRouter();
  const { language, origin, destination, setOrigin, setDestination, selectedRouteId, setSelectedRoute, startJourney, profile } = useStore();
  const t = useTranslation(language);

  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [hoveredRouteId, setHoveredRouteId] = useState<number | null>(null);
  const [dynamicScores, setDynamicScores] = useState<{ id: number; score: number; level: 'safe' | 'moderate' | 'risk' }[]>([]);
  const [scoreVisible, setScoreVisible] = useState(false);
  const [searching, setSearching] = useState(false);
  const [pulseOrigin, setPulseOrigin] = useState(true);
  const [now, setNow] = useState('');
  const [liveRoutes, setLiveRoutes] = useState<DynamicRoute[]>([]);
  const [dynamicPOIs, setDynamicPOIs] = useState<POI[]>([]);

  // Compute dynamic scores on mount / every minute
  useEffect(() => {
    const compute = () => {
      const hour = new Date().getHours();
      const scores = getDynamicRouteScores(hour, profile.vulnerabilityType || 'Solo Woman');
      setDynamicScores(scores);
      setNow(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    compute();
    const interval = setInterval(compute, 60_000);
    return () => clearInterval(interval);
  }, [profile.vulnerabilityType]);

  // Animate in scores after mount
  useEffect(() => {
    const t = setTimeout(() => setScoreVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Pulse origin dot
  useEffect(() => {
    const t = setInterval(() => setPulseOrigin(p => !p), 1200);
    return () => clearInterval(t);
  }, []);

  const handleSearch = async () => {
    setSearching(true);
    setScoreVisible(false);

    // Fetch real paths from OSRM
    const dynamicRoutesData = await getDynamicRoutes(origin, destination);
    
    if (dynamicRoutesData && dynamicRoutesData.length > 0) {
      setLiveRoutes(dynamicRoutesData);
      setSelectedRoute(dynamicRoutesData[0].id);
      setExpandedId(dynamicRoutesData[0].id);
      
      // Fetch POIs near the main route
      const pois = await getPOIsNearRoute(dynamicRoutesData[0].coordinates);
      setDynamicPOIs(pois);
    } else {
      toast.error('Routing Failed', 'Could not find a path. Falling back to default.');
    }

    const hour = new Date().getHours();
    const scores = getDynamicRouteScores(hour, profile.vulnerabilityType || 'Solo Woman');
    setDynamicScores(scores);
    setSearching(false);
    setScoreVisible(true);
  };

  const handleStartRoute = (routeId: number) => {
    startJourney(routeId);
    router.push('/journey');
  };

  // Merge live scores into liveRoutes (or fallback to mockRoutes if empty)
  const displayRoutes = liveRoutes.length > 0 
    ? liveRoutes.map((r, i) => {
        const live = dynamicScores.find(s => s.id === r.id) || dynamicScores[0];
        const mockMatch = mockRoutes[i] || mockRoutes[0];
        return { ...r, safetyScore: live.score, level: live.level, factors: mockMatch.factors, coordinates: r.coordinates };
      })
    : mockRoutes.map(r => {
        const live = dynamicScores.find(s => s.id === r.id);
        return { ...(live ? { ...r, safetyScore: live.score, level: live.level } : r), coordinates: ROUTE_PATHS[r.id] };
      });

  // ROUTE_COLORS moved to module level (see below)

  return (
    <AppShell>
      <TopBar showLogo />
      <div style={{ padding: '16px 16px 100px' }}>

        {/* Header */}
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, marginBottom: 2 }}>
          {t('planRoute')}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 18 }}>
          {t('routeSubtitle')}
        </div>

        {/* Origin / Destination inputs */}
        <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 14, padding: 12, marginBottom: 14 }}>
          {/* Origin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 10, height: 10, background: 'var(--teal)', borderRadius: '50%' }} />
              {pulseOrigin && (
                <div style={{
                  position: 'absolute', inset: -3, borderRadius: '50%',
                  border: '1.5px solid var(--teal)', opacity: 0.4,
                  animation: 'ping 1.2s infinite',
                }} />
              )}
            </div>
            <input
              className="inp" style={{ flex: 1, background: 'transparent', border: 'none', padding: '6px 0', fontSize: 14 }}
              value={origin} onChange={e => setOrigin(e.target.value)}
              placeholder="From — Current location"
            />
            <button
              onClick={() => navigator.geolocation?.getCurrentPosition(
                pos => setOrigin(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
                () => { }
              )}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', padding: 0 }}
              title="Use current location"
            >
              <Locate size={15} />
            </button>
          </div>

          {/* Connector line */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, paddingLeft: 1 }}>
            <div style={{ width: 8, display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 1, height: 16, background: 'var(--border-2)' }} />
            </div>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Destination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, background: 'var(--amber)', borderRadius: 2, flexShrink: 0 }} />
            <input
              className="inp" style={{ flex: 1, background: 'transparent', border: 'none', padding: '6px 0', fontSize: 14 }}
              value={destination} onChange={e => setDestination(e.target.value)}
              placeholder="To — Destination"
            />
          </div>
        </div>

        {/* Search button */}
        <button className="btn-primary" style={{ marginBottom: 16, gap: 8 }} onClick={handleSearch} disabled={searching}>
          {searching ? (
            <>
              <RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
              Analysing routes...
            </>
          ) : (
            <>
              <Navigation2 size={16} />
              {t('findRoutes')}
            </>
          )}
        </button>

        {/* ── LIVE MAPLIBRE MAP WITH REAL-TIME LOCATION ───────────────────────────────────── */}
        <SafeMap 
          selectedRouteCoords={displayRoutes.find(r => r.id === selectedRouteId)?.coordinates} 
          dynamicPOIs={dynamicPOIs}
        />

        {/* ── INCIDENT HEATMAP ──────────────────────────────────────── */}
        <IncidentHeatmap />

        {/* ── ROUTE CARDS ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="section-h" style={{ margin: 0 }}>{t('routeOptions')} — {now}</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
            Profile: {profile.vulnerabilityType || 'Solo Woman'}
          </div>
        </div>

        {displayRoutes.map((route) => {
          const expanded = expandedId === route.id;
          const isSelected = selectedRouteId === route.id;
          const borderColor = isSelected ? scoreToColor(route.safetyScore) : 'var(--border)';

          return (
            <div
              key={route.id}
              className="route-card"
              style={{ marginBottom: 12, borderColor, transition: 'border-color 0.3s' }}
              onMouseEnter={() => setHoveredRouteId(route.id)}
              onMouseLeave={() => setHoveredRouteId(null)}
              onClick={() => {
                setSelectedRoute(route.id);
                setExpandedId(expanded ? null : route.id);
              }}
            >
              {/* Card top */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  {route.id === 1 && (
                    <span style={{
                      fontSize: 9, background: 'rgba(20,184,166,0.18)', color: 'var(--teal)',
                      padding: '2px 7px', borderRadius: 4, fontWeight: 800,
                      display: 'inline-block', marginBottom: 5, letterSpacing: '0.5px',
                    }}>
                      ✓ {t('recommended')}
                    </span>
                  )}
                  {route.level === 'risk' && (
                    <span style={{
                      fontSize: 9, background: 'rgba(239,68,68,0.15)', color: 'var(--red)',
                      padding: '2px 7px', borderRadius: 4, fontWeight: 800,
                      display: 'inline-block', marginBottom: 5, letterSpacing: '0.5px',
                    }}>
                      ⚠ AVOID
                    </span>
                  )}
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{route.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{route.distance} · {route.duration}</div>
                </div>

                {/* Score ring */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <ScoreRing score={scoreVisible ? route.safetyScore : 0} size={56} />
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%,-50%)',
                      fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 900,
                      color: scoreToColor(route.safetyScore),
                      transition: 'color 0.4s',
                    }}>
                      {route.safetyScore}
                    </div>
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 1 }}>{t('safetyScore')}</div>
                </div>
              </div>

              {/* Score bar */}
              <div style={{ height: 5, background: 'var(--bg-4)', borderRadius: 3, margin: '10px 0 10px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: scoreVisible ? `${route.safetyScore}%` : '0%',
                  background: `linear-gradient(90deg, ${scoreToColor(route.safetyScore)}, ${scoreToColor(route.safetyScore)}aa)`,
                  borderRadius: 3,
                  transition: 'width 1s ease',
                }} />
              </div>

              {/* Factor pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                {route.factors.slice(0, 3).map(f => (
                  <span key={f.label} style={{
                    fontSize: 10, color: 'var(--text-2)',
                    background: 'var(--bg-4)', padding: '2px 7px', borderRadius: 5,
                  }}>
                    {FACTOR_ICONS[f.label] || '•'} {f.value}
                  </span>
                ))}
                <span style={{ marginLeft: 'auto', color: 'var(--text-3)' }}>
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </div>

              {/* Expanded breakdown */}
              {expanded && (
                <div
                  style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="section-h" style={{ marginBottom: 10 }}>{t('riskBreakdown')}</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
                    {route.factors.map(f => {
                      const sentiment = factorSentiment(f.label, f.value);
                      const bg = sentiment === 'good' ? 'rgba(34,197,94,0.08)' : sentiment === 'bad' ? 'rgba(239,68,68,0.08)' : 'var(--bg-4)';
                      const textColor = sentiment === 'good' ? '#4ade80' : sentiment === 'bad' ? '#f87171' : 'var(--text-2)';
                      return (
                        <div key={f.label} style={{ background: bg, borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3 }}>
                            {FACTOR_ICONS[f.label]} {f.label}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: textColor }}>{f.value}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Time-of-day note */}
                  <div style={{
                    background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.15)',
                    borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5,
                  }}>
                    💡 Scores are recalculated in real-time based on current hour, your profile ({profile.vulnerabilityType || 'Solo Woman'}), and Indore safety data.
                  </div>

                  <button
                    className="btn-primary"
                    style={{ background: route.level === 'risk' ? 'var(--red)' : 'var(--teal)' }}
                    onClick={() => handleStartRoute(route.id)}
                  >
                    <Navigation2 size={15} />
                    {route.level === 'risk' ? '⚠ Start Anyway' : t('startWithRoute')}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Safety summary card */}
        <div className="card" style={{ borderColor: 'rgba(20,184,166,0.18)', marginTop: 4 }}>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
            <span style={{ color: 'var(--teal)', fontWeight: 700 }}>🛡 SafePath recommendation: </span>
            Route 1 via Vijay Nagar is safest right now with a score of{' '}
            <span style={{ color: '#22c55e', fontWeight: 700 }}>{displayRoutes[0]?.safetyScore}</span>.
            It has active police patrolling and 92% CCTV coverage — optimal for{' '}
            <span style={{ color: 'var(--teal)' }}>{profile.vulnerabilityType || 'Solo Woman'}</span> travellers at this hour.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </AppShell>
  );
}
