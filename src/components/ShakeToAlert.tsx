'use client';
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X, Zap } from 'lucide-react';
import { useShakeDetect } from '@/hooks/useShakeDetect';
import { useStore } from '@/store/useStore';
import { haptic } from '@/hooks/useHaptics';
import { dispatchSOSAlert } from '@/lib/riskScoring';
import { toast } from '@/components/Toast';

// ─── Audio Siren Generator ───────────────────────────────────────────────
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

interface ShakeAlertDialogProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
    silentModeEnabled: boolean;
    onSilentModeToggle: (enabled: boolean) => void;
}

function ShakeAlertDialog({ isOpen, onConfirm, onCancel, isLoading, silentModeEnabled, onSilentModeToggle }: ShakeAlertDialogProps) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)',
        }}>
            <div style={{
                background: 'var(--bg)',
                borderRadius: 20,
                padding: '24px',
                maxWidth: 360,
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '1px solid rgba(239,68,68,0.3)',
                animation: 'slideUp 0.3s ease-out',
            }}>
                {/* Close button */}
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        background: 'rgba(100,116,139,0.1)',
                        border: 'none',
                        borderRadius: 8,
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.5 : 1,
                        transition: 'all 0.2s',
                    }}
                >
                    <X size={18} color="var(--text-2)" />
                </button>

                {/* Icon */}
                <div style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    background: 'rgba(239,68,68,0.15)',
                    border: '2px solid rgba(239,68,68,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                }}>
                    <AlertTriangle size={32} color="#ef4444" />
                </div>

                {/* Content */}
                <h2 style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 8,
                    color: 'var(--text)',
                }}>
                    Phone Shake Detected
                </h2>

                <p style={{
                    fontSize: 14,
                    color: 'var(--text-2)',
                    marginBottom: 20,
                    lineHeight: 1.6,
                }}>
                    We detected rapid phone shaking. Send an SOS alert to your emergency contacts with your current location?
                </p>

                {/* Silent Mode Toggle */}
                <div style={{
                    background: 'rgba(20,184,166,0.08)',
                    border: '1px solid rgba(20,184,166,0.2)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Zap size={18} color="#14b8a6" />
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                                Silent Mode
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                                Shake = Instant alert
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => onSilentModeToggle(!silentModeEnabled)}
                        disabled={isLoading}
                        style={{
                            width: 44,
                            height: 24,
                            borderRadius: 12,
                            border: 'none',
                            background: silentModeEnabled ? '#14b8a6' : 'rgba(100,116,139,0.2)',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            position: 'relative',
                            opacity: isLoading ? 0.5 : 1,
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#fff',
                            top: 2,
                            left: silentModeEnabled ? 22 : 2,
                            transition: 'left 0.2s',
                        }} />
                    </button>
                </div>

                {/* Button group */}
                <div style={{
                    display: 'flex',
                    gap: 12,
                }}>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            borderRadius: 12,
                            border: '1px solid rgba(100,116,139,0.2)',
                            background: 'rgba(100,116,139,0.05)',
                            color: 'var(--text-2)',
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.5 : 1,
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => !isLoading && (e.currentTarget.style.background = 'rgba(100,116,139,0.1)')}
                        onMouseLeave={e => !isLoading && (e.currentTarget.style.background = 'rgba(100,116,139,0.05)')}
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            borderRadius: 12,
                            border: 'none',
                            background: isLoading ? 'rgba(239,68,68,0.6)' : '#ef4444',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                            transition: 'all 0.2s',
                            boxShadow: isLoading ? 'none' : '0 4px 12px rgba(239,68,68,0.3)',
                        }}
                        onMouseEnter={e => !isLoading && (e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.4)')}
                        onMouseLeave={e => !isLoading && (e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)')}
                    >
                        {isLoading ? 'Sending...' : 'Send SOS'}
                    </button>
                </div>

                <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
            </div>
        </div>
    );
}

export default function ShakeToAlert() {
    const { profile, journey, silentSOS, setSilentSOS } = useStore();
    const [showDialog, setShowDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showSirenOverlay, setShowSirenOverlay] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Play emergency siren
    const playSiren = () => {
        try {
            audioCtxRef.current?.close().catch(() => { });
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            createSiren(audioCtxRef.current, 10);
            setShowSirenOverlay(true);
            setTimeout(() => setShowSirenOverlay(false), 4500);
        } catch { /* audio blocked */ }
    };

    // Detect shake and handle based on mode
    const handleShake = async () => {
        if (showDialog || isLoading) return;

        // Heavy haptic feedback
        haptic('heavy');
        playSiren();

        if (silentSOS) {
            // Silent mode: send immediately without dialog
            await sendSOSAlert();
        } else {
            // Normal mode: show confirmation dialog
            setShowDialog(true);
        }
    };

    // Send SOS alert
    const sendSOSAlert = async () => {
        setIsLoading(true);
        haptic('heavy');

        try {
            const contacts = profile.contacts.length > 0
                ? profile.contacts.map(c => ({ name: c.name, phone: c.phone }))
                : [];

            const location = journey.currentLocation || { lat: 22.7196, lng: 75.8577 };

            await dispatchSOSAlert(contacts, location, profile.name || 'User');

            toast.success('🚨 SOS Alert Sent', 'Emergency contacts notified with your location');
            setShowDialog(false);
        } catch (error) {
            console.error('Error sending SOS:', error);
            toast.error('Failed to send SOS', 'Please try again or call emergency services');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setShowDialog(false);
    };

    // Initialize shake detection
    useShakeDetect({
        threshold: 15,   // m/s² — sensitivity
        shakes: 3,       // number of shakes required
        resetMs: 1500,   // time window for shakes
        onShake: handleShake,
    });

    return (
        <>
            {/* ── Red Emergency Overlay (Flashing on shake) ──────────────────── */}
            {showSirenOverlay && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(239, 68, 68, 0.2)',
                    zIndex: 9998,
                    animation: 'sirenFlash 0.3s infinite',
                    pointerEvents: 'none',
                }}>
                    <style>{`
                        @keyframes sirenFlash {
                            0%, 100% { background: rgba(239, 68, 68, 0.2); }
                            50% { background: rgba(239, 68, 68, 0.5); }
                        }
                    `}</style>
                </div>
            )}

            {/* ── Confirmation Dialog ───────────────────────────────────────── */}
            <ShakeAlertDialog
                isOpen={showDialog}
                onConfirm={sendSOSAlert}
                onCancel={handleCancel}
                isLoading={isLoading}
                silentModeEnabled={silentSOS}
                onSilentModeToggle={setSilentSOS}
            />
        </>
    );
}
