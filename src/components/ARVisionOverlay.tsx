'use client';
import { useEffect, useRef, useState } from 'react';
import { X, ShieldCheck, AlertTriangle, Building, MapPin, Mic } from 'lucide-react';
import { haptic } from '@/hooks/useHaptics';

interface ARVisionOverlayProps {
  onClose: () => void;
}

// Simulated AR POIs (Points of Interest)
const AR_POIS = [
  { id: '1', type: 'safe', title: '24/7 Pharmacy', distance: '120m', xOffset: -20, yOffset: -10, icon: Building, color: '#10b981' },
  { id: '2', type: 'police', title: 'Police Booth', distance: '300m', xOffset: 35, yOffset: 5, icon: ShieldCheck, color: '#3b82f6' },
  { id: '3', type: 'danger', title: 'Unlit Alleyway', distance: '50m', xOffset: 15, yOffset: -25, icon: AlertTriangle, color: '#ef4444' },
];

const DE_ESCALATION_SCRIPTS = [
  "I'm on a live video call with my brother right now.",
  "My dad is a police officer, he's picking me up here in 2 mins.",
  "Please step back, my location is currently tracking live.",
];

export default function ARVisionOverlay({ onClose }: ARVisionOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scriptIdx, setScriptIdx] = useState(0);
  const [scanning, setScanning] = useState(true);

  // Device orientation state to simulate parallax/AR panning
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const baseGamma = useRef<number | null>(null);

  useEffect(() => {
    // Start Camera
    navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    })
    .then(s => {
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    })
    .catch(err => {
      console.error("Camera access denied:", err);
    });

    // Simulated Scanning phase
    setTimeout(() => {
      setScanning(false);
      haptic('success');
    }, 2500);

    // Orientation Listener
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (baseGamma.current === null && event.gamma !== null) {
        baseGamma.current = event.gamma;
      }
      setOrientation({
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0,
      });
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    onClose();
  };

  const nextScript = () => {
    haptic('light');
    setScriptIdx(prev => (prev + 1) % DE_ESCALATION_SCRIPTS.length);
  };

  // Calculate simulated parallax offset
  const diffGamma = baseGamma.current !== null ? orientation.gamma - baseGamma.current : 0;
  const parallaxX = diffGamma * 2; // Multiplier for movement

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 4000, background: '#000', overflow: 'hidden'
    }}>
      {/* Camera Feed */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted 
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          filter: scanning ? 'blur(4px) grayscale(50%)' : 'none',
          transition: 'filter 0.5s',
        }}
      />

      {/* AR Viewport Overlay Container */}
      <div style={{ position: 'absolute', inset: 0 }}>
        
        {/* Top Header */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, padding: '40px 20px 20px',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              AR Vision
            </div>
            <div style={{ fontSize: 12, color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="live-dot" style={{ width: 8, height: 8, background: '#34d399', borderRadius: '50%' }} /> Active Environment Mapping
            </div>
          </div>
          <button onClick={cleanup} style={{
            width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            backdropFilter: 'blur(10px)', cursor: 'pointer',
          }}>
            <X size={24} />
          </button>
        </div>

        {/* Scanning Overlay */}
        {scanning && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 150, height: 150, border: '2px solid rgba(52,211,153,0.5)',
              borderRadius: '50%', animation: 'spin 3s linear infinite',
              borderTopColor: '#34d399', borderRightColor: '#34d399',
            }} />
            <div style={{ marginTop: 20, color: '#34d399', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
              Analyzing Surroundings...
            </div>
          </div>
        )}

        {/* AR Markers */}
        {!scanning && AR_POIS.map(poi => {
          const Icon = poi.icon;
          // Apply parallax shifting
          const leftPos = 50 + poi.xOffset - parallaxX;
          const topPos = 50 + poi.yOffset;
          
          return (
            <div key={poi.id} className="ar-marker fade-in-scale" style={{
              position: 'absolute', left: `${leftPos}%`, top: `${topPos}%`,
              transform: 'translate(-50%, -50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              transition: 'left 0.1s ease-out, top 0.1s ease-out',
            }}>
              {/* Distance Tag */}
              <div style={{
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800,
                color: '#fff', border: `1px solid ${poi.color}`, marginBottom: 6,
                boxShadow: `0 0 10px ${poi.color}88`,
              }}>
                {poi.distance}
              </div>
              
              {/* Icon Bubble */}
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `radial-gradient(circle, ${poi.color}cc 0%, ${poi.color}44 100%)`,
                border: `2px solid ${poi.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 20px ${poi.color}`, animation: 'livePulse 2s infinite',
              }}>
                <Icon size={24} color="#fff" />
              </div>
              
              {/* Title Tag */}
              <div style={{
                marginTop: 6, background: 'rgba(0,0,0,0.7)', padding: '4px 10px',
                borderRadius: 4, color: '#fff', fontSize: 12, fontWeight: 700,
                textAlign: 'center', whiteSpace: 'nowrap', textShadow: '0 1px 2px #000',
              }}>
                {poi.title}
              </div>
            </div>
          );
        })}

        {/* HUD Elements (Crosshairs) */}
        {!scanning && (
          <div style={{
            position: 'absolute', inset: '10%', border: '1px solid rgba(255,255,255,0.1)',
            pointerEvents: 'none', borderRadius: 20,
          }}>
            <div style={{ position: 'absolute', top: -1, left: -1, width: 20, height: 20, borderTop: '2px solid rgba(255,255,255,0.5)', borderLeft: '2px solid rgba(255,255,255,0.5)' }} />
            <div style={{ position: 'absolute', top: -1, right: -1, width: 20, height: 20, borderTop: '2px solid rgba(255,255,255,0.5)', borderRight: '2px solid rgba(255,255,255,0.5)' }} />
            <div style={{ position: 'absolute', bottom: -1, left: -1, width: 20, height: 20, borderBottom: '2px solid rgba(255,255,255,0.5)', borderLeft: '2px solid rgba(255,255,255,0.5)' }} />
            <div style={{ position: 'absolute', bottom: -1, right: -1, width: 20, height: 20, borderBottom: '2px solid rgba(255,255,255,0.5)', borderRight: '2px solid rgba(255,255,255,0.5)' }} />
          </div>
        )}

        {/* De-escalation Scripts Panel */}
        {!scanning && (
          <div style={{
            position: 'absolute', bottom: 30, left: 20, right: 20,
            background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99,102,241,0.5)', borderRadius: 20,
            padding: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            animation: 'fadeInUp 0.5s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Mic size={16} color="#a5b4fc" />
              <div style={{ fontSize: 12, fontWeight: 800, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: 1 }}>
                De-escalation Script
              </div>
            </div>
            
            <div style={{
              fontSize: 18, color: '#fff', fontWeight: 600, lineHeight: 1.4,
              fontFamily: 'var(--font-head)', marginBottom: 16,
            }}>
              &quot;{DE_ESCALATION_SCRIPTS[scriptIdx]}&quot;
            </div>
            
            <button onClick={nextScript} style={{
              width: '100%', padding: '12px', borderRadius: 12,
              background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
              color: '#c7d2fe', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              Next Phrase
            </button>
          </div>
        )}
      </div>

      <style>{`
        .live-dot { animation: pulseAlpha 1.5s infinite; }
        @keyframes pulseAlpha { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}
