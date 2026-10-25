'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { RefreshCw, WifiOff, Wifi, Download, X, CheckCircle } from 'lucide-react';

interface Toast {
  id: string;
  type: 'offline' | 'online' | 'update' | 'install' | 'info';
  message: string;
  action?: { label: string; fn: () => void };
  duration?: number;
}

const TOAST_STYLES: Record<Toast['type'], { bg: string; border: string; icon: React.ReactNode }> = {
  offline: { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)',   icon: <WifiOff    size={15} style={{ color: '#ef4444',      flexShrink: 0 }} /> },
  online:  { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.35)',   icon: <Wifi       size={15} style={{ color: '#22c55e',      flexShrink: 0 }} /> },
  update:  { bg: 'rgba(20,184,166,0.12)',  border: 'rgba(20,184,166,0.35)',  icon: <RefreshCw  size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} /> },
  install: { bg: 'rgba(20,184,166,0.10)',  border: 'rgba(20,184,166,0.25)',  icon: <Download   size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} /> },
  info:    { bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.25)',   icon: <CheckCircle size={15} style={{ color: '#22c55e',    flexShrink: 0 }} /> },
};

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const { isOnline, isInstallable, updateAvailable, applyUpdate, promptInstall } = usePWA();

  const [toasts,     setToasts]     = useState<Toast[]>([]);
  const dismissedRef                = useRef<Set<string>>(new Set());

  // FIX: stable helpers via useCallback so useEffect deps are correct
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `${toast.type}-${Date.now()}`;
    setToasts(prev => [...prev.filter(x => x.type !== toast.type), { ...toast, id }]);
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => removeToast(id), toast.duration);
    }
  }, [removeToast]);

  // ── Online / offline ─────────────────────────────────────────────────
  // FIX: track wasOffline via ref to avoid triggering the online branch on mount
  const wasOfflineRef = useRef(false);
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      addToast({
        type: 'offline',
        message: "You're offline. SOS alerts will queue and send when reconnected.",
        duration: 0,
      });
    } else if (wasOfflineRef.current) {
      // only show "back online" if we were actually offline before
      setToasts(prev => prev.filter(t => t.type !== 'offline'));
      addToast({ type: 'online', message: 'Back online — queued alerts syncing…', duration: 4000 });
    }
  }, [isOnline, addToast]);

  // ── SW update banner ─────────────────────────────────────────────────
  useEffect(() => {
    if (updateAvailable && !dismissedRef.current.has('update')) {
      addToast({
        type: 'update',
        message: 'New version available',
        action: { label: 'Update now', fn: applyUpdate },
        duration: 0,
      });
    }
  }, [updateAvailable, applyUpdate, addToast]);

  // ── Install prompt ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isInstallable || dismissedRef.current.has('install')) return;
    const timer = setTimeout(() => {
      addToast({
        type: 'install',
        message: 'Install SafePath for offline access & SOS shortcuts',
        action: {
          label: 'Install',
          fn: async () => {
            const outcome = await promptInstall();
            if (outcome === 'accepted') {
              addToast({ type: 'info', message: '✅ SafePath installed!', duration: 3000 });
            }
          },
        },
        duration: 0,
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [isInstallable, promptInstall, addToast]);

  const handleDismiss = useCallback((toast: Toast) => {
    removeToast(toast.id);
    dismissedRef.current.add(toast.type);
  }, [removeToast]);

  return (
    <>
      {children}

      {/* Toast stack */}
      {toasts.length > 0 && (
        <div style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430, zIndex: 9999,
          padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6,
          pointerEvents: 'none',
        }}>
          {toasts.map(toast => {
            const s = TOAST_STYLES[toast.type];
            return (
              <div key={toast.id} className="fade-in" style={{
                background: s.bg, border: `1px solid ${s.border}`,
                borderRadius: 12, padding: '10px 12px',
                display: 'flex', alignItems: 'center', gap: 8,
                pointerEvents: 'all',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}>
                {s.icon}
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>
                  {toast.message}
                </span>
                {toast.action && (
                  <button onClick={toast.action.fn} style={{
                    background: 'var(--teal)', color: '#fff', border: 'none',
                    borderRadius: 6, padding: '4px 10px', fontSize: 11,
                    fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                  }}>
                    {toast.action.label}
                  </button>
                )}
                <button onClick={() => handleDismiss(toast)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-3)', padding: 2, flexShrink: 0,
                }}>
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Thin red bar when offline */}
      {!isOnline && (
        <div style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430, height: 3,
          background: 'var(--red)', zIndex: 10000,
        }} />
      )}
    </>
  );
}
