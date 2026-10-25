'use client';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Map, Navigation, Shield, Settings } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/translations';
import SafetyBot from '@/components/SafetyBot';
import ToastContainer from '@/components/Toast';
import ShakeToAlert from '@/components/ShakeToAlert';

const NAV_ITEMS = [
  { href: '/home', icon: Home, key: 'home' },
  { href: '/routes', icon: Map, key: 'routes' },
  { href: '/journey', icon: Navigation, key: 'journey' },
  { href: '/guardian', icon: Shield, key: 'guardian' },
  { href: '/settings', icon: Settings, key: 'settings' },
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const language = useStore((s) => s.language);
  const t = useTranslation(language);

  return (
    <>
      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ position: 'relative' }}>
        {children}
      </main>

      {/* ── Glassmorphic Bottom Navigation ────────────────────────────────── */}
      <nav style={{
        background: 'rgba(8,13,24,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 0 14px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 40,
      }}>
        {NAV_ITEMS.map(({ href, icon: Icon, key }) => {
          const active = pathname === href;
          return (
            <div
              key={href}
              role="button"
              tabIndex={0}
              onClick={() => router.push(href)}
              onKeyDown={(e) => e.key === 'Enter' && router.push(href)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 3, cursor: 'pointer', padding: '4px 14px', borderRadius: 12,
                position: 'relative', transition: 'opacity 0.15s',
              }}
            >
              {/* Active indicator pill */}
              {active && (
                <div style={{
                  position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                  width: 20, height: 3, background: 'var(--teal)',
                  borderRadius: '0 0 3px 3px',
                  boxShadow: '0 0 8px rgba(20,184,166,0.7)',
                }} />
              )}
              <Icon
                size={22}
                style={{
                  color: active ? 'var(--teal)' : 'var(--text-3)',
                  transition: 'color 0.2s',
                  filter: active ? 'drop-shadow(0 0 6px rgba(20,184,166,0.5))' : 'none',
                }}
              />
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                letterSpacing: '0.3px',
                color: active ? 'var(--teal)' : 'var(--text-3)',
                fontFamily: 'var(--font-body)',
                transition: 'color 0.2s',
              }}>
                {t(key as any)}
              </span>
            </div>
          );
        })}
      </nav>

      {/* ── SOS FAB ──────────────────────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Emergency SOS"
        onClick={() => router.push('/sos')}
        onKeyDown={(e) => e.key === 'Enter' && router.push('/sos')}
        className="sos-pulse"
        style={{
          position: 'fixed',
          bottom: 90,
          right: 16,
          width: 56,
          height: 56,
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-head)',
          fontSize: 12,
          fontWeight: 900,
          color: '#fff',
          letterSpacing: 1,
          zIndex: 100,
          userSelect: 'none',
          boxShadow: '0 4px 20px rgba(239,68,68,0.5)',
          border: '2px solid rgba(255,255,255,0.15)',
        }}
      >
        SOS
      </div>

      {/* ── Shake-to-Alert Safety Feature ──────────────────────────────────── */}
      <ShakeToAlert />

      {/* ── SafeBot AI Assistant ─────────────────────────────────────────────── */}
      <SafetyBot />

      {/* ── Global Toast Notifications ───────────────────────────────────────── */}
      <ToastContainer />
    </>
  );
}
