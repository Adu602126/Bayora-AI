'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, ChevronDown, Mic, MicOff, Minimize2, Volume2, VolumeX } from 'lucide-react';
import { getHybridAIResponse, getWelcomeMessage, AIMessage } from '@/lib/safetyAI';
import { haptic } from '@/hooks/useHaptics';

// ── Simple markdown-ish renderer ──────────────────────────────────────────────
function RenderText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div style={{ lineHeight: 1.65, fontSize: 13 }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
        // Bold: **text**
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <div key={i} style={{ marginBottom: 1 }}>
            {parts.map((part, j) =>
              j % 2 === 1
                ? <strong key={j} style={{ color: 'var(--text)', fontWeight: 700 }}>{part}</strong>
                : <span key={j}>{part}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Severity colors ───────────────────────────────────────────────────────────
const SEVERITY_STYLE: Record<string, { bg: string; border: string; dot: string }> = {
  danger:  { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   dot: '#ef4444' },
  warning: { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  dot: '#f59e0b' },
  success: { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)',   dot: '#22c55e' },
  info:    { bg: 'rgba(20,184,166,0.06)',  border: 'rgba(20,184,166,0.18)', dot: '#14b8a6' },
};

export default function SafetyBot() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [hasNewMsg, setHasNewMsg] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [mood, setMood] = useState<'calm' | 'anxious' | 'urgent'>('calm');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const memoryRef = useRef<string[]>([]); // conversation memory

  // Initialize with welcome message on client only (avoids SSR hydration mismatch)
  useEffect(() => {
    setMessages([getWelcomeMessage()]);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, minimized, typing]);

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, minimized]);

  // Pulse badge on first open hint
  useEffect(() => {
    const t = setTimeout(() => setHasNewMsg(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // ── Mood detection from typing ──────────────────────────────────────────────────
  const detectMood = useCallback((text: string) => {
    const lower = text.toLowerCase();
    const urgentWords = ['help', 'sos', 'attack', 'scared', 'danger', 'please', 'now', 'emergency', 'bachao', 'urgent'];
    const anxiousWords = ['unsafe', 'worried', 'afraid', 'fear', 'alone', 'dark', 'night', 'following'];
    const hasUrgent = urgentWords.some(w => lower.includes(w));
    const hasAnxious = anxiousWords.some(w => lower.includes(w));
    // Typing in ALL CAPS = urgent
    const isCaps = text.length > 3 && text === text.toUpperCase();
    if (hasUrgent || isCaps) setMood('urgent');
    else if (hasAnxious) setMood('anxious');
    else setMood('calm');
  }, []);

  // ── Voice reply via speechSynthesis ───────────────────────────────────────────
  const speakText = useCallback((text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    // Strip markdown-ish formatting
    const clean = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^[•\-] /gm, '').replace(/\n/g, '. ').slice(0, 400);
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = 0.95;
    utt.pitch = 1.1;
    utt.lang = 'en-IN';
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
      || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utt.voice = preferred;
    window.speechSynthesis.speak(utt);
  }, [voiceEnabled]);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;

    haptic('light');
    detectMood(msg);

    // Add to memory (keep last 5 user messages for context)
    memoryRef.current = [...memoryRef.current.slice(-4), msg];

    const userMsg: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: msg,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    setHasNewMsg(false);

    // Context-aware: include memory in the query
    const contextMsg = memoryRef.current.length > 1
      ? `[Context: ${memoryRef.current.slice(0, -1).join(' | ')}] ${msg}`
      : msg;

    const delay = 600 + Math.random() * 600;
    await new Promise(r => setTimeout(r, delay));

    const botMsg = await getHybridAIResponse(contextMsg);
    setTyping(false);
    setMessages(prev => [...prev, botMsg]);

    // Speak reply if voice enabled
    speakText(botMsg.text);

    // Haptic based on severity
    if (botMsg.severity === 'danger') haptic('error');
    else if (botMsg.severity === 'warning') haptic('warning');
    else haptic('success');
  };

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleOpen = () => {
    setOpen(true);
    setMinimized(false);
    setHasNewMsg(false);
  };

  return (
    <>
      {/* ── Floating Bot Button ─────────────────────────────────────────────── */}
      {!open && (
        <button
          id="rio-fab"
          onClick={handleOpen}
          aria-label="Open Rio safety assistant"
          style={{
            position: 'fixed',
            bottom: 160,
            right: 16,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #14b8a6, #3b82f6)',
            border: '2px solid rgba(255,255,255,0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 101,
            boxShadow: '0 4px 20px rgba(20,184,166,0.45)',
            animation: 'teal-pulse 2.5s ease-in-out infinite',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <span style={{ fontSize: 22, lineHeight: 1 }}>👮</span>
          {/* Badge */}
          {hasNewMsg && (
            <div style={{
              position: 'absolute',
              top: -3, right: -3,
              width: 14, height: 14,
              background: '#ef4444',
              borderRadius: '50%',
              border: '2px solid var(--bg)',
              animation: 'ping 1.5s infinite',
            }} />
          )}
        </button>
      )}

      {/* ── Chat Window ──────────────────────────────────────────────────────── */}
      {open && (
        <div
          id="rio-window"
          style={{
            position: 'fixed',
            bottom: minimized ? 'auto' : 90,
            top: minimized ? 'auto' : 'auto',
            right: 12,
            width: 'min(360px, calc(100vw - 24px))',
            maxHeight: minimized ? 56 : 'min(540px, calc(100vh - 130px))',
            background: 'rgba(8,13,24,0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(20,184,166,0.25)',
            borderRadius: 20,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 200,
            boxShadow: '0 16px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(20,184,166,0.1)',
            overflow: 'hidden',
            transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
            animation: 'fadeInScale 0.3s ease forwards',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(20,184,166,0.12) 0%, rgba(59,130,246,0.08) 100%)',
          }}>
            {/* Bot avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #14b8a6, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: '0 0 12px rgba(20,184,166,0.4)',
              fontSize: 17,
            }}>
              👮
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-head)' }}>
                Rio
              </div>
              <div style={{ fontSize: 10, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 5, height: 5, background: '#22c55e', borderRadius: '50%' }} />
                {mood === 'urgent' ? '🚨 Urgent mode' : mood === 'anxious' ? '⚠️ Anxious mode' : 'Offline • Always available'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {/* Voice reply toggle */}
              <button
                onClick={() => { setVoiceEnabled(v => !v); window.speechSynthesis?.cancel(); haptic('selection'); }}
                aria-label={voiceEnabled ? 'Disable voice reply' : 'Enable voice reply'}
                title={voiceEnabled ? 'Voice reply ON' : 'Voice reply OFF'}
                style={{
                  background: voiceEnabled ? 'rgba(20,184,166,0.15)' : 'none',
                  border: voiceEnabled ? '1px solid rgba(20,184,166,0.3)' : 'none',
                  cursor: 'pointer', color: voiceEnabled ? 'var(--teal)' : 'var(--text-3)',
                  padding: 4, borderRadius: 6, transition: 'all 0.2s',
                }}
              >
                {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <button
                onClick={() => setMinimized(m => !m)}
                aria-label="Minimize"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, borderRadius: 6 }}
              >
                {minimized ? <ChevronDown size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={() => { setOpen(false); setMinimized(false); window.speechSynthesis?.cancel(); }}
                aria-label="Close Rio"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, borderRadius: 6 }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages area */}
          {!minimized && (
            <>
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 12px 6px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                {messages.map(msg => {
                  const isBot = msg.role === 'bot';
                  const sev = SEVERITY_STYLE[msg.severity ?? 'info'];
                  return (
                    <div key={msg.id} style={{
                      display: 'flex',
                      justifyContent: isBot ? 'flex-start' : 'flex-end',
                      alignItems: 'flex-end',
                      gap: 6,
                    }}>
                      {isBot && (
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #14b8a6, #3b82f6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, marginBottom: 2, fontSize: 13,
                        }}>
                          👮
                        </div>
                      )}
                      <div style={{ maxWidth: '82%' }}>
                        {/* Severity dot for bot messages */}
                        {isBot && msg.severity && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: sev.dot }} />
                            <span style={{ fontSize: 9, color: sev.dot, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                              {msg.severity === 'danger' ? 'URGENT' : msg.severity === 'warning' ? 'CAUTION' : msg.severity === 'success' ? 'SAFE' : 'INFO'}
                            </span>
                          </div>
                        )}
                        <div style={{
                          background: isBot ? sev.bg : 'rgba(20,184,166,0.15)',
                          border: `1px solid ${isBot ? sev.border : 'rgba(20,184,166,0.35)'}`,
                          borderRadius: isBot ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                          padding: '10px 13px',
                          color: 'var(--text-2)',
                        }}>
                          {isBot
                            ? <RenderText text={msg.text} />
                            : <div style={{ fontSize: 13, lineHeight: 1.5 }}>{msg.text}</div>
                          }
                        </div>

                        {/* Suggestion chips */}
                        {isBot && msg.suggestions && msg.suggestions.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
                            {msg.suggestions.map(s => (
                              <button
                                key={s}
                                onClick={() => sendMessage(s)}
                                style={{
                                  background: 'rgba(20,184,166,0.07)',
                                  border: '1px solid rgba(20,184,166,0.22)',
                                  color: 'var(--teal)',
                                  borderRadius: 20,
                                  padding: '4px 10px',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  fontFamily: 'var(--font-body)',
                                  transition: 'all 0.15s',
                                  whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={e => {
                                  (e.target as HTMLButtonElement).style.background = 'rgba(20,184,166,0.18)';
                                  (e.target as HTMLButtonElement).style.borderColor = 'rgba(20,184,166,0.5)';
                                }}
                                onMouseLeave={e => {
                                  (e.target as HTMLButtonElement).style.background = 'rgba(20,184,166,0.07)';
                                  (e.target as HTMLButtonElement).style.borderColor = 'rgba(20,184,166,0.22)';
                                }}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {typing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #14b8a6, #3b82f6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      fontSize: 13,
                    }}>
                      👮
                    </div>
                    <div style={{
                      background: 'rgba(20,184,166,0.06)',
                      border: '1px solid rgba(20,184,166,0.18)',
                      borderRadius: '4px 14px 14px 14px',
                      padding: '10px 14px',
                      display: 'flex',
                      gap: 4,
                      alignItems: 'center',
                    }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: 'var(--teal)',
                          animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input area */}
              <div style={{
                padding: '10px 12px 14px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexShrink: 0,
              }}>
                {/* Voice button */}
                <button
                  onClick={listening ? stopVoice : startVoice}
                  aria-label={listening ? 'Stop listening' : 'Voice input'}
                  style={{
                    width: 36, height: 36,
                    borderRadius: '50%',
                    background: listening ? 'rgba(239,68,68,0.15)' : 'rgba(20,184,166,0.08)',
                    border: `1px solid ${listening ? 'rgba(239,68,68,0.4)' : 'rgba(20,184,166,0.25)'}`,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    animation: listening ? 'teal-pulse 1s infinite' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {listening
                    ? <MicOff size={14} color="#ef4444" />
                    : <Mic size={14} color="var(--teal)" />
                  }
                </button>

                <input
                  ref={inputRef}
                  id="rio-input"
                  className="inp"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder={listening ? 'Listening...' : 'Describe your situation…'}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    fontSize: 13,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${listening ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.08)'}`,
                    color: 'var(--text)',
                  }}
                  disabled={typing}
                />

                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || typing}
                  aria-label="Send message"
                  style={{
                    width: 36, height: 36,
                    borderRadius: '50%',
                    background: input.trim() && !typing
                      ? 'linear-gradient(135deg, #14b8a6, #3b82f6)'
                      : 'rgba(255,255,255,0.05)',
                    border: 'none',
                    cursor: input.trim() && !typing ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    opacity: input.trim() && !typing ? 1 : 0.4,
                  }}
                >
                  <Send size={15} color="#fff" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Typing dot animation */}
      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
