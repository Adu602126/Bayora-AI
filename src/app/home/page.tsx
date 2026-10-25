'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Navigation, Eye, AlertTriangle, User, Flag, X, Send, Bell, Heart, Users } from 'lucide-react';
import CommunityAlert from '@/components/CommunityAlert';
import TopBar from '@/components/TopBar';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import TrustedSafeZones from '@/components/TrustedSafeZones';
import CommunityHeatMap from '@/components/CommunityHeatMap';
import FakeCall from '@/components/FakeCall';
import ArrivalTimer from '@/components/ArrivalTimer';
import WeeklyReport from '@/components/WeeklyReport';
import QRShareCard from '@/components/QRShareCard';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import DecoyScreen from '@/components/DecoyScreen';
import EmergencyDial from '@/components/EmergencyDial';
import RiskTimeline from '@/components/RiskTimeline';
import WhatsNewModal from '@/components/WhatsNewModal';
import AudioRecordingOverlay from '@/components/AudioRecordingOverlay';
import AcousticGuardian from '@/components/AcousticGuardian';
import ARVisionOverlay from '@/components/ARVisionOverlay';
import AIEmoSync from '@/components/AIEmoSync';
import EvidenceVault from '@/components/EvidenceVault';
import HoldToSafe from '@/components/HoldToSafe';
import TrustedZones from '@/components/TrustedZones';
import JourneyLog from '@/components/JourneyLog';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/translations';
import { getDynamicTip } from '@/lib/riskScoring';
import { useShakeDetect } from '@/hooks/useShakeDetect';
import { haptic } from '@/hooks/useHaptics';
import { useBattery } from '@/hooks/useBattery';
import { toast } from '@/components/Toast';
import { playSiren, stopSiren } from '@/lib/siren';

// ── Community Reports (in-memory, reset on reload) ────────────────────────
interface Report {
  id: string;
  type: 'harassment' | 'poor-lighting' | 'suspicious' | 'safe-zone' | 'other';
  location: string;
  time: string;
  upvotes: number;
  isNew?: boolean;
}

const INITIAL_REPORTS: Report[] = [
  { id: '1', type: 'poor-lighting', location: 'Rajwada Circle, Palasia', time: '23 min ago', upvotes: 7 },
  { id: '2', type: 'safe-zone', location: 'Phoenix Citadel Mall Area', time: '1 hr ago', upvotes: 14 },
  { id: '3', type: 'suspicious', location: 'Bhanwarkua Underpass', time: '2 hr ago', upvotes: 3 },
];

const REPORT_TYPES = {
  harassment: { label: 'Harassment', emoji: '⚠️', color: '#ef4444' },
  'poor-lighting': { label: 'Poor Lighting', emoji: '🔦', color: '#f59e0b' },
  suspicious: { label: 'Suspicious', emoji: '👁', color: '#8b5cf6' },
  'safe-zone': { label: 'Safe Zone', emoji: '✅', color: '#22c55e' },
  other: { label: 'Other', emoji: '📍', color: '#94a3b8' },
};

