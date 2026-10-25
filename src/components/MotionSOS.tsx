'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { haptic } from '@/hooks/useHaptics';
import { toast } from '@/components/Toast';

// ── Constants ─────────────────────────────────────────────────────────────────
const FREE_FALL_THRESHOLD = 2.5;   // m/s² — near-zero gravity = free fall
const IMPACT_THRESHOLD    = 25;    // m/s² — spike after drop
const DROP_WINDOW_MS      = 800;   // ms — max time between free-fall & impact
const SHAKE_THRESHOLD     = 18;    // m/s² — delta to count as a shake
const SHAKE_COUNT_REQ     = 5;     // shakes needed in window
const SHAKE_WINDOW_MS     = 1500;  // ms — rolling window
const COUNTDOWN_SEC       = 10;    // seconds before SOS fires

type TriggerType = 'drop' | 'shake';
type LogType = 'drop' | 'shake' | 'sos' | 'cancelled';

interface LogItem {
  id: number;
  type: LogType;
  label: string;
  note: string;
  time: number;
}

// ── SOS Countdown Overlay ─────────────────────────────────────────────────────
function SOSCountdown({ seconds, trigger, onCancel, onFire }: {
  seconds: number;
  trigger: TriggerType;
  onCancel: () => void;
  onFire: () => void;
}) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - seconds / COUNTDOWN_SEC);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(8,4,12,0.95)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, color: 'var(--red)', marginBottom: 24, textTransform: 'uppercase' }}>
        {trigger === 'drop' ? '📱 Phone Drop Detected' : '📳 Shake Detected'}
      </div>

      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="8" />
          <circle cx="70" cy="70" r={r} fill="none" stroke="#ef4444" strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{seconds}</span>
          <span style={{ fontSize: 11, color: 'rgba(239,68,68,0.7)', marginTop: 2 }}>seconds</span>
        </div>
      </div>

      <div style={{ marginTop: 20, fontSize: 13, color: 'var(--text-2)', textAlign: 'center', maxWidth: 220, lineHeight: 1.6 }}>
        SOS will be sent to your emergency contacts & nearby community
      </div>

      <button onClick={onCancel} style={{
        marginTop: 28, padding: '12px 40px', borderRadius: 30,
        border: '2px solid rgba(255,255,255,0.15)', background: 'transparent',
        color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
        fontFamily: 'var(--font-body)', letterSpacing: 1,
      }}>
        CANCEL SOS
      </button>

      <button onClick={onFire} style={{
        marginTop: 10, padding: '9px 28px', borderRadius: 30, border: 'none',
        background: 'linear-gradient(90deg,#991b1b,#ef4444)',
        color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'var(--font-body)',
      }}>
        Send Now →
      </button>
    </div>
  );
}

