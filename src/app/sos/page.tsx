'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Phone, PhoneOff, ShieldAlert, Radio, Camera, CheckCircle } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/translations';
import { dispatchSOSAlert } from '@/lib/riskScoring';

// ── SOS flow states ───────────────────────────────────────────────────────
type SOSState = 'idle' | 'holding' | 'dispatching' | 'active' | 'fake-call' | 'resolved';

// ── Fake-call contact pool ────────────────────────────────────────────────
const FAKE_CALLERS = ['Mom', 'Riya - Friend', 'Emergency Response', 'Police Control Room'];

// ── Web Audio siren ───────────────────────────────────────────────────────
function createSiren(ctx: AudioContext, loops = 8) {
  let t = ctx.currentTime + 0.05;
  for (let i = 0; i < loops; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    const dur = 0.45;
    osc.frequency.setValueAtTime(580, t + i * dur);
    osc.frequency.linearRampToValueAtTime(920, t + i * dur + dur * 0.5);
    osc.frequency.linearRampToValueAtTime(580, t + i * dur + dur);
    gain.gain.setValueAtTime(0.0, t + i * dur);
    gain.gain.linearRampToValueAtTime(0.28, t + i * dur + 0.05);
    gain.gain.setValueAtTime(0.28, t + i * dur + dur - 0.05);
    gain.gain.linearRampToValueAtTime(0.0, t + i * dur + dur);
    osc.start(t + i * dur);
    osc.stop(t + i * dur + dur);
  }
}

