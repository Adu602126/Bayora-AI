'use client';
import { useState, useCallback, useEffect } from 'react';
import SplashScreen from '@/components/SplashScreen';
import AnimatedBackground from '@/components/AnimatedBackground';

// Key used in sessionStorage to remember splash was already shown
const SPLASH_KEY = 'safepath_splash_shown';

export default function AppBootstrap({ children }: { children: React.ReactNode }) {
  // Default true if already shown this session — prevents flash on hot-reload/navigation
  // Start with server-safe false to prevent hydration mismatch
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    // Once hydrated on client, check if we should skip splash
    if (sessionStorage.getItem(SPLASH_KEY) === '1') {
      setSplashDone(true);
    }
  }, []);

  const handleSplashDone = useCallback(() => {
    sessionStorage.setItem(SPLASH_KEY, '1');
    setSplashDone(true);
  }, []);

  return (
    <>
      {/* Animated mesh + orb background — always visible */}
      <AnimatedBackground />

      {/* Splash screen — shown only once per session */}
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}

      {/* Main app content — fades in after splash */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        opacity: splashDone ? 1 : 0,
        transform: splashDone ? 'none' : 'translateY(8px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        // Always interactive — don't block clicks even during transition
        pointerEvents: 'all',
      }}>
        {children}
      </div>
    </>
  );
}