// ── Log Row ───────────────────────────────────────────────────────────────────
function LogRow({ item }: { item: LogItem }) {
  const icons: Record<LogType, string> = { drop: '📱', shake: '📳', sos: '🆘', cancelled: '✅' };
  const colors: Record<LogType, string> = { drop: '#f87171', shake: 'var(--amber)', sos: 'var(--red)', cancelled: 'var(--green)' };
  const age = Math.floor((Date.now() - item.time) / 1000);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-2)', marginBottom: 6 }}>
      <span style={{ fontSize: 18 }}>{icons[item.type]}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors[item.type] }}>{item.label}</div>
        {item.note && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{item.note}</div>}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>
        {age < 60 ? `${age}s ago` : `${Math.floor(age / 60)}m ago`}
      </div>
    </div>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, background: on ? 'var(--red)' : 'var(--border-2)', position: 'relative', cursor: 'pointer', transition: 'background 0.25s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MotionSOS({ onClose }: { onClose?: () => void }) {
  const [enabled, setEnabled]   = useState(false);
  const [permAsked, setPermAsked] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [trigger, setTrigger]   = useState<TriggerType | null>(null);
  const [log, setLog]           = useState<LogItem[]>([]);
  const [sosSent, setSosSent]   = useState(false);
  const [dropOn, setDropOn]     = useState(true);
  const [shakeOn, setShakeOn]   = useState(true);
  const [dropSens, setDropSens] = useState<'low'|'medium'|'high'>('medium');
  const [shakeSens, setShakeSens] = useState<'low'|'medium'|'high'>('medium');
  const [accel, setAccel]       = useState({ x: '0.0', y: '0.0', z: '0.0', mag: '0.0' });

  const countdownRef  = useRef<NodeJS.Timeout | null>(null);
  const freeFallRef   = useRef<number | null>(null);
  const lastAccelRef  = useRef({ x: 0, y: 0, z: 0 });
  const shakeTimesRef = useRef<number[]>([]);
  const accelTimer    = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((type: LogType, label: string, note = '') => {
    setLog(prev => [{ id: Date.now(), type, label, note, time: Date.now() }, ...prev.slice(0, 19)]);
  }, []);

  // ── Start countdown ──────────────────────────────────────────────────────
  const startCountdown = useCallback((type: TriggerType) => {
    if (countdownRef.current) return;
    haptic('error');
    setTrigger(type);
    setCountdown(COUNTDOWN_SEC);
    addLog(type, type === 'drop' ? 'Phone drop detected' : 'Shake detected', 'Countdown started…');

    let secs = COUNTDOWN_SEC;
    countdownRef.current = setInterval(() => {
      secs -= 1;
      setCountdown(secs);
      if (secs <= 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
        fireSOS(type);
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addLog]);

  const cancelCountdown = () => {
    clearInterval(countdownRef.current!);
    countdownRef.current = null;
    setCountdown(null);
    setTrigger(null);
    haptic('light');
    addLog('cancelled', 'SOS Cancelled', 'User cancelled the countdown');
  };

  const fireSOS = (type: TriggerType) => {
    setCountdown(null);
    setTrigger(null);
    setSosSent(true);
    haptic('error');
    addLog('sos', '🆘 SOS SENT!', `Triggered by ${type === 'drop' ? 'phone drop' : 'shake'}`);
    toast.error('SOS Sent!', 'Emergency contacts and nearby users notified');
    // 🔌 Production: call your SOS API here
    // fetch('/api/sos', { method: 'POST', body: JSON.stringify({ trigger: type, timestamp: new Date().toISOString() }) })
    setTimeout(() => setSosSent(false), 5000);
  };

  // ── Sensitivity thresholds ───────────────────────────────────────────────
  const dropThreshold = { low: FREE_FALL_THRESHOLD * 0.7, medium: FREE_FALL_THRESHOLD, high: FREE_FALL_THRESHOLD * 1.4 }[dropSens];
  const shakeThreshold = { low: SHAKE_THRESHOLD * 1.4, medium: SHAKE_THRESHOLD, high: SHAKE_THRESHOLD * 0.7 }[shakeSens];

  // ── Device motion handler ────────────────────────────────────────────────
  const handleMotion = useCallback((e: DeviceMotionEvent) => {
    if (!enabled) return;
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;
    const x = acc.x ?? 0, y = acc.y ?? 0, z = acc.z ?? 0;
    const mag = Math.sqrt(x * x + y * y + z * z);

    // Live display (throttled)
    clearTimeout(accelTimer.current!);
    accelTimer.current = setTimeout(() => {
      setAccel({ x: x.toFixed(1), y: y.toFixed(1), z: z.toFixed(1), mag: mag.toFixed(1) });
    }, 120);

    // Drop detection
    if (dropOn) {
      if (mag < dropThreshold) {
        if (!freeFallRef.current) freeFallRef.current = Date.now();
      } else {
        if (freeFallRef.current) {
          const elapsed = Date.now() - freeFallRef.current;
          if (elapsed < DROP_WINDOW_MS && mag > IMPACT_THRESHOLD && !countdownRef.current) {
            startCountdown('drop');
          }
          freeFallRef.current = null;
        }
      }
    }

    // Shake detection
    if (shakeOn) {
      const prev = lastAccelRef.current;
      const delta = Math.sqrt((x - prev.x) ** 2 + (y - prev.y) ** 2 + (z - prev.z) ** 2);
      lastAccelRef.current = { x, y, z };

      if (delta > shakeThreshold) {
        const now = Date.now();
        shakeTimesRef.current.push(now);
        shakeTimesRef.current = shakeTimesRef.current.filter(t => now - t < SHAKE_WINDOW_MS);
        if (shakeTimesRef.current.length >= SHAKE_COUNT_REQ && !countdownRef.current) {
          shakeTimesRef.current = [];
          startCountdown('shake');
        }
      }
    }
  }, [enabled, dropOn, shakeOn, dropThreshold, shakeThreshold, startCountdown]);

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('devicemotion', handleMotion as EventListener, { passive: true });
    return () => window.removeEventListener('devicemotion', handleMotion as EventListener);
  }, [enabled, handleMotion]);

  // ── Request permission (iOS 13+) ─────────────────────────────────────────
  const handleEnable = async () => {
    setPermAsked(true);
    
    // iOS 13+ requires explicit permission
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      const dme = window.DeviceMotionEvent as any;
      if (typeof dme?.requestPermission === 'function') {
        try {
          const res = await dme.requestPermission();
          if (res !== 'granted') {
            toast.error('Permission denied', 'Enable motion access in iOS Settings → Safari → Motion & Orientation');
            return;
          }
        } catch (e) {
          console.error('Motion permission error:', e);
        }
      }
    }
    
    setEnabled(true);
    addLog('shake', 'Motion detection ON', 'Listening for drop & shake events');
    toast.success('Motion SOS active', 'Listening for drops and shakes');
  };

  const handleDisable = () => {
    setEnabled(false);
    addLog('cancelled', 'Motion detection OFF', 'Manually disabled');
  };

  const simulateDrop  = () => { if (enabled && !countdownRef.current) startCountdown('drop'); };
  const simulateShake = () => { if (enabled && !countdownRef.current) startCountdown('shake'); };

  const magNum = parseFloat(accel.mag);

  return (
    <div style={{ background: 'var(--bg)', display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Countdown overlay */}
      {countdown !== null && trigger && (
        <SOSCountdown
          seconds={countdown}
          trigger={trigger}
          onCancel={cancelCountdown}
          onFire={() => { clearInterval(countdownRef.current!); countdownRef.current = null; fireSOS(trigger); }}
        />
      )}

      {/* SOS sent banner */}
      {sosSent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: 'var(--red)', padding: '12px', textAlign: 'center', fontWeight: 800, fontSize: 14, letterSpacing: 2, zIndex: 9998, fontFamily: 'var(--font-head)' }}>
          🆘 SOS SENT TO EMERGENCY CONTACTS
        </div>
      )}

      <div style={{ overflowY: 'auto', padding: '0 16px 100px', flex: 1 }}>

        {/* Header */}
        <div style={{ padding: '20px 0 16px', borderBottom: '1px solid var(--border-2)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 20 }}>📡</span>
                <span style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800 }}>Motion SOS</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Auto-SOS on phone drop &amp; shake</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: enabled ? 'var(--green)' : 'var(--text-3)', fontWeight: 700 }}>{enabled ? 'ON' : 'OFF'}</span>
              <Toggle on={enabled} onChange={enabled ? handleDisable : handleEnable} />
            </div>
          </div>

          {/* Status pill */}
          <div style={{ marginTop: 14, padding: '9px 14px', background: enabled ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${enabled ? 'rgba(239,68,68,0.2)' : 'var(--border-2)'}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: enabled ? 'var(--red)' : 'var(--border-2)', display: 'inline-block', boxShadow: enabled ? '0 0 8px rgba(239,68,68,0.7)' : 'none' }} />
            <span style={{ fontSize: 12, color: enabled ? '#f87171' : 'var(--text-3)', fontWeight: 600 }}>
              {enabled ? 'Listening for motion events…' : 'Tap ON to activate detection'}
            </span>
          </div>
        </div>

        {/* Live accelerometer */}
        {enabled && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-2)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10, letterSpacing: 1, fontWeight: 600, textTransform: 'uppercase' }}>Live Accelerometer (m/s²)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {([['X', accel.x, '#f87171'], ['Y', accel.y, 'var(--amber)'], ['Z', accel.z, '#60d4ff'], ['MAG', accel.mag, 'var(--green)']] as [string,string,string][]).map(([axis, val, color]) => (
                <div key={axis} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3 }}>{axis}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color }}>{val}</div>
                </div>
              ))}
            </div>
            {/* Magnitude bar */}
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 4, background: 'var(--border-2)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min((magNum / 30) * 100, 100)}%`, background: magNum > IMPACT_THRESHOLD ? 'var(--red)' : magNum < FREE_FALL_THRESHOLD ? 'var(--amber)' : 'var(--green)', borderRadius: 2, transition: 'width 0.1s, background 0.1s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>
                <span>free-fall</span><span>normal</span><span>impact</span>
              </div>
            </div>
          </div>
        )}

        {/* Drop card */}
        <div style={{ background: dropOn ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${dropOn ? 'rgba(239,68,68,0.2)' : 'var(--border-2)'}`, borderRadius: 16, padding: 16, marginBottom: 12, transition: 'all 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: dropOn ? 14 : 0 }}>
            <span style={{ fontSize: 20, marginRight: 10 }}>📱</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Phone Drop Detection</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Free-fall + impact spike triggers SOS</div>
            </div>
            <Toggle on={dropOn} onChange={() => setDropOn(v => !v)} />
          </div>
          {dropOn && (
            <>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Sensitivity</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {(['low','medium','high'] as const).map(s => (
                  <button key={s} onClick={() => setDropSens(s)} style={{ flex: 1, padding: '5px 0', borderRadius: 8, border: `1px solid ${dropSens === s ? 'rgba(239,68,68,0.5)' : 'var(--border-2)'}`, background: dropSens === s ? 'rgba(239,68,68,0.15)' : 'transparent', color: dropSens === s ? '#f87171' : 'var(--text-3)', fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'var(--font-body)' }}>{s}</button>
                ))}
              </div>
              <button onClick={simulateDrop} disabled={!enabled} style={{ width: '100%', padding: '8px', borderRadius: 10, border: '1px dashed rgba(239,68,68,0.3)', background: 'transparent', color: enabled ? '#f87171' : 'var(--text-3)', fontSize: 12, fontWeight: 600, cursor: enabled ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)' }}>
                {enabled ? '▶ Simulate Drop' : 'Enable detection first'}
              </button>
            </>
          )}
        </div>

        {/* Shake card */}
        <div style={{ background: shakeOn ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${shakeOn ? 'rgba(239,68,68,0.2)' : 'var(--border-2)'}`, borderRadius: 16, padding: 16, marginBottom: 12, transition: 'all 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: shakeOn ? 14 : 0 }}>
            <span style={{ fontSize: 20, marginRight: 10 }}>📳</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Panic Shake Detection</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Shake {SHAKE_COUNT_REQ}× rapidly to trigger SOS</div>
            </div>
            <Toggle on={shakeOn} onChange={() => setShakeOn(v => !v)} />
          </div>
          {shakeOn && (
            <>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Sensitivity</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {(['low','medium','high'] as const).map(s => (
                  <button key={s} onClick={() => setShakeSens(s)} style={{ flex: 1, padding: '5px 0', borderRadius: 8, border: `1px solid ${shakeSens === s ? 'rgba(239,68,68,0.5)' : 'var(--border-2)'}`, background: shakeSens === s ? 'rgba(239,68,68,0.15)' : 'transparent', color: shakeSens === s ? '#f87171' : 'var(--text-3)', fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'var(--font-body)' }}>{s}</button>
                ))}
              </div>
              <button onClick={simulateShake} disabled={!enabled} style={{ width: '100%', padding: '8px', borderRadius: 10, border: '1px dashed rgba(239,68,68,0.3)', background: 'transparent', color: enabled ? '#f87171' : 'var(--text-3)', fontSize: 12, fontWeight: 600, cursor: enabled ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)' }}>
                {enabled ? '▶ Simulate Shake' : 'Enable detection first'}
              </button>
            </>
          )}
        </div>

        {/* Countdown info */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-2)', borderRadius: 14, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>⏱ SOS Countdown: {COUNTDOWN_SEC} seconds</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>You have {COUNTDOWN_SEC}s to cancel after detection. SOS fires automatically if ignored.</div>
        </div>

        {/* iOS note */}
        {!permAsked && (
          <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 16, fontSize: 11, color: 'var(--amber)' }}>
            <strong>📋 iOS users:</strong> The app will request permission to access motion sensors when you tap ON. Android needs no permission.
          </div>
        )}

        {/* Event log */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Event Log</div>
            {log.length > 0 && (
              <button onClick={() => setLog([])} style={{ fontSize: 11, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Clear</button>
            )}
          </div>
          {log.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-3)', fontSize: 12 }}>
              No events yet — enable detection and try shaking the device
            </div>
          ) : (
            log.map(item => <LogRow key={item.id} item={item} />)
          )}
        </div>
      </div>
    </div>
  );
}