export default function SOSPage() {
  const { language, profile, journey, activateSOS, deactivateSOS } = useStore();
  const t = useTranslation(language);

  const [sosState, setSOSState] = useState<SOSState>('idle');
  const [holdProgress, setHoldProgress] = useState(0);   // 0–100
  const [holdCount, setHoldCount] = useState(3);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  const [fakeCaller, setFakeCaller] = useState('');
  const [callSeconds, setCallSeconds] = useState(0);
  const [alertsSent, setAlertsSent] = useState<string[]>([]);
  const [sirenOn, setSirenOn] = useState(false);
  const [camSimOn, setCamSimOn] = useState(false);
  const holdTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef    = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const triggerSOSRef  = useRef<() => Promise<void>>(async () => {});

  // ── helpers ──────────────────────────────────────────────────────────────

  const playSiren = useCallback(() => {
    try {
      audioCtxRef.current?.close();
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      createSiren(audioCtxRef.current, 10);
      setSirenOn(true);
      setTimeout(() => setSirenOn(false), 4500);
    } catch { /* audio blocked */ }
  }, []);

  const stopSiren = useCallback(() => {
    audioCtxRef.current?.close().catch(() => {});
    setSirenOn(false);
  }, []);

  const getContacts = useCallback(() =>
    profile.contacts.length > 0
      ? profile.contacts.map(c => ({ name: c.name, phone: c.phone }))
      : [{ name: 'Mom', phone: '+91 98765 43210' }, { name: 'Riya', phone: '+91 91234 56789' }],
  [profile.contacts]);

  const getLocation = useCallback(() =>
    journey.currentLocation || { lat: 22.7196, lng: 75.8577 },
  [journey.currentLocation]);

  // ── hold-to-activate ─────────────────────────────────────────────────────
  // FIX: use a ref to always call the latest triggerSOS, avoiding stale closure

  // clearAll must be declared first — startHold and cancelHold reference it
  const clearAll = useCallback(() => {
    [holdTimerRef, holdProgressRef].forEach(r => { if (r.current) { clearInterval(r.current); r.current = null; } });
  }, []);

  const startHold = useCallback(() => {
    if (sosState !== 'idle') return;
    setSOSState('holding');
    setHoldCount(3);
    setHoldProgress(0);

    let elapsed = 0;
    const TOTAL_MS = 2000;
    holdProgressRef.current = setInterval(() => {
      elapsed += 40;
      setHoldProgress(Math.min(100, (elapsed / TOTAL_MS) * 100));
    }, 40);

    let count = 3;
    holdTimerRef.current = setInterval(() => {
      count--;
      setHoldCount(count);
      if (count <= 0) { clearAll(); triggerSOSRef.current(); }
    }, TOTAL_MS / 3);
  }, [sosState, clearAll]);

  const cancelHold = useCallback(() => {
    if (sosState !== 'holding') return;
    clearAll();
    setSOSState('idle');
    setHoldProgress(0);
  }, [sosState, clearAll]);

  // ── trigger SOS ──────────────────────────────────────────────────────────

  const triggerSOS = useCallback(async () => {
    setSOSState('dispatching');
    clearAll();
    activateSOS();
    playSiren();
    setCamSimOn(true);

    const contacts = getContacts();
    const location = getLocation();
    await dispatchSOSAlert(contacts, location, profile.name || 'User');
    setAlertsSent(contacts.map(c => c.name));

    // Show active state briefly then fake-call
    setSOSState('active');
    setTimeout(() => {
      const caller = contacts[0]?.name || FAKE_CALLERS[0];
      setFakeCaller(caller);
      setSOSState('fake-call');
      setCallSeconds(0);
      callTimerRef.current = setInterval(() => {
        setCallSeconds(s => s + 1);
      }, 1000);
    }, 2200);
  }, [getContacts, getLocation, profile.name, activateSOS, playSiren, clearAll]);

  // FIX: keep ref in sync so startHold always calls latest version
  useEffect(() => {
    triggerSOSRef.current = triggerSOS;
  }, [triggerSOS]);

  // ── accept / decline fake call ────────────────────────────────────────────

  const endCall = useCallback(() => {
    if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
    setSOSState('active');
  }, []);

  const resolveSOS = useCallback(() => {
    stopSiren();
    deactivateSOS();
    if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
    setSOSState('resolved');
    setCamSimOn(false);
  }, [stopSiren, deactivateSOS]);

  // ── voice activation ────────────────────────────────────────────────────

  const startVoice = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setVoiceError(true); return; }
    const rec = new SR();
    rec.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      const text = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join(' ').toLowerCase();
      if (text.includes('help') || text.includes('emergency') || text.includes('मदद') || text.includes('bachao') || text.includes('बचाओ')) {
        rec.stop();
        setVoiceListening(false);
        if (sosState === 'idle') triggerSOS();
      }
    };
    rec.onerror = () => { setVoiceListening(false); setVoiceError(true); };
    rec.onend = () => setVoiceListening(false);
    rec.start();
    recognitionRef.current = rec;
    setVoiceListening(true);
    setVoiceError(false);
  }, [language, sosState, triggerSOS]);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    setVoiceListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAll();
      stopVoice();
      stopSiren();
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [clearAll, stopVoice, stopSiren]);

  // ── call duration formatter ───────────────────────────────────────────────
  const formatCall = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  // ── render helpers ───────────────────────────────────────────────────────

  const actionRows = [
    { icon: '📍', text: t('sos1') },
    { icon: '📱', text: t('sos2') },
    { icon: '🔊', text: t('sos3') },
    { icon: '🎥', text: t('sos4') },
    { icon: '📞', text: t('sos5') },
  ];

  // ── FAKE CALL SCREEN ─────────────────────────────────────────────────────
  if (sosState === 'fake-call') {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(180deg,#0f1a2e 0%,#0a0f1a 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', padding: '60px 32px 48px',
        zIndex: 999,
      }}>
        {/* Caller info */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
            Incoming Call
          </div>
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(20,184,166,0.15)', border: '2px solid rgba(20,184,166,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 36 }}>
            {fakeCaller[0] || '👮'}
          </div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, marginBottom: 6, color: '#fff' }}>{fakeCaller}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>SafePath Guardian Alert</div>
          <div style={{ fontSize: 14, color: '#22c55e', fontWeight: 600 }}>{formatCall(callSeconds)}</div>
        </div>

        {/* Live location badge */}
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '10px 16px', textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>BROADCASTING LIVE LOCATION</div>
          <div style={{ fontSize: 13, color: '#f87171', fontWeight: 600 }}>
            📍 {getLocation().lat.toFixed(4)}, {getLocation().lng.toFixed(4)}
          </div>
        </div>

        {/* Call buttons */}
        <div style={{ display: 'flex', gap: 48, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={endCall}
              style={{ width: 72, height: 72, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <PhoneOff size={28} color="#fff" />
            </button>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Decline</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => { /* call connected - timer keeps running */ }}
              className="sos-pulse"
              style={{ width: 72, height: 72, borderRadius: '50%', background: '#22c55e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Phone size={28} color="#fff" />
            </button>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Accept</div>
          </div>
        </div>
      </div>
    );
  }

  // ── RESOLVED SCREEN ──────────────────────────────────────────────────────
  if (sosState === 'resolved') {
    return (
      <>
        <TopBar title="Emergency SOS" showLogo={false} backHref="/home" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <CheckCircle size={36} style={{ color: '#22c55e' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: '#22c55e', marginBottom: 8 }}>You&apos;re Safe</div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 32, lineHeight: 1.6 }}>You are safe. Guardians have been notified.</div>

          <div className="card" style={{ width: '100%', marginBottom: 20, textAlign: 'left' }}>
            <div className="section-h" style={{ marginBottom: 10 }}>Alerts sent to</div>
            {alertsSent.map(name => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} />
                {name}
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={() => setSOSState('idle')}>
            Back to SOS screen
          </button>
        </div>
      </>
    );
  }

  // ── MAIN SOS PAGE ─────────────────────────────────────────────────────────
  const isDispatching = sosState === 'dispatching';
  const isActive      = sosState === 'active';
  const isIdle        = sosState === 'idle';
  const isHolding     = sosState === 'holding';

  // Outer ring color
  const ringColor = isActive ? 'rgba(239,68,68,0.6)' : isHolding ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.18)';

  return (
    <>
      <TopBar title="Emergency SOS" showLogo={false} backHref="/home" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: 'var(--red)', marginBottom: 4 }}>
            {t('emergency')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
            {isActive ? '🔴 SOS is active — guardians notified' : t('tapHold')}
          </div>
        </div>

        {/* ── SOS BUTTON AREA ─────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative', width: 210, height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Outer pulsing ring */}
            <div className={isActive ? 'sos-pulse' : ''} style={{
              position: 'absolute', width: 210, height: 210, borderRadius: '50%',
              border: `2px solid ${ringColor}`,
              background: isActive ? 'rgba(239,68,68,0.06)' : 'transparent',
              transition: 'border-color 0.4s, background 0.4s',
            }} />

            {/* Progress ring (during hold) */}
            {isHolding && (
              <svg style={{ position: 'absolute', width: 210, height: 210, transform: 'rotate(-90deg)' }} viewBox="0 0 210 210">
                <circle cx="105" cy="105" r="96" fill="none" stroke="rgba(239,68,68,0.12)" strokeWidth="6" />
                <circle cx="105" cy="105" r="96" fill="none" stroke="#ef4444" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2*Math.PI*96}`}
                  strokeDashoffset={`${2*Math.PI*96*(1 - holdProgress/100)}`}
                  style={{ transition: 'stroke-dashoffset 0.04s linear' }}
                />
              </svg>
            )}

            {/* Centre button */}
            <div
              onMouseDown={isIdle ? startHold : undefined}
              onTouchStart={isIdle ? startHold : undefined}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchEnd={cancelHold}
              style={{
                width: 146, height: 146, borderRadius: '50%',
                background: isActive
                  ? 'rgba(239,68,68,0.18)'
                  : isDispatching
                  ? 'rgba(239,68,68,0.5)'
                  : 'var(--red)',
                border: (isActive || isDispatching) ? '3px solid var(--red)' : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: isIdle ? 'pointer' : 'default',
                userSelect: 'none', WebkitUserSelect: 'none',
                transition: 'background 0.3s',
                gap: 4,
              }}
            >
              {isHolding ? (
                <span style={{ fontFamily: 'var(--font-head)', fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                  {holdCount}
                </span>
              ) : isDispatching ? (
                <>
                  <Radio size={28} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 700, letterSpacing: 1 }}>SENDING</span>
                </>
              ) : isActive ? (
                <>
                  <ShieldAlert size={28} style={{ color: 'var(--red)' }} />
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 900, color: 'var(--red)', letterSpacing: 2 }}>ACTIVE</span>
                </>
              ) : (
                <>
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: 4 }}>SOS</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>HOLD 2 SEC</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── LIVE STATUS WHEN ACTIVE ──────────────────────────────── */}
        {isActive && (
          <div style={{ marginBottom: 20 }} className="fade-in">
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, background: 'var(--red)', borderRadius: '50%', animation: 'ping 1s infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>Emergency Active</span>
              </div>
              {alertsSent.map(name => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-2)', padding: '4px 0' }}>
                  <CheckCircle size={12} style={{ color: '#22c55e', flexShrink: 0 }} /> Alert sent to {name}
                </div>
              ))}
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)' }}>
                📍 {getLocation().lat.toFixed(4)}, {getLocation().lng.toFixed(4)} — broadcasting live
              </div>
            </div>

            {/* Recording sim + controls */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%', animation: 'ping 1s infinite', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>Recording</span>
              </div>
              {camSimOn && (
                <div style={{ flex: 1, background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Camera size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 600 }}>Camera on</span>
                </div>
              )}
            </div>

            <button className="btn-primary" style={{ marginTop: 12, background: '#22c55e' }} onClick={resolveSOS}>
              <CheckCircle size={16} /> I&apos;m Safe — End SOS
            </button>
          </div>
        )}

        {/* ── QUICK ACTION CARDS ───────────────────────────────────── */}
        {!isActive && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {/* Voice trigger */}
            <div
              className="card-sm"
              style={{
                textAlign: 'center', cursor: 'pointer',
                borderColor: voiceListening ? 'var(--teal)' : voiceError ? 'var(--red)' : 'var(--border)',
                background: voiceListening ? 'rgba(20,184,166,0.08)' : 'var(--bg-3)',
              }}
              onClick={voiceListening ? stopVoice : startVoice}
            >
              {voiceListening
                ? <MicOff size={20} style={{ color: 'var(--teal)', margin: '0 auto 6px' }} />
                : <Mic size={20} style={{ color: voiceError ? 'var(--red)' : 'var(--text-2)', margin: '0 auto 6px' }} />
              }
              <div style={{ fontSize: 12, fontWeight: 600, color: voiceListening ? 'var(--teal)' : 'var(--text)' }}>
                {voiceListening ? 'Listening...' : t('voiceActivate')}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                {voiceError ? 'Not supported' : voiceListening ? 'Tap to stop' : t('sayHelp')}
              </div>
            </div>

            {/* Call police */}
            <div
              className="card-sm"
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => { if (typeof window !== 'undefined') window.location.href = 'tel:100'; }}
            >
              <Phone size={20} style={{ color: 'var(--red)', margin: '0 auto 6px' }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>{t('callPolice')}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{t('policeNumbers')}</div>
            </div>

            {/* Fake call trigger */}
            <div
              className="card-sm"
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => {
                const caller = FAKE_CALLERS[Math.floor(Math.random() * FAKE_CALLERS.length)];
                setFakeCaller(caller);
                setCallSeconds(0);
                setSOSState('fake-call');
                callTimerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
              }}
            >
              <Phone size={20} style={{ color: 'var(--amber)', margin: '0 auto 6px' }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>Fake Call</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>Safe exit trick</div>
            </div>

            {/* Siren test */}
            <div
              className="card-sm"
              style={{ textAlign: 'center', cursor: 'pointer', borderColor: sirenOn ? 'var(--red)' : 'var(--border)' }}
              onClick={sirenOn ? stopSiren : playSiren}
            >
              <Radio size={20} style={{ color: sirenOn ? 'var(--red)' : 'var(--text-2)', margin: '0 auto 6px' }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>{sirenOn ? 'Stop Siren' : 'Test Siren'}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>Web Audio API</div>
            </div>
          </div>
        )}

        {/* ── VOICE LISTENING BANNER ───────────────────────────────── */}
        {voiceListening && (
          <div className="fade-in" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.3)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, background: 'var(--teal)', borderRadius: '50%', animation: 'ping 1s infinite', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal)' }}>Listening for voice command</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Say {'"'}Help{'"'}, {'"'}Emergency{'"'}, {'"'}मदद{'"'}, or {'"'}बचाओ{'"'}</div>
            </div>
          </div>
        )}

        {/* ── WHAT HAPPENS ─────────────────────────────────────────── */}
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.15)', marginBottom: 16 }}>
          <div className="section-h" style={{ marginBottom: 12 }}>{t('onActivation')}</div>
          {actionRows.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < actionRows.length - 1 ? 10 : 0 }}>
              <div style={{ width: 22, height: 22, background: 'rgba(239,68,68,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 800, color: 'var(--red)', marginTop: 1 }}>{i + 1}</div>
              <div>
                <span style={{ fontSize: 14, marginRight: 6 }}>{a.icon}</span>
                <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{a.text}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── CONTACTS LIST ────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-h" style={{ marginBottom: 10 }}>SOS will alert</div>
          {(() => {
            const ctcs = getContacts();
            return ctcs.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < ctcs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(20,184,166,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--teal)', flexShrink: 0 }}>{c.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.phone}</div>
                </div>
                <Phone size={13} style={{ color: 'var(--text-3)' }} />
              </div>
            ));
          })()}
        </div>

        {/* Warning */}
        <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12, padding: 12, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--red)', fontWeight: 700 }}>⚠️ Important: </span>{t('sosWarning')}
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
