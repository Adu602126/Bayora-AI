'use client';
import Link from 'next/link';
import { ChevronLeft, Moon, Sun } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface TopBarProps {
  showLogo?: boolean;
  title?: string;
  backHref?: string;
}

export default function TopBar({ showLogo = true, title, backHref }: TopBarProps) {
  const { language, setLanguage, darkMode, toggleDarkMode } = useStore();

  return (
    <div style={{
      background: 'rgba(8,13,24,0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '13px 16px',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {showLogo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {/* Logo mark */}
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--teal), #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(20,184,166,0.4)',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-head)', letterSpacing: -1 }}>SP</span>
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
                SafePath
              </span>
              <span style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 400, color: 'var(--text-3)', marginLeft: 3 }}>
                {language === 'hi' ? 'इंदौर' : language === 'mr' ? 'इंदूर' : 'Indore'}
              </span>
            </div>
          </div>
        ) : backHref ? (
          <Link href={backHref} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-2)', textDecoration: 'none', fontSize: 14 }}>
            <ChevronLeft size={18} style={{ marginLeft: -4 }} />
            {title || 'Back'}
          </Link>
        ) : (
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700 }}>{title}</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Dark/Light toggle */}
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-3)',
            transition: 'all 0.2s',
          }}
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Language Toggle */}
        <div className="lang-toggle">
          <div className={`lang-opt ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</div>
          <div className={`lang-opt ${language === 'hi' ? 'active' : ''}`} onClick={() => setLanguage('hi')}>हि</div>
        </div>
      </div>
    </div>
  );
}
