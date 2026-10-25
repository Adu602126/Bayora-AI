'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { haptic } from '@/hooks/useHaptics';
import { toast } from '@/components/Toast';

// ── Types ────────────────────────────────────────────────────────────────────
interface NearbyUser {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  online: boolean;
}

interface IncomingAlert {
  id: string;
  senderName: string;
  message: string;
  distance: number;
  location: string;
  timestamp: number;
}

// ── Simulate nearby users (replace with Firebase Realtime DB in prod) ────────
function generateNearbyUsers(myLat: number, myLon: number): NearbyUser[] {
  const names = ['Priya S.', 'Ananya R.', 'Neha K.', 'Divya M.', 'Sneha P.', 'Riya T.'];
  return names.map((name, i) => {
    const angle = (i / names.length) * 2 * Math.PI;
    const dist = 100 + Math.random() * 400;
    const dLat = (dist * Math.cos(angle)) / 111320;
    const dLon = (dist * Math.sin(angle)) / (111320 * Math.cos((myLat * Math.PI) / 180));
    return {
      id: `user_${i}`,
      name,
      lat: myLat + dLat,
      lon: myLon + dLon,
      distance: Math.round(dist),
      online: Math.random() > 0.3,
    };
  });
}

// ── Alert Card ───────────────────────────────────────────────────────────────
function AlertCard({ alert, onRespond }: { alert: IncomingAlert; onRespond: (id: string, action: string) => void }) {
  const [responded, setResponded] = useState(false);
  const age = Math.floor((Date.now() - alert.timestamp) / 1000);

  const respond = (action: string) => {
    if (responded) return;
    haptic('warning');
    setResponded(true);
    onRespond(alert.id, action);
    toast.success('Response sent', action === 'onMyWay' ? "You're on your way 🏃" : 'Police alerted 📞');
  };

  return (
    <div style={{
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 16,
      padding: '16px',
      marginBottom: 12,
      animation: 'fade-in-up 0.4s ease',
    }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg,#ef4444,#f87171)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>🆘</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{alert.senderName}</span>
            <span style={{ fontSize: 11, color: '#f87171' }}>
              {age < 60 ? `${age}s ago` : `${Math.floor(age / 60)}m ago`}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>{alert.message}</div>
          <div style={{ fontSize: 12, color: '#ef4444' }}>📍 {alert.distance}m away · {alert.location}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={() => respond('onMyWay')}
              disabled={responded}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none',
                background: responded ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg,#ef4444,#f87171)',
                color: '#fff', fontSize: 12, fontWeight: 600,
                cursor: responded ? 'default' : 'pointer',
              }}
            >
              {responded ? '✓ Responded' : '🏃 On My Way'}
            </button>
            <button
              onClick={() => respond('calledPolice')}
              disabled={responded}
              style={{
                padding: '6px 14px', borderRadius: 20,
                border: '1px solid rgba(239,68,68,0.4)',
                background: 'transparent', color: '#f87171',
                fontSize: 12, fontWeight: 600,
                cursor: responded ? 'default' : 'pointer',
              }}
            >
              📞 Call Police
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function CommunityAlert({ onClose }: { onClose?: () => void }) {
  const [myLocation, setMyLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [incomingAlerts, setIncomingAlerts] = useState<IncomingAlert[]>([]);
  const [alertSent, setAlertSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'alert' | 'nearby' | 'incoming'>('alert');
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const onlineCount = nearbyUsers.filter(u => u.online).length;

  // ── Get location ─────────────────────────────────────────────────────────
  const getLocation = useCallback(() => {
    setLocating(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      const fb = { lat: 22.7196, lon: 75.8577 };
      setMyLocation(fb);
      setNearbyUsers(generateNearbyUsers(fb.lat, fb.lon));
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setMyLocation(loc);
        setNearbyUsers(generateNearbyUsers(loc.lat, loc.lon));
        setLocating(false);
      },
      () => {
        const fb = { lat: 22.7196, lon: 75.8577 };
        setMyLocation(fb);
        setNearbyUsers(generateNearbyUsers(fb.lat, fb.lon));
        setLocationError('Using demo location (Indore). Enable GPS for real alerts.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => { getLocation(); }, [getLocation]);

  // ── Simulate demo incoming alert after 6s ─────────────────────────────────
  useEffect(() => {
    if (!myLocation) return;
    const t = setTimeout(() => {
      setIncomingAlerts(prev => [{
        id: 'demo_1',
        senderName: 'Priya S.',
        message: 'Feeling followed near the market. Need help!',
        distance: 280,
        location: 'Near Rajwada Market',
        timestamp: Date.now(),
      }, ...prev]);
    }, 6000);
    return () => clearTimeout(t);
  }, [myLocation]);

  // ── Send SOS to nearby users ──────────────────────────────────────────────
  const sendAlert = () => {
    if (!myLocation || sending || alertSent) return;
    haptic('error');
    setSending(true);
    setCountdown(3);

    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c === null || c <= 1) {
          clearInterval(countdownRef.current!);
          // 🔌 Production: POST to /api/community-alert or Firebase Realtime DB
          // fetch('/api/community-alert', { method: 'POST', body: JSON.stringify({ ...myLocation, message: customMessage || 'I need help!' }) })
          setSending(false);
          setAlertSent(true);
          toast.warning('SOS Broadcast!', `Notified ${onlineCount} nearby users`);
          return null;
        }
        return c - 1;
      });
    }, 1000);
  };

  const cancelSend = () => {
    clearInterval(countdownRef.current!);
    setSending(false);
    setCountdown(null);
    haptic('light');
  };

  const TABS: { key: 'alert' | 'nearby' | 'incoming'; label: string }[] = [
    { key: 'alert', label: 'Send SOS' },
    { key: 'nearby', label: 'Nearby' },
    { key: 'incoming', label: `Alerts${incomingAlerts.length > 0 ? ` (${incomingAlerts.length})` : ''}` },
  ];

  return (
    <div style={{
      background: 'var(--bg)',
      borderRadius: 20,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '85vh',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 0',
        background: 'linear-gradient(180deg, rgba(239,68,68,0.1) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(239,68,68,0.15)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 20 }}>🛡️</span>
              <span style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800 }}>Community Alert</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              Alerts SafePath users within <strong style={{ color: '#ef4444' }}>500 m</strong>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
          )}
        </div>

        {/* Location bar */}
        <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          {locating ? (
            <span style={{ color: 'var(--text-3)' }}>⏳ Getting your location…</span>
          ) : myLocation ? (
            <>
              <span style={{ color: 'var(--green)', fontSize: 8 }}>●</span>
              <span style={{ color: 'var(--text-2)' }}>{myLocation.lat.toFixed(4)}, {myLocation.lon.toFixed(4)}</span>
              <span style={{ marginLeft: 'auto', background: 'rgba(34,197,94,0.12)', color: 'var(--green)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                {onlineCount} online nearby
              </span>
            </>
          ) : (
            <button onClick={getLocation} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>Tap to enable location →</button>
          )}
        </div>
        {locationError && <div style={{ fontSize: 11, color: 'var(--amber)', paddingLeft: 4, marginBottom: 10 }}>⚠ {locationError}</div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, paddingBottom: 0 }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '7px 14px', borderRadius: '12px 12px 0 0', border: 'none',
                background: activeTab === tab.key ? 'rgba(239,68,68,0.15)' : 'transparent',
                color: activeTab === tab.key ? '#ef4444' : 'var(--text-3)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer',
                borderBottom: activeTab === tab.key ? '2px solid #ef4444' : '2px solid transparent',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-body)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ overflowY: 'auto', padding: 20, flex: 1 }}>

        {/* ── TAB: SEND SOS ──────────────────────────────────────────────── */}
        {activeTab === 'alert' && (
          <div>
            {/* Big SOS button */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 24px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {alertSent && [1, 2, 3].map(i => (
                  <div key={i} style={{
                    position: 'absolute',
                    width: 120 + i * 36, height: 120 + i * 36,
                    borderRadius: '50%', border: '2px solid rgba(239,68,68,0.25)',
                    animation: `teal-pulse ${1.5 + i * 0.3}s ease-out ${i * 0.3}s infinite`,
                    opacity: 0.6,
                  }} />
                ))}
                <button
                  onClick={sending ? cancelSend : sendAlert}
                  disabled={!myLocation || alertSent}
                  style={{
                    width: 120, height: 120, borderRadius: '50%', border: 'none',
                    background: alertSent
                      ? 'linear-gradient(135deg,#14532d,#22c55e)'
                      : sending
                      ? 'linear-gradient(135deg,#7f1d1d,#dc2626)'
                      : 'linear-gradient(135deg,#991b1b,#ef4444)',
                    color: '#fff', fontFamily: 'var(--font-head)',
                    fontWeight: 900, fontSize: sending ? 34 : 20,
                    cursor: alertSent ? 'default' : 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: alertSent
                      ? '0 0 30px rgba(34,197,94,0.5)'
                      : '0 0 30px rgba(239,68,68,0.45)',
                    animation: alertSent || sending ? 'none' : 'sos-pulse 2s ease-in-out infinite',
                  }}
                >
                  {alertSent ? (
                    <><span style={{ fontSize: 26 }}>✓</span><span style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>SENT!</span></>
                  ) : sending ? (
                    <span>{countdown}</span>
                  ) : (
                    <><span>SOS</span><span style={{ fontSize: 9, fontWeight: 600, opacity: 0.85, letterSpacing: 1 }}>TAP</span></>
                  )}
                </button>
              </div>
            </div>

            {sending && (
              <div style={{ textAlign: 'center', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
                Sending in {countdown}s…{' '}
                <button onClick={cancelSend} style={{ color: 'var(--text-2)', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '2px 10px', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
              </div>
            )}

            {alertSent && (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: 14 }}>✅ Alert Broadcast Successful</div>
                <div style={{ color: 'var(--text-2)', fontSize: 12, marginTop: 4 }}>
                  Notified <strong>{onlineCount} users</strong> within 500 m. They can see your position and respond.
                </div>
                <button onClick={() => setAlertSent(false)} style={{ marginTop: 10, padding: '5px 14px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.3)', background: 'transparent', color: 'var(--green)', fontSize: 12, cursor: 'pointer' }}>
                  Send Another
                </button>
              </div>
            )}

            {/* Custom message */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>Custom message (optional)</div>
              <textarea
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="I need help! Someone is following me near..."
                rows={2}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-2)', borderRadius: 10,
                  padding: '10px 12px', color: 'var(--text)', fontSize: 13,
                  resize: 'none', outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>

            {/* Quick presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {["I'm being followed", "I feel unsafe", "Need help now", "Suspicious person nearby"].map(msg => (
                <button
                  key={msg}
                  onClick={() => setCustomMessage(msg)}
                  style={{
                    padding: '5px 12px', borderRadius: 14,
                    border: `1px solid ${customMessage === msg ? 'rgba(239,68,68,0.5)' : 'var(--border-2)'}`,
                    background: customMessage === msg ? 'rgba(239,68,68,0.1)' : 'transparent',
                    color: customMessage === msg ? '#f87171' : 'var(--text-3)',
                    fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}
                >
                  {msg}
                </button>
              ))}
            </div>

            {/* How it works */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border-2)' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-2)', marginBottom: 10, letterSpacing: '0.5px', textTransform: 'uppercase' }}>How it works</div>
              {[
                ['📍', 'Your GPS location is captured'],
                ['📡', 'SafePath users within 500 m are notified'],
                ['🏃', 'Nearby users can respond or call police'],
                ['🔒', 'Location only shared during active alert'],
              ].map(([icon, text]) => (
                <div key={text as string} style={{ display: 'flex', gap: 10, marginBottom: 7, fontSize: 12, color: 'var(--text-3)' }}>
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: NEARBY ───────────────────────────────────────────────── */}
        {activeTab === 'nearby' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>
              {nearbyUsers.length} users within 500 m · {onlineCount} online
            </div>

            {/* Radar visual */}
            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 14, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              <svg width="70" height="70" viewBox="0 0 70 70">
                {[30, 20, 10].map((r, i) => <circle key={i} cx="35" cy="35" r={r} fill="none" stroke={`rgba(239,68,68,${0.15 + i * 0.08})`} strokeWidth="1" strokeDasharray={i === 1 ? '4 3' : undefined} />)}
                <circle cx="35" cy="35" r="4" fill="#ef4444" />
                {nearbyUsers.slice(0, 5).map((u, i) => {
                  const angle = (i / 5) * 2 * Math.PI - Math.PI / 2;
                  const r = 12 + (u.distance / 500) * 18;
                  return <circle key={u.id} cx={35 + r * Math.cos(angle)} cy={35 + r * Math.sin(angle)} r="3" fill={u.online ? '#22c55e' : '#4b5563'} />;
                })}
              </svg>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>500 m Radius Active</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Green = online · can receive alert</div>
                <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>● {onlineCount} can respond now</div>
              </div>
            </div>

            {nearbyUsers.map(user => (
              <div key={user.id} style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', borderRadius: 12, marginBottom: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-2)' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: `hsl(${user.id.charCodeAt(5) * 22 % 360},55%,40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, marginRight: 12, flexShrink: 0 }}>
                  {user.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{user.distance} m away</div>
                </div>
                <div style={{ fontSize: 11, color: user.online ? 'var(--green)' : 'var(--text-3)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: user.online ? 'var(--green)' : 'var(--border-2)', display: 'inline-block' }} />
                  {user.online ? 'Online' : 'Offline'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: INCOMING ─────────────────────────────────────────────── */}
        {activeTab === 'incoming' && (
          <div>
            {incomingAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
                <div style={{ fontSize: 14 }}>No alerts nearby right now</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>You&apos;ll be notified when someone nearby needs help</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: '#f87171', marginBottom: 14 }}>
                  ⚠ {incomingAlerts.length} active alert{incomingAlerts.length > 1 ? 's' : ''} near you
                </div>
                {incomingAlerts.map(alert => (
                  <AlertCard key={alert.id} alert={alert} onRespond={(id, action) => {
                    console.log(`[CommunityAlert] Responded to ${id}: ${action}`);
                  }} />
                ))}
              </>
            )}

            <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Receive Community Alerts</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Alerts from users within 500 m</div>
              </div>
              <div style={{ width: 40, height: 22, borderRadius: 11, background: 'linear-gradient(90deg,#991b1b,#ef4444)', position: 'relative', cursor: 'pointer' }}>
                <div style={{ position: 'absolute', right: 3, top: 3, width: 16, height: 16, borderRadius: '50%', background: '#fff' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes sos-pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 55px rgba(239,68,68,0.75); }
        }
      `}</style>
    </div>
  );
}
