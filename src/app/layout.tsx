import type { Metadata, Viewport } from 'next';
import PWAProvider from '@/components/PWAProvider';
import AppBootstrap from '@/components/AppBootstrap';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

// Fonts are loaded via CSS @import in globals.css (avoids build-time Google Fonts fetch).
// This keeps the build fully offline-compatible while still loading the fonts in browsers.

// ── PWA + SEO metadata ────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL('https://safepath.indore.app'),

  title: {
    default: 'SafePath Indore — Safe Route Navigation',
    template: '%s | SafePath Indore',
  },
  description:
    'AI-powered safe-route navigation for women & vulnerable groups in Indore. Real-time risk scoring, live journey tracking, one-touch SOS emergency.',

  manifest: '/manifest.json',

  keywords: [
    'women safety', 'safe route', 'Indore', 'smart city',
    'SOS emergency', 'navigation', 'BGI hackathon',
  ],
  authors: [{ name: 'Team The Riser' }],
  creator: 'Team The Riser — BGI Hackathon 2026',
  publisher: 'SafePath Indore',

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://safepath.indore.app',
    siteName: 'SafePath Indore',
    title: 'SafePath Indore — Intelligent Safe Route Navigation',
    description: 'AI-powered safety navigation for women & vulnerable groups in Indore.',
    images: [{ url: '/screenshots/home.png', width: 390, height: 844, alt: 'SafePath Indore App' }],
  },

  // Apple PWA
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SafePath',
    startupImage: [
      { url: '/screenshots/home.png', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)' },
    ],
  },

  // Icons
  icons: {
    icon: [
      { url: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/icons/icon-192.png',
  },

  // No indexing for hackathon prototype
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#14b8a6' },
    { media: '(prefers-color-scheme: light)', color: '#0d9488' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',           // iOS notch support
};

// ─────────────────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        {/* Apple PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SafePath" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />

        {/* Microsoft tiles */}
        <meta name="msapplication-TileColor" content="#14b8a6" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Prevent phone number detection */}
        <meta name="format-detection" content="telephone=no" />

        {/* Color scheme */}
        <meta name="color-scheme" content="dark" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.mapbox.com" />
      </head>

      <body className="font-body antialiased" style={{ background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden' }} suppressHydrationWarning>
        {/* App frame — max 430px mobile shell */}
        <div
          id="app-root"
          style={{
            width: '100%',
            height: '100dvh',          // dynamic viewport height (handles mobile chrome bar)
            maxWidth: 430,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            background: 'var(--bg)',
          }}
        >
          {/* ── App Bootstrap: Splash + Background + PWA ─────────────── */}
          <AuthProvider>
            <AppBootstrap>
              <PWAProvider>
                {children}
              </PWAProvider>
            </AppBootstrap>
          </AuthProvider>
        </div>

        {/* ── Service Worker registration ─────────────────────────────── */}
        {/* Note: actual registration is done inside usePWA hook.           */}
        {/* This script handles the edge case where the hook hasn't loaded. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  if (!('serviceWorker' in navigator)) return;
  // Defer until page is fully loaded to not block render
  window.addEventListener('load', function() {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      if (regs.length === 0) {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then(function(r) { console.log('[SW] Registered:', r.scope); })
          .catch(function(e) { console.warn('[SW] Registration failed:', e); });
      }
    });
  });
})();
            `,
          }}
        />
      </body>
    </html>
  );
}