// ── Animated counter hook ─────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export default function HomePage() {
  const { profile, language } = useStore();
  const t = useTranslation(language);
  const [hour, setHour] = useState(new Date().getHours());
  const [tip, setTip] = useState('');
  const [time, setTime] = useState('');
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newReportType, setNewReportType] = useState<Report['type']>('suspicious');
  const [newReportLocation, setNewReportLocation] = useState('');
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [notifBell, setNotifBell] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // ── New feature states ──────────────────────────────────────────────────
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [showArrivalTimer, setShowArrivalTimer] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showPWABanner, setShowPWABanner] = useState(false);
  const [showDecoy, setShowDecoy] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showRecording, setShowRecording] = useState(false);
  const [showHoldToSafe, setShowHoldToSafe] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showAcoustic, setShowAcoustic] = useState(false);
  const [showAR, setShowAR] = useState(false);
  const [showEmoSync, setShowEmoSync] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [showTrustedZones, setShowTrustedZones] = useState(false);
  const [showJourneyLog, setShowJourneyLog] = useState(false);
  const [shakeAlert, setShakeAlert] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const swipeStartX = useRef(0);
  const battery = useBattery();

  // Shake → SOS + Siren
  const handleShake = useCallback(() => {
    if (shakeAlert) return;
    setShakeAlert(true);
    navigator.vibrate?.([200, 100, 200, 100, 400]);
    playSiren();
    toast.warning('Siren Activated!', 'Shake detected. Hold SOS button to alert contacts.');
    setTimeout(() => {
      setShakeAlert(false);
      stopSiren();
    }, 4000);
  }, [shakeAlert]);
  useShakeDetect({ onShake: handleShake });

  // Pull-to-refresh
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy > 80 && !pullRefreshing) {
      setPullRefreshing(true);
      setTimeout(() => setPullRefreshing(false), 1800);
    }
  };

  useEffect(() => {
    const h = new Date().getHours();
    setHour(h);
    setTip(getDynamicTip(h));
    const updateTime = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const iv = setInterval(updateTime, 30_000);
    return () => clearInterval(iv);
  }, []);

  // Flash bell on new report
  useEffect(() => {
    if (reports.some(r => r.isNew)) {
      setNotifBell(true);
      setTimeout(() => setNotifBell(false), 3000);
    }
  }, [reports]);

  const timeRisk = hour >= 22 || hour < 5 ? 'High' : hour >= 19 ? 'Moderate' : 'Low';
  const riskColor = timeRisk === 'High' ? 'var(--red)' : timeRisk === 'Moderate' ? 'var(--amber)' : 'var(--green)';
  const riskBg = timeRisk === 'High' ? 'rgba(239,68,68,0.08)' : timeRisk === 'Moderate' ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)';
  const riskBorder = timeRisk === 'High' ? 'rgba(239,68,68,0.25)' : timeRisk === 'Moderate' ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.25)';
  const firstName = profile.name?.split(' ')[0] || 'there';

  const c1 = useCountUp(1247);
  const c2 = useCountUp(94);
  const c3 = useCountUp(38);
  const c4 = useCountUp(67);

  const stats = [
    { num: c1.toLocaleString(), label: t('journeysTracked'), icon: '🗺️' },
    { num: `${c2}%`, label: t('reachedSafely'), icon: '✅' },
    { num: String(c3), label: t('sosResponded'), icon: '🚨' },
    { num: `${c4}%`, label: t('riskReduction'), icon: '📉' },
  ];

  const quickActions = [
    { href: '/guardian', icon: Eye, color: 'var(--teal)', bg: 'rgba(20,184,166,0.1)', title: 'Guardian View', sub: 'Share live location' },
    { href: '/sos', icon: AlertTriangle, color: 'var(--red)', bg: 'rgba(239,68,68,0.1)', title: 'SOS Emergency', sub: 'Hold to activate' },
    { href: '/journey', icon: Navigation, color: 'var(--amber)', bg: 'rgba(245,158,11,0.1)', title: 'Track Journey', sub: 'Start live tracking' },
    { href: '/healing', icon: Heart, color: '#a5b4fc', bg: 'rgba(99,102,241,0.1)', title: 'Recovery Hub', sub: 'Post-incident care' },
    { href: '/community', icon: Users, color: '#f87171', bg: 'rgba(239,68,68,0.1)', title: 'Community Alert', sub: 'Alert nearby users' },
    { href: '/motion-sos', icon: Navigation, color: '#fb923c', bg: 'rgba(251,146,60,0.1)', title: 'Motion SOS', sub: 'Drop & shake detect' },
  ];


  const submitReport = () => {
    if (!newReportLocation.trim()) return;
    const newR: Report = {
      id: Date.now().toString(),
      type: newReportType,
      location: newReportLocation.trim(),
      time: 'Just now',
      upvotes: 0,
      isNew: true,
    };
    setReports(prev => [newR, ...prev].slice(0, 8));
    setNewReportLocation('');
    setShowReportModal(false);
  };

  const upvote = (id: string) => {
    if (votedIds.has(id)) return;
    setVotedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setReports(prev => prev.map(r => r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r));
  };

  // Risk color theme applied globally via CSS vars override
  const riskThemeBg = timeRisk === 'High'
    ? 'rgba(239,68,68,0.03)'
    : timeRisk === 'Moderate'
      ? 'rgba(245,158,11,0.02)'
      : 'transparent';

  return (
    <ProtectedRoute requiredAuth={true}>
      <AppShell>
        {/* ── Overlays ──────────────────────────────────────────────────── */}
        {showDecoy && <DecoyScreen onExit={() => setShowDecoy(false)} />}
        {showFakeCall && <FakeCall onClose={() => setShowFakeCall(false)} />}
        {showArrivalTimer && (
          <ArrivalTimer
            onSOS={() => { setShowArrivalTimer(false); }}
            onClose={() => setShowArrivalTimer(false)}
          />
        )}
        {showWeeklyReport && <WeeklyReport onClose={() => setShowWeeklyReport(false)} />}
        {showQR && <QRShareCard onClose={() => setShowQR(false)} userName={profile.name || 'Traveler'} />}
        {showWhatsNew && <WhatsNewModal onClose={() => setShowWhatsNew(false)} />}
        {showRecording && <AudioRecordingOverlay onStop={() => { setShowRecording(false); toast.info('Recording saved', 'Evidence recording stopped and stored.'); }} />}
        {showHoldToSafe && <HoldToSafe onTriggerSOS={() => { setShowHoldToSafe(false); toast.error('SOS Auto-Triggered!', 'Dead Man Switch was released.'); }} onClose={() => setShowHoldToSafe(false)} />}
        {showAcoustic && <AcousticGuardian onClose={() => setShowAcoustic(false)} onTriggerSOS={() => { setShowAcoustic(false); toast.error('SOS Auto-Triggered!', 'Acoustic anomaly detected.'); }} />}
        {showAR && <ARVisionOverlay onClose={() => setShowAR(false)} />}
        {showEmoSync && <AIEmoSync onClose={() => setShowEmoSync(false)} />}
        {showVault && <EvidenceVault onClose={() => setShowVault(false)} />}
        {showTrustedZones && <TrustedZones onClose={() => setShowTrustedZones(false)} />}
        {showJourneyLog && <JourneyLog onClose={() => setShowJourneyLog(false)} />}
        {showPWABanner && (
          <PWAInstallBanner
            onInstall={async () => 'dismissed'}
            onDismiss={() => setShowPWABanner(false)}
          />
        )}

        {/* ── Battery warning ──────────────────────────────────────────── */}
        {battery?.isLow && (
          <div className="fade-in" style={{
            position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.95), rgba(239,68,68,0.9))',
            borderRadius: 14, padding: '9px 16px', zIndex: 900,
            fontSize: 12, fontWeight: 700, color: '#fff',
            boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
            display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
          }}>
            🪴 Battery {Math.round(battery.level * 100)}% — Enable Guardian Mode now!
          </div>
        )}

        {/* ── Shake SOS toast ──────────────────────────────────────────── */}
        {shakeAlert && (
          <div className="fade-in" style={{
            position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(220,38,38,0.95))',
            border: '1px solid rgba(239,68,68,0.5)',
            borderRadius: 14, padding: '10px 18px', zIndex: 900,
            fontSize: 13, fontWeight: 700, color: '#fff',
            boxShadow: '0 4px 20px rgba(239,68,68,0.5)',
            display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
          }}>
            🚨 Shake detected — Hold SOS to alert contacts
          </div>
        )}

        {/* ── Pull-to-refresh indicator ──────────────────────────────── */}
        {pullRefreshing && (
          <div style={{
            position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)',
            borderRadius: 20, padding: '6px 14px', zIndex: 900,
            fontSize: 12, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div className="spin" style={{ width: 12, height: 12, border: '2px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%' }} />
            Refreshing…
          </div>
        )}

        {/* ── Demo mode banner ──────────────────────────────────────── */}
        {demoMode && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))',
            border: '1px solid rgba(139,92,246,0.3)',
            padding: '8px 16px', fontSize: 11, color: '#a78bfa',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span>✨ Demo Mode — Simulated live journey active</span>
            <button onClick={() => setDemoMode(false)} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Exit</button>
          </div>
        )}

        <TopBar showLogo />
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ padding: '16px 16px 100px', overflowY: 'auto', background: riskThemeBg, transition: 'background 1s ease' }}>

          {/* ── GREETING HERO ──────────────────────────────────────────────── */}
          <div className="hero-card fade-in-scale" style={{ marginBottom: 16 }}>
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>
                  {t('welcomeBack')} · {time}
                </div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, lineHeight: 1.15 }}>
                  Hey {firstName} 👋
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
                  Vijay Nagar, Indore
                </div>
              </div>
              {/* Risk pill */}
              <div style={{
                background: riskBg, border: `1px solid ${riskBorder}`,
                borderRadius: 12, padding: '10px 14px', textAlign: 'center', minWidth: 72,
              }}>
                <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 2 }}>Risk</div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 900, color: riskColor }}>{timeRisk}</div>
              </div>
            </div>

            {/* Area stats row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Patrols', val: '12', color: 'var(--green)' },
                { label: 'CCTV', val: '84%', color: 'var(--teal)' },
                { label: 'Safe Zones', val: '7', color: 'var(--amber)' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '9px 6px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* CTA button */}
            <Link
              href="/routes"
              className="btn-primary gradient-shift"
              style={{
                textDecoration: 'none',
                display: 'flex',
                background: 'linear-gradient(135deg, var(--teal), #3b82f6, var(--teal))',
                backgroundSize: '200% 200%',
              }}
            >
              <Navigation size={17} /> {t('startJourney')}
            </Link>
          </div>

          {/* ── SAFETY TIP ─────────────────────────────────────────────────── */}
          <div className="fade-in" style={{
            background: 'rgba(20,184,166,0.06)',
            border: '1px solid rgba(20,184,166,0.18)',
            borderLeft: '3px solid var(--teal)',
            borderRadius: '0 12px 12px 0',
            padding: '12px 14px',
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>
              💡 {t('safetyTip')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{tip}</div>
          </div>

          {/* ── NEW SAFETY FEATURES ───────────────────────────────────────── */}
          {mounted && (
            <>
              <TrustedSafeZones />
              <CommunityHeatMap />
            </>
          )}

          {/* ── QUICK ACTIONS ──────────────────────────────────────────────── */}
          <div className="section-h">{t('quickActions')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {quickActions.map(({ href, icon: Icon, color, bg, title, sub }, i) => (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div className="quick-card fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
                  }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── COMMUNITY SAFETY REPORTS (NEW FEATURE) ─────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="section-h" style={{ margin: 0 }}>Community Reports</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Notification bell */}
              <div style={{ position: 'relative' }}>
                <Bell size={14} style={{ color: notifBell ? 'var(--teal)' : 'var(--text-3)', transition: 'color 0.3s' }} />
                {notifBell && (
                  <div style={{ position: 'absolute', top: -2, right: -2, width: 5, height: 5, background: 'var(--red)', borderRadius: '50%' }} />
                )}
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                style={{
                  background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.3)',
                  color: 'var(--teal)', borderRadius: 7, padding: '4px 10px',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <Flag size={11} /> Report
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            {reports.map((r, i) => {
              const rt = REPORT_TYPES[r.type];
              const voted = votedIds.has(r.id);
              return (
                <div key={r.id} className="report-card fade-in" style={{
                  marginBottom: 8,
                  animationDelay: `${i * 50}ms`,
                  borderColor: r.isNew ? 'rgba(20,184,166,0.3)' : 'var(--border-2)',
                  transform: swipingId === r.id ? `translateX(${Math.min(0, swipeX)}px)` : 'translateX(0)',
                  transition: swipingId === r.id ? 'none' : 'transform 0.3s ease',
                  opacity: swipingId === r.id && swipeX < -80 ? Math.max(0, 1 + swipeX / 160) : 1,
                }}
                  onTouchStart={e => { swipeStartX.current = e.touches[0].clientX; setSwipingId(r.id); setSwipeX(0); }}
                  onTouchMove={e => { if (swipingId === r.id) setSwipeX(e.touches[0].clientX - swipeStartX.current); }}
                  onTouchEnd={() => {
                    if (swipingId === r.id && swipeX < -120) {
                      setReports(prev => prev.filter(x => x.id !== r.id));
                      toast.info('Report dismissed', 'Swipe again to restore.');
                    }
                    setSwipingId(null); setSwipeX(0);
                  }}
                >
                  {/* Type icon */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: `${rt.color}18`,
                    border: `1px solid ${rt.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15,
                  }}>
                    {rt.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: rt.color }}>{rt.label}</span>
                      {r.isNew && (
                        <span style={{ fontSize: 9, background: 'rgba(20,184,166,0.15)', color: 'var(--teal)', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>NEW</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📍 {r.location}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{r.time}</div>
                  </div>
                  {/* Upvote */}
                  <button
                    onClick={() => upvote(r.id)}
                    style={{
                      background: voted ? 'rgba(20,184,166,0.12)' : 'transparent',
                      border: `1px solid ${voted ? 'rgba(20,184,166,0.4)' : 'var(--border-3)'}`,
                      borderRadius: 8, padding: '5px 8px', cursor: voted ? 'default' : 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 12 }}>👍</span>
                    <span style={{ fontSize: 10, color: voted ? 'var(--teal)' : 'var(--text-3)', fontWeight: 600 }}>{r.upvotes}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── SAFETY TOOLS STRIP ─────────────────────────────────────────── */}
          <div className="section-h" style={{ marginTop: 8 }}>Safety Tools</div>
          <div suppressHydrationWarning style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
            {mounted && [
              { icon: '📞', label: 'Fake Call', onClick: () => { haptic('medium'); setShowFakeCall(true); }, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
              { icon: '⏱️', label: 'Safe Timer', onClick: () => { haptic('medium'); setShowArrivalTimer(true); }, color: 'var(--amber)', bg: 'rgba(245, 158, 11, 0.1)' },
              { icon: '🔒', label: 'Evidence', onClick: () => { haptic('heavy'); setShowVault(true); }, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
              { icon: '👁️', label: 'AR Vision', onClick: () => { haptic('heavy'); setShowAR(true); }, color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
              { icon: '🧠', label: 'Emo Sync', onClick: () => { haptic('selection'); setShowEmoSync(true); }, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' },
              { icon: '🔊', label: 'Acoustic AI', onClick: () => { haptic('selection'); setShowAcoustic(true); }, color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)' },
              { icon: '📊', label: 'My Report', onClick: () => { haptic('medium'); setShowWeeklyReport(true); }, color: 'var(--teal)', bg: 'rgba(20, 184, 166, 0.1)' },
              { icon: '🧮', label: 'Decoy', onClick: () => { haptic('heavy'); setShowDecoy(true); toast.info('Decoy mode', 'Tap = five times to exit.'); }, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
              { icon: '🛡️', label: 'Hold Safe', onClick: () => { haptic('medium'); setShowHoldToSafe(true); }, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
              { icon: '🎙️', label: 'Record', onClick: () => { haptic('medium'); setShowRecording(true); toast.warning('Recording started', 'Tap stop to save evidence.'); }, color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
              { icon: '📱', label: 'QR Share', onClick: () => { haptic('medium'); setShowQR(true); }, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
              { icon: '📍', label: 'Safe Zones', onClick: () => { haptic('medium'); setShowTrustedZones(true); }, color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.1)' },
              { icon: '📓', label: 'Journey Log', onClick: () => { haptic('selection'); setShowJourneyLog(true); }, color: '#a78bfa', bg: 'rgba(139, 92, 246, 0.1)' },
              { icon: '⬇️', label: 'Install App', onClick: () => { haptic('medium'); setShowPWABanner(true); }, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
              { icon: '🚀', label: "What's New", onClick: () => { haptic('selection'); setShowWhatsNew(true); }, color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.1)' },
              { icon: '✨', label: demoMode ? 'Exit Demo' : 'Demo Mode', onClick: () => { haptic('selection'); setDemoMode(d => !d); toast.info(demoMode ? 'Demo exited' : 'Demo mode on', ''); }, color: '#a78bfa', bg: 'rgba(139, 92, 246, 0.1)' },
            ].map(tool => (
              <button key={tool.label} onClick={tool.onClick} style={{
                background: tool.bg,
                border: `1px solid ${tool.color}33`,
                borderRadius: 12, padding: '10px 14px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                cursor: 'pointer', flexShrink: 0, minWidth: 76,
                transition: 'all 0.2s', fontFamily: 'var(--font-body)',
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
              >
                <span style={{ fontSize: 20 }}>{tool.icon}</span>
                <span style={{ fontSize: 10, color: tool.color, fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>{tool.label}</span>
              </button>
            ))}
          </div>

          {/* ── RISK TIMELINE ──────────────────────────────────────────────── */}
          <RiskTimeline />

          {/* ── EMERGENCY QUICK-DIAL ───────────────────────────────────────── */}
          <EmergencyDial />

          {/* ── IMPACT STATS ───────────────────────────────────────────────── */}
          <div className="section-h">{t('impactMonth')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {stats.map((s, i) => (
              <div key={s.label} className="stat-card fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: 'var(--teal)', animation: 'countUp 0.5s ease' }}>
                  {s.num}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

        </div>

        {/* ── REPORT MODAL ─────────────────────────────────────────────────── */}
        {showReportModal && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              zIndex: 500, display: 'flex', alignItems: 'flex-end',
              backdropFilter: 'blur(4px)',
            }}
            onClick={e => { if (e.target === e.currentTarget) setShowReportModal(false); }}
          >
            <div ref={modalRef} className="fade-in-up" style={{
              background: 'var(--bg-2)', borderRadius: '20px 20px 0 0',
              border: '1px solid var(--border-2)', padding: '20px 20px 36px',
              width: '100%', maxWidth: 430, margin: '0 auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 800 }}>
                  🚩 Submit Safety Report
                </div>
                <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Report type selector */}
              <div className="section-h">Incident Type</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
                {(Object.entries(REPORT_TYPES) as [Report['type'], typeof REPORT_TYPES[keyof typeof REPORT_TYPES]][]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setNewReportType(key)}
                    style={{
                      background: newReportType === key ? `${val.color}18` : 'var(--bg-4)',
                      border: `1px solid ${newReportType === key ? val.color + '55' : 'var(--border-3)'}`,
                      color: newReportType === key ? val.color : 'var(--text-2)',
                      borderRadius: 8, padding: '6px 12px', fontSize: 12,
                      fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {val.emoji} {val.label}
                  </button>
                ))}
              </div>

              {/* Location input */}
              <div className="section-h">Location</div>
              <input
                className="inp"
                placeholder="e.g. Rajwada Circle, near ATM"
                value={newReportLocation}
                onChange={e => setNewReportLocation(e.target.value)}
                style={{ marginBottom: 16 }}
                onKeyDown={e => e.key === 'Enter' && submitReport()}
              />

              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.5 }}>
                ℹ️ Reports are anonymous and help keep the community safe. Do not include personal information.
              </div>

              <button className="btn-primary" onClick={submitReport} style={{ gap: 8 }}>
                <Send size={15} /> Submit Report
              </button>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
