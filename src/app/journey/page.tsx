'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Check, Share2, XCircle, Navigation } from 'lucide-react';
import TopBar from '@/components/TopBar';
import AppShell from '@/components/AppShell';
import SafeMap from '@/components/SafeMap';
import { useStore, mockRoutes } from '@/store/useStore';
import { useTranslation } from '@/lib/translations';
import { scoreToColor, detectDeviation } from '@/lib/riskScoring';

export default function JourneyPage() {
  const { journey, language, checkIn, endJourney, tickCheckIn, updateLocation } = useStore();
  const t = useTranslation(language);
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef        = useRef<number | null>(null);
  const deviationAlerted = useRef(false);   // FIX: prevent repeated deviation alerts

  const route = mockRoutes.find(r => r.id === journey.routeId) || mockRoutes[0];

  // ── Check-in countdown ────────────────────────────────────────────────
  useEffect(() => {
    if (!journey.active) return;
    timerRef.current = setInterval(() => tickCheckIn(), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [journey.active, tickCheckIn]);

  // ── Auto-alert on timeout ─────────────────────────────────────────────
  useEffect(() => {
    if (journey.active && journey.checkInTimer === 0) {
      alert('⚠️ Check-in timeout!\nAutomatic alert sent to guardians.\n\n[Connect Firebase FCM for real notifications]');
      checkIn();
    }
  }, [journey.checkInTimer, journey.active, checkIn]);

  // ── Geolocation watch ─────────────────────────────────────────────────
  useEffect(() => {
    if (!journey.active) return;
    deviationAlerted.current = false;   // reset on new journey
    if (!('geolocation' in navigator)) return;

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        updateLocation(lat, lng);

        // FIX: only alert once per journey, not on every GPS tick
        if (!deviationAlerted.current) {
          const deviated = detectDeviation(lat, lng, route.coordinates, 0.2);
          if (deviated) {
            deviationAlerted.current = true;
            alert('⚠️ Route deviation detected!\nGuardians have been notified.');
          }
        }
      },
      (err) => console.warn('[GPS]', err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [journey.active, route.coordinates, updateLocation]);

  const mins = Math.floor(journey.checkInTimer / 60);
  const secs = journey.checkInTimer % 60;
  const pct  = Math.round((journey.checkInTimer / 300) * 100);
  const circumference = 2 * Math.PI * 28;
  const dashOffset    = circumference * (1 - pct / 100);

  // ── No active journey ─────────────────────────────────────────────────
  if (!journey.active) {
    return (
      <AppShell>
        <TopBar showLogo />
        <div style={{ padding: 16, paddingBottom: 100 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{t('liveJourney')}</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24 }}>{t('noJourneySubtitle')}</div>

          <div className="map-ph" style={{ height: 200, marginBottom: 20 }}>
            <div className="map-grid" />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
              <div style={{ background: 'rgba(10,15,26,0.9)', padding: '12px 18px', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>No active journey</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Plan a route to start tracking</div>
              </div>
            </div>
          </div>

          <Link href="/routes" style={{ textDecoration: 'none' }}>
            <button className="btn-primary"><Navigation size={16} /> {t('planARoute')}</button>
          </Link>
        </div>
      </AppShell>
    );
  }

  // ── Active journey ────────────────────────────────────────────────────
  return (
    <AppShell>
      <TopBar showLogo />
      <div style={{ padding: 16, paddingBottom: 100 }}>

        {/* Status bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ position: 'relative', width: 10, height: 10 }}>
            <div style={{ width: 10, height: 10, background: 'var(--green)', borderRadius: '50%' }} />
            <div className="ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--green)', opacity: 0.5 }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>{t('journeyActive')}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-2)' }}>{route.name}</span>
        </div>

        {/* Live Tracking Map */}
        <div style={{ position: 'relative', height: 250, marginBottom: 16, borderRadius: 12, overflow: 'hidden' }}>
          <SafeMap selectedRouteCoords={route.coordinates} />
          
          <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(10,15,26,0.9)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 700 }}>LIVE TRACKING</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>{route.name} · {route.distance} left</div>
          </div>
          {journey.currentLocation && (
            <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(10,15,26,0.9)', padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
                {journey.currentLocation.lat.toFixed(4)}, {journey.currentLocation.lng.toFixed(4)}
              </div>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div className="card-sm">
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t('routeSafety')}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: scoreToColor(route.safetyScore) }}>{route.safetyScore}</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Score</div>
          </div>
          <div className="card-sm">
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t('eta')}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: 'var(--teal)' }}>{route.duration}</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Estimated</div>
          </div>
        </div>

        {/* Check-in card */}
        <div className="card" style={{ borderColor: 'rgba(245,158,11,0.25)', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{t('guardianCheckin')}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                {t('autoAlert')} {mins}:{secs.toString().padStart(2, '0')}
              </div>
            </div>
            <div style={{ position: 'relative', width: 68, height: 68 }}>
              <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="34" cy="34" r="28" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
                <circle cx="34" cy="34" r="28" fill="none" stroke="var(--amber)" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={`${dashOffset}`}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--amber)' }}>
                {mins}
              </div>
            </div>
          </div>
          <button className="btn-primary" style={{ background: 'var(--green)' }} onClick={checkIn}>
            <Check size={16} /> {t('imSafe')}
          </button>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button className="btn-ghost" onClick={() => alert('Share link: safepath.app/track/xyz123\n\nConnect Firebase to generate real shareable tracking links')}>
            <Share2 size={14} /> {t('shareLink')}
          </button>
          <button className="btn-ghost" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={endJourney}>
            <XCircle size={14} /> {t('endJourney')}
          </button>
        </div>

      </div>
    </AppShell>
  );
}
