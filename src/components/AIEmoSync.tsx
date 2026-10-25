'use client';
import { useState, useEffect } from 'react';
import { Activity, HeartPulse, Mic, BrainCircuit, X, MessageCircleHeart, AlertCircle } from 'lucide-react';
import { haptic } from '@/hooks/useHaptics';
import { toast } from '@/components/Toast';

interface AIEmoSyncProps {
  onClose: () => void;
}

export default function AIEmoSync({ onClose }: AIEmoSyncProps) {
  const [step, setStep] = useState(1);
  const [bpm, setBpm] = useState(82);
  const [isListening, setIsListening] = useState(false);
  const [analysis, setAnalysis] = useState('');

  // Simulate heart rate fluctuation and sudden spike (Anxiety pattern)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 1 || step === 2) {
      interval = setInterval(() => {
        setBpm(prev => {
          // Slow rise if step 2 (anxiety simulation)
          if (step === 2 && prev < 115) return prev + Math.floor(Math.random() * 5);
          // Normal fluctuation
          const variance = Math.floor(Math.random() * 5) - 2;
          return Math.max(70, Math.min(120, prev + variance));
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleMicClick = () => {
    haptic('medium');
    setIsListening(true);
    setAnalysis('');
    
    // Simulate listening for 3 seconds
    setTimeout(() => {
      setIsListening(false);
      setStep(2); // Move to anxiety detection
      
      // Simulate AI processing
      setTimeout(() => {
        setAnalysis('Elevated cortisol markers in voice tone. Spiking heart rate (112 BPM). Anxiety pattern emerging.');
        haptic('error');
      }, 1500);
    }, 3000);
  };

  const notifyCircle = () => {
    haptic('success');
    toast.success('Safe Circle Notified', 'We told your trusted contacts you need a quiet check-in.');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 4500,
      background: 'linear-gradient(180deg, rgba(8,13,24,0.98) 0%, rgba(30,27,75,0.98) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, backdropFilter: 'blur(12px)', animation: 'fadeIn 0.3s ease',
      color: '#fff',
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: 24, right: 24,
        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', cursor: 'pointer',
      }}>
        <X size={20} />
      </button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <BrainCircuit size={40} color="#a855f7" style={{ marginBottom: 16 }} />
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, marginBottom: 8, color: '#e9d5ff' }}>
          AI Emotion Sync
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 280 }}>
          Monitoring subtle physiological signals and voice markers for burnout protection and stress detection.
        </div>
      </div>

      {/* Biometric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 340, marginBottom: 40 }}>
        {/* Heart Rate */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center',
          borderColor: bpm > 100 ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)',
          transition: 'border-color 0.5s',
        }}>
          <HeartPulse size={24} color={bpm > 100 ? '#ef4444' : '#34d399'} style={{ marginBottom: 12, animation: `livePulse ${60/bpm}s infinite` }} />
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Wearable Sync
          </div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: bpm > 100 ? '#fca5a5' : '#fff' }}>
            {bpm} <span style={{ fontSize: 14 }}>BPM</span>
          </div>
        </div>

        {/* Voice Tone */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <Activity size={24} color="#a855f7" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Tone Analysis
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e9d5ff', textAlign: 'center', marginTop: 4 }}>
            {step === 1 ? 'Standby' : analysis ? 'Distress Detected' : 'Analyzing...'}
          </div>
        </div>
      </div>

      {/* Action Area */}
      {step === 1 && (
        <div className="fade-in-up" style={{ textAlign: 'center', width: '100%', maxWidth: 340 }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: '#fff' }}>
            &quot;How are you feeling today?&quot;
          </div>
          
          <button onClick={handleMicClick} style={{
            width: 80, height: 80, borderRadius: '50%',
            background: isListening ? 'rgba(168,85,247,0.2)' : 'linear-gradient(135deg, #9333ea, #a855f7)',
            border: isListening ? '2px solid #a855f7' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto', cursor: 'pointer',
            boxShadow: isListening ? 'none' : '0 10px 30px rgba(168,85,247,0.4)',
            animation: isListening ? 'livePulse 1s infinite' : 'none',
          }}>
            <Mic size={32} color={isListening ? '#a855f7' : '#fff'} />
          </button>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 16 }}>
            {isListening ? 'Listening to voice micro-tremors...' : 'Tap to speak. No recording is saved.'}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="fade-in-up" style={{ width: '100%', maxWidth: 340 }}>
          {!analysis ? (
            <div style={{ textAlign: 'center', color: '#a855f7', fontWeight: 700, animation: 'pulseAlpha 1.5s infinite' }}>
              Processing emotional variance...
            </div>
          ) : (
            <div>
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 16, padding: 16, marginBottom: 24,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fca5a5', fontWeight: 700, marginBottom: 8 }}>
                  <AlertCircle size={18} /> Burnout / Anxiety Alert
                </div>
                <div style={{ fontSize: 13, color: '#fecaca', lineHeight: 1.5 }}>
                  {analysis}
                </div>
              </div>

              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 16, textAlign: 'center' }}>
                Would you like gentle support?
              </div>

              <button onClick={notifyCircle} style={{
                width: '100%', padding: '16px', borderRadius: 14,
                background: '#fff', color: '#1e1b4b', border: 'none',
                fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                cursor: 'pointer', boxShadow: '0 8px 20px rgba(255,255,255,0.2)', marginBottom: 12,
              }}>
                <MessageCircleHeart size={20} /> Alert My Safe Circle
              </button>
              
              <button onClick={onClose} style={{
                width: '100%', padding: '16px', borderRadius: 14,
                background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
                I am okay, dismiss
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulseAlpha { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}
