'use client';
import { useState, useEffect } from 'react';
import { ShieldCheck, Lock, FileText, Mic, Camera, MapPin, X, FileBadge, Download, CheckCircle2 } from 'lucide-react';
import { haptic } from '@/hooks/useHaptics';
import { toast } from '@/components/Toast';

interface EvidenceVaultProps {
  onClose: () => void;
}

export default function EvidenceVault({ onClose }: EvidenceVaultProps) {
  const [locked, setLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [generatingFIR, setGeneratingFIR] = useState(false);
  const [firReady, setFirReady] = useState(false);

  // Simulated Evidence Logs
  const evidenceLogs = [
    { id: 1, type: 'audio', date: 'Today, 10:45 PM', size: '2.4 MB', duration: '03:12', risk: 'High Stress Detected' },
    { id: 2, type: 'photo', date: 'Today, 10:46 PM', size: '1.1 MB', duration: 'Auto-Capture (Rear)', risk: 'Face Detected' },
  ];

  const handlePin = (n: string) => {
    if (pin.length < 4) {
      const newPin = pin + n;
      setPin(newPin);
      haptic('light');
      if (newPin.length === 4) {
        setTimeout(() => {
          if (newPin === '1234') {
            haptic('success');
            setLocked(false);
          } else {
            haptic('error');
            setPin('');
            toast.error('Access Denied', 'Incorrect PIN. Vault remains locked.');
          }
        }, 300);
      }
    }
  };

  const generateFIR = () => {
    haptic('selection');
    setGeneratingFIR(true);
    setTimeout(() => {
      setGeneratingFIR(false);
      setFirReady(true);
      haptic('success');
      toast.success('FIR Draft Ready', 'AI has compiled evidence into a legal format.');
    }, 2500);
  };

  if (locked) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 5000,
        background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 32,
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.1)',
          border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer'
        }}><X size={20} /></button>

        <Lock size={48} color="#94a3b8" style={{ marginBottom: 24 }} />
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
          Evidence Vault
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 40, maxWidth: 260 }}>
          Enter PIN to access tamper-proof encrypted recordings and AI FIR reports. (PIN: 1234)
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: '50%',
              background: pin.length > i ? '#fff' : 'rgba(255,255,255,0.1)'
            }} />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {['1','2','3','4','5','6','7','8','9','','0','del'].map((k) => (
            <button key={k} onClick={() => {
              if (k === 'del') setPin(p => p.slice(0, -1));
              else if (k) handlePin(k);
            }} style={{
              width: 70, height: 70, borderRadius: '50%', background: k ? 'rgba(255,255,255,0.05)' : 'transparent',
              border: 'none', color: '#fff', fontSize: 24, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: k ? 'pointer' : 'default', visibility: k === '' ? 'hidden' : 'visible'
            }}>
              {k === 'del' ? <X size={24} /> : k}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 5000,
      background: '#0f172a', overflowY: 'auto', padding: '24px 16px 80px',
      color: '#fff',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={28} color="#34d399" />
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800 }}>Encrypted Vault</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <X size={28} />
        </button>
      </div>

      {/* Auto-Captured Evidence Section */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Secure Logs (24hr Retention)
        </div>
        
        {evidenceLogs.map(log => (
          <div key={log.id} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: 16, marginBottom: 12, display: 'flex', gap: 16,
            alignItems: 'center',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: log.type === 'audio' ? 'rgba(168,85,247,0.1)' : 'rgba(56,189,248,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: log.type === 'audio' ? '#a855f7' : '#38bdf8'
            }}>
              {log.type === 'audio' ? <Mic size={24} /> : <Camera size={24} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                {log.type === 'audio' ? 'Auto-Recorded Audio' : 'Stealth Photo Capture'}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                {log.date} · {log.size} · {log.duration}
              </div>
              <div style={{ fontSize: 11, color: '#fca5a5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
                {log.risk}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI FIR Generator */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Legal Assistance
        </div>

        {!firReady ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(16,185,129,0.1))',
            border: '1px solid rgba(52,211,153,0.3)', borderRadius: 16, padding: 20, textAlign: 'center'
          }}>
            <FileBadge size={40} color="#34d399" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>One-Tap AI FIR Draft</div>
            <div style={{ fontSize: 13, color: '#a7f3d0', lineHeight: 1.5, marginBottom: 20 }}>
              Our AI automatically transcribes your encrypted audio, extracts the GPS timestamp, and formats it into a legally compliant Zero FIR template ready for police submission.
            </div>
            
            <button onClick={generateFIR} disabled={generatingFIR} style={{
              width: '100%', padding: 16, borderRadius: 12, border: 'none',
              background: '#34d399', color: '#064e3b', fontSize: 15, fontWeight: 800,
              cursor: generatingFIR ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: generatingFIR ? 0.7 : 1,
            }}>
              {generatingFIR ? (
                <><div className="spin" style={{ width: 16, height: 16, border: '2px solid #064e3b', borderTopColor: 'transparent', borderRadius: '50%' }} /> Compiling Evidence...</>
              ) : (
                <><FileText size={18} /> Generate Police Report</>
              )}
            </button>
          </div>
        ) : (
          <div className="fade-in-up" style={{
            background: '#fff', borderRadius: 16, padding: 20, color: '#0f172a'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 color="#10b981" /> FIR Draft Generated
              </div>
              <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <Download size={16} /> PDF
              </button>
            </div>

            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16,
              fontSize: 12, fontFamily: 'monospace', lineHeight: 1.6, color: '#334155'
            }}>
              <strong>TO:</strong> The Station House Officer (SHO)<br/>
              <strong>POLICE STATION:</strong> Vijay Nagar, Indore<br/>
              <strong>DATE/TIME OF INCIDENT:</strong> 11 May 2026, 10:45 PM<br/>
              <strong>LOCATION:</strong> 22.7533° N, 75.8937° E (Bhawarkua Road)<br/><br/>
              
              <strong>SUBJECT:</strong> Complaint regarding Harassment & Intimidation<br/><br/>
              
              <strong>INCIDENT SUMMARY (AI-Generated):</strong><br/>
              At approximately 10:45 PM, the victim was subjected to continuous harassment by an unidentified individual. SafePath Auto-Capture recorded 3 minutes and 12 seconds of audio evidence, documenting aggressive verbal threats. Voice stress analysis confirmed high distress markers.<br/><br/>
              
              <strong>ATTACHED DIGITAL EVIDENCE (Hash Verified):</strong><br/>
              1. Audio File: rec_892_audio.enc (Tamper-proof hash: 8x9fA2...)<br/>
              2. Photo File: cap_892_rear.enc (Face detected)<br/><br/>

              Please register an FIR under BNS sections corresponding to Harassment/Stalking and initiate immediate action.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
