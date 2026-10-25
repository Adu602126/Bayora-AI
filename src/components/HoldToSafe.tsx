'use client';
import { useState, useRef, useEffect } from 'react';
import { ShieldAlert, Fingerprint, X, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/Toast';
import { haptic } from '@/hooks/useHaptics';

interface HoldToSafeProps {
  onTriggerSOS: () => void;
  onClose: () => void;
}

export default function HoldToSafe({ onTriggerSOS, onClose }: HoldToSafeProps) {
  const [holding, setHolding] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [armed, setArmed] = useState(false);
  
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // When countdown is active
  useEffect(() => {
    if (countdown !== null) {
      if (countdown <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        onTriggerSOS();
        onClose();
        return;
      }

      // Vibrate hard on every second of countdown
      haptic('error');
      
      countdownTimerRef.current = setTimeout(() => {
        setCountdown(c => (c !== null ? c - 1 : null));
      }, 1000);
    }
    return () => { if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current); };
  }, [countdown, onTriggerSOS, onClose]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (countdown !== null) return; // ignore if already counting down
    
    setHolding(true);
    haptic('light');
    
    // Require holding for 1 second to "arm" the system
    holdTimerRef.current = setTimeout(() => {
      setArmed(true);
      haptic('success');
      toast.info('Guardian Armed', 'Keep holding. Release to trigger 5s SOS countdown.');
    }, 1000);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    setHolding(false);
    
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    
    if (armed && countdown === null) {
      // User released after arming -> Trigger dead man's switch
      setCountdown(5);
    } else {
      setArmed(false);
    }
  };

  const handleCancel = () => {
    setCountdown(null);
    setArmed(false);
    setHolding(false);
    haptic('success');
    toast.success('Disarmed', 'SOS cancelled successfully.');
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: countdown !== null 
        ? 'linear-gradient(180deg, #dc2626 0%, #7f1d1d 100%)' 
        : 'linear-gradient(180deg, rgba(8,13,24,0.98) 0%, rgba(14,22,40,0.98) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, backdropFilter: 'blur(10px)',
      animation: 'fadeIn 0.2s ease',
      transition: 'background 0.3s ease',
    }}>
      {countdown === null && (
        <button onClick={onClose} style={{
          position: 'absolute', top: 24, right: 24,
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', cursor: 'pointer',
        }}>
          <X size={20} />
        </button>
      )}

      {/* Header Info */}
      <div style={{ textAlign: 'center', marginBottom: 60, transition: 'opacity 0.2s', opacity: countdown !== null ? 0 : 1 }}>
        <ShieldAlert size={32} color="var(--teal)" style={{ marginBottom: 16 }} />
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Dead Man&apos;s Switch
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 280 }}>
          Press and hold the button below while walking. If your phone is dropped or snatched, SOS will auto-trigger.
        </div>
      </div>

      {/* Main interaction button */}
      {countdown === null ? (
        <div style={{ position: 'relative' }}>
          {/* Animated rings when armed/holding */}
          {holding && [1, 2, 3].map(i => (
            <div key={i} style={{
              position: 'absolute', inset: `-${i * 20}px`, borderRadius: '50%',
              border: `2px solid ${armed ? 'var(--teal)' : 'rgba(255,255,255,0.2)'}`,
              animation: `ring-expand 1.5s ease-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }} />
          ))}
          
          <div
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{
              width: 140, height: 140, borderRadius: '50%',
              background: armed 
                ? 'linear-gradient(135deg, #0d9488, #14b8a6)' 
                : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.1))',
              border: `4px solid ${armed ? '#fff' : 'rgba(255,255,255,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', zIndex: 10,
              boxShadow: armed ? '0 0 40px rgba(20,184,166,0.5)' : 'none',
              transform: holding ? 'scale(0.95)' : 'scale(1)',
              transition: 'all 0.2s',
              touchAction: 'none', // Prevent scrolling while holding
            }}
          >
            <Fingerprint size={64} color={armed ? '#fff' : 'var(--text-2)'} />
          </div>
          <div style={{
            position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)',
            fontSize: 13, fontWeight: 700, color: armed ? 'var(--teal)' : 'var(--text-3)',
            whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 1,
            transition: 'color 0.2s',
          }}>
            {armed ? 'Guardian Active' : holding ? 'Hold to Arm...' : 'Press & Hold'}
          </div>
        </div>
      ) : (
        /* Countdown State */
        <div style={{ textAlign: 'center', width: '100%', animation: 'fadeInScale 0.3s ease' }}>
          <AlertTriangle size={64} color="#fff" style={{ marginBottom: 24, animation: 'ping 1s infinite' }} />
          <div style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 2 }}>
            Switch Released
          </div>
          <div style={{
            fontFamily: 'var(--font-head)', fontSize: 120, fontWeight: 900,
            color: '#fff', lineHeight: 1, margin: '20px 0', textShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {countdown}
          </div>
          <div style={{ fontSize: 16, color: '#fff', marginBottom: 40 }}>
            Sending SOS in {countdown} seconds!
          </div>

          <button onClick={handleCancel} style={{
            width: '100%', maxWidth: 300, padding: '18px',
            background: '#fff', color: '#dc2626',
            border: 'none', borderRadius: 16, cursor: 'pointer',
            fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            I am Safe (Cancel)
          </button>
        </div>
      )}

      <style>{`
        @keyframes ring-expand {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
