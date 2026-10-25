'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// ── Global toast queue (singleton pattern) ─────────────────────────────────
type Listener = (toasts: ToastItem[]) => void;
let _toasts: ToastItem[] = [];
let _listeners: Listener[] = [];

function notify() {
  _listeners.forEach(l => l([..._toasts]));
}

export const toast = {
  show(item: Omit<ToastItem, 'id'>) {
    const t: ToastItem = { id: Date.now().toString() + Math.random(), duration: 3500, ...item };
    _toasts = [t, ..._toasts].slice(0, 5);
    notify();
    setTimeout(() => toast.remove(t.id), t.duration!);
  },
  remove(id: string) {
    _toasts = _toasts.filter(t => t.id !== id);
    notify();
  },
  success(title: string, message?: string) { this.show({ type: 'success', title, message }); },
  error(title: string, message?: string)   { this.show({ type: 'error',   title, message, duration: 5000 }); },
  warning(title: string, message?: string) { this.show({ type: 'warning', title, message }); },
  info(title: string, message?: string)    { this.show({ type: 'info',    title, message }); },
};

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: typeof CheckCircle; iconColor: string }> = {
  success: { bg: 'rgba(17,24,39,0.97)',  border: 'rgba(34,197,94,0.5)',   icon: CheckCircle,     iconColor: '#22c55e' },
  error:   { bg: 'rgba(17,24,39,0.97)',  border: 'rgba(239,68,68,0.5)',   icon: AlertTriangle,   iconColor: '#ef4444' },
  warning: { bg: 'rgba(17,24,39,0.97)',  border: 'rgba(245,158,11,0.5)',  icon: AlertTriangle,   iconColor: '#f59e0b' },
  info:    { bg: 'rgba(17,24,39,0.97)',  border: 'rgba(20,184,166,0.5)',  icon: Info,            iconColor: '#14b8a6' },
};

function ToastCard({ t, onRemove }: { t: ToastItem; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const style = TOAST_STYLES[t.type];
  const Icon = style.icon;

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(show);
  }, []);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => onRemove(t.id), 300);
  };

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderLeft: `3px solid ${style.iconColor}`,
        borderRadius: 14, padding: '12px 14px',
        marginBottom: 8, minWidth: 280, maxWidth: 340,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${style.border}20`,
        transform: visible && !exiting ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.95)',
        opacity: visible && !exiting ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        cursor: 'pointer',
        backdropFilter: 'blur(20px)',
        fontFamily: 'var(--font-body)',
      }}
      onClick={dismiss}
    >
      <div style={{ flexShrink: 0, marginTop: 1 }}>
        <Icon size={16} style={{ color: style.iconColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: t.message ? 2 : 0 }}>
          {t.title}
        </div>
        {t.message && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{t.message}</div>
        )}
      </div>
      <button onClick={e => { e.stopPropagation(); dismiss(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 0, flexShrink: 0 }}>
        <X size={13} />
      </button>
    </div>
  );
}

// ── Toast Container — mount once in AppShell ───────────────────────────────
export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: Listener = (items) => setToasts(items);
    _listeners.push(listener);
    return () => { _listeners = _listeners.filter(l => l !== listener); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: 70, right: 12, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'all' }}>
          <ToastCard t={t} onRemove={(id) => toast.remove(id)} />
        </div>
      ))}
    </div>
  );
}
