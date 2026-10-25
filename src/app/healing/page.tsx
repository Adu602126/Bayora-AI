'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, PhoneCall, FileText, CheckCircle2, ChevronLeft, CalendarHeart, HandHeart } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { haptic } from '@/hooks/useHaptics';

const LEGAL_STEPS = [
  { id: '1', title: 'Medical Examination', desc: 'Get a medical check-up within 24 hours to preserve evidence.', done: true },
  { id: '2', title: 'File FIR (Zero FIR)', desc: 'You can file a Zero FIR at any police station regardless of jurisdiction.', done: false },
  { id: '3', title: 'Consult Legal Aid', desc: 'Reach out to free legal services for guidance on your case.', done: false },
];

const RESOURCES = [
  { name: 'Aastha Helpline (Indore)', phone: '1090', type: 'Police Support' },
  { name: 'National Commission for Women', phone: '7827170170', type: 'Counselling' },
  { name: 'Sanjivani Mental Health', phone: '011-24311918', type: 'Therapy' },
];

export default function HealingPage() {
  const [journal, setJournal] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);
  const [steps, setSteps] = useState(LEGAL_STEPS);

  useEffect(() => {
    const saved = localStorage.getItem('safepath_journal');
    if (saved) setJournal(saved);
  }, []);

  const saveJournal = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJournal(e.target.value);
    localStorage.setItem('safepath_journal', e.target.value);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const toggleStep = (id: string) => {
    haptic('selection');
    setSteps(s => s.map(step => step.id === id ? { ...step, done: !step.done } : step));
  };

  return (
    <AppShell>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)', // Calming dark purple/blue
        paddingBottom: 100,
        color: '#e2e8f0',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/home" style={{ color: '#a5b4fc', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <ChevronLeft size={24} />
          </Link>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: '#e0e7ff' }}>
            Healing & Recovery
          </div>
        </div>

        <div style={{ padding: '0 16px' }}>
          {/* Welcome Message */}
          <div style={{ 
            background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 16, padding: 20, marginBottom: 24, textAlign: 'center' 
          }}>
            <Heart size={36} color="#818cf8" style={{ marginBottom: 12, animation: 'livePulse 3s infinite' }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#c7d2fe', marginBottom: 8, fontFamily: 'var(--font-head)' }}>
              You are not alone.
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
              Recovery takes time. This space is designed to help you process your thoughts, track your legal progress, and connect with professionals who can help.
            </div>
          </div>

          {/* Therapy Journaling */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a5b4fc', fontWeight: 700 }}>
                <FileText size={18} /> Safe Space Journal
              </div>
              {savedMsg && <span style={{ fontSize: 10, color: '#34d399', fontWeight: 700 }}>Saved locally</span>}
            </div>
            <textarea
              value={journal}
              onChange={saveJournal}
              placeholder="Write what you are feeling today... This is encrypted and only saved on your device."
              style={{
                width: '100%', height: 120,
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 12, padding: 14, color: '#e2e8f0', fontSize: 13,
                resize: 'none', outline: 'none', fontFamily: 'var(--font-body)',
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* Legal Checklist */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fca5a5', fontWeight: 700, marginBottom: 12 }}>
              <CalendarHeart size={18} /> Legal Action Tracker
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {steps.map(step => (
                <div 
                  key={step.id} 
                  onClick={() => toggleStep(step.id)}
                  style={{
                    background: step.done ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${step.done ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 12, padding: 14, display: 'flex', gap: 12, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    {step.done 
                      ? <CheckCircle2 size={20} color="#34d399" /> 
                      : <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }} />
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: step.done ? '#34d399' : '#e2e8f0', marginBottom: 4, textDecoration: step.done ? 'line-through' : 'none' }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Support NGOs */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fde047', fontWeight: 700, marginBottom: 12 }}>
              <HandHeart size={18} /> Support Groups & NGOs
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {RESOURCES.map(r => (
                <a key={r.name} href={`tel:${r.phone}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>{r.name}</div>
                      <div style={{ fontSize: 10, color: '#fde047' }}>{r.type}</div>
                    </div>
                    <div style={{ 
                      width: 36, height: 36, borderRadius: '50%', background: 'rgba(253,224,71,0.1)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fde047' 
                    }}>
                      <PhoneCall size={16} />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </AppShell>
  );
}
