'use client';
import { useState, useEffect, useRef } from 'react';
import { Mic, ShieldAlert, X, Activity, Volume2 } from 'lucide-react';
import { toast } from '@/components/Toast';
import { haptic } from '@/hooks/useHaptics';
import HoldToSafe from '@/components/HoldToSafe'; // We will use the Dead Man's switch countdown

interface AcousticGuardianProps {
  onClose: () => void;
  onTriggerSOS: () => void;
}

export default function AcousticGuardian({ onClose, onTriggerSOS }: AcousticGuardianProps) {
  const [listening, setListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [threshold] = useState(85); // 85% volume threshold for "scream"
  const [triggered, setTriggered] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);
  const triggerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      
      setListening(true);
      haptic('success');
      toast.success('Acoustic Guardian Active', 'Listening for screams or sudden loud noises.');
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const avg = sum / bufferLength;
        const volPercent = Math.min(100, Math.round((avg / 255) * 100 * 1.5)); // Boost multiplier
        
        setVolume(volPercent);
        
        if (volPercent > threshold) {
          if (!triggerTimeoutRef.current) {
            triggerTimeoutRef.current = setTimeout(() => {
              // Sustained loud noise detected!
              haptic('error');
              setTriggered(true);
              stopListening();
            }, 800); // Must be loud for 800ms to avoid false positives like a door slam
          }
        } else {
          if (triggerTimeoutRef.current) {
            clearTimeout(triggerTimeoutRef.current);
            triggerTimeoutRef.current = null;
          }
        }
        
        requestRef.current = requestAnimationFrame(checkVolume);
      };
      
      checkVolume();
    } catch (err) {
      console.error(err);
      toast.error('Microphone Access Denied', 'Please allow microphone access to use this feature.');
    }
  };

  const stopListening = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    setListening(false);
  };

  useEffect(() => {
    return () => stopListening();
  }, []);

  // If triggered, we mount the HoldToSafe dead-man switch countdown UI to handle the 5-sec warning
  if (triggered) {
    return (
      <HoldToSafe 
        onTriggerSOS={onTriggerSOS} 
        onClose={() => { setTriggered(false); onClose(); }} 
      />
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'linear-gradient(180deg, rgba(8,13,24,0.98) 0%, rgba(20,10,25,0.98) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, backdropFilter: 'blur(10px)',
      animation: 'fadeIn 0.3s ease',
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: 24, right: 24,
        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', cursor: 'pointer',
      }}>
        <X size={20} />
      </button>

      {/* Header Info */}
      <div style={{ textAlign: 'center', marginBottom: 50 }}>
        <Activity size={32} color="#a78bfa" style={{ marginBottom: 16 }} />
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#a78bfa' }}>
          Acoustic Guardian
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 300 }}>
          AI-driven ambient sound analysis. If a scream or sharp impact is detected, SOS will auto-trigger immediately.
        </div>
      </div>

      {/* Radar / Volume visualizer */}
      <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
        
        {/* Dynamic pulsing based on volume */}
        {listening && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: `rgba(167, 139, 250, ${volume / 200})`,
            transform: `scale(${1 + (volume / 100) * 1.5})`,
            transition: 'transform 0.1s ease-out, background 0.1s ease-out',
            boxShadow: `0 0 ${volume}px rgba(167, 139, 250, 0.4)`,
          }} />
        )}

        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: listening ? 'linear-gradient(135deg, #7c3aed, #a78bfa)' : 'rgba(255,255,255,0.05)',
          border: `2px solid ${listening ? '#a78bfa' : 'rgba(255,255,255,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', zIndex: 10,
          boxShadow: listening ? '0 0 30px rgba(167, 139, 250, 0.5)' : 'none',
        }}>
          {listening ? <Activity size={48} color="#fff" /> : <Mic size={48} color="var(--text-3)" />}
        </div>
      </div>

      {/* Volume Bar */}
      {listening && (
        <div style={{ width: '100%', maxWidth: 280, marginBottom: 40, animation: 'fadeInUp 0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>
            <span>Ambient Noise</span>
            <span style={{ color: volume > threshold ? '#ef4444' : '#a78bfa' }}>{volume}%</span>
          </div>
          <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 0, bottom: 0, left: 0, width: `${volume}%`,
              background: volume > threshold ? '#ef4444' : 'linear-gradient(90deg, #8b5cf6, #c084fc)',
              transition: 'width 0.1s ease-out, background 0.2s',
            }} />
            {/* Threshold marker */}
            <div style={{ position: 'absolute', top: -2, bottom: -2, left: `${threshold}%`, width: 2, background: '#ef4444', boxShadow: '0 0 4px #ef4444' }} />
          </div>
        </div>
      )}

      {/* Control Button */}
      <button 
        onClick={listening ? stopListening : startListening} 
        style={{
          width: '100%', maxWidth: 300, padding: '16px',
          background: listening ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #7c3aed, #a78bfa)',
          color: listening ? '#ef4444' : '#fff',
          border: listening ? '1px solid rgba(239,68,68,0.3)' : 'none',
          borderRadius: 16, cursor: 'pointer',
          fontSize: 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: listening ? 'none' : '0 8px 32px rgba(139,92,246,0.35)',
        }}
      >
        {listening ? <><X size={20} /> Deactivate Guardian</> : <><Volume2 size={20} /> Arm Acoustic SOS</>}
      </button>

    </div>
  );
}
