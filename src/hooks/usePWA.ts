'use client';
// ============================================================
// usePWA — Service Worker registration + PWA lifecycle hook
// SafePath Indore | Team The Riser
// ============================================================

import { useEffect, useState, useCallback, useRef } from 'react';

export type PWAStatus =
  | 'unsupported'    // SW not available
  | 'registering'    // first registration in progress
  | 'active'         // SW controlling the page
  | 'update-ready'   // new SW waiting
  | 'error';         // registration failed

export interface PWAState {
  status: PWAStatus;
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  swVersion: string | null;
  updateAvailable: boolean;
  /** Call to apply waiting SW update (reloads page). */
  applyUpdate: () => void;
  /** Call to trigger the browser "Add to Home Screen" prompt. */
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  /** Send a typed message to the service worker. */
  sendMessage: (msg: Record<string, unknown>) => void;
  /** Register a background sync tag. */
  registerSync: (tag: string) => Promise<boolean>;
}

export function usePWA(): PWAState {
  const [status, setStatus]             = useState<PWAStatus>('registering');
  const [isOnline, setIsOnline]         = useState(true);
  const [isInstallable, setInstallable] = useState(false);
  const [isInstalled, setInstalled]     = useState(false);
  const [updateAvailable, setUpdate]    = useState(false);
  const [swVersion, setSWVersion]       = useState<string | null>(null);

  const waitingRef    = useRef<ServiceWorker | null>(null);
  const installPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const regRef        = useRef<ServiceWorkerRegistration | null>(null);

  // ── Online/offline ───────────────────────────────────────────────────
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // ── Install prompt ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      installPrompt.current = e as BeforeInstallPromptEvent;
      setInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Detect standalone (already installed)
    const mql = window.matchMedia('(display-mode: standalone)');
    setInstalled(mql.matches || (navigator as any).standalone === true);
    const mqlHandler = (e: MediaQueryListEvent) => setInstalled(e.matches);
    mql.addEventListener('change', mqlHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      mql.removeEventListener('change', mqlHandler);
    };
  }, []);

  // ── Service Worker registration ──────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) {
      setStatus('unsupported');
      return;
    }

    let refreshing = false;

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        regRef.current = reg;
        console.log('[PWA] SW registered, scope:', reg.scope);

        // Already active
        if (reg.active) setStatus('active');

        // SW installing → wait
        if (reg.installing) {
          trackInstalling(reg.installing);
        }

        // SW waiting → update available
        if (reg.waiting) {
          waitingRef.current = reg.waiting;
          setUpdate(true);
          setStatus('update-ready');
        }

        // Listen for future updates
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (!newSW) return;
          trackInstalling(newSW);
        });

        // Ask SW for its version
        navigator.serviceWorker.controller?.postMessage({ type: 'GET_VERSION' });

        // Listen for messages from SW
        navigator.serviceWorker.addEventListener('message', (event) => {
          const { type, version, url } = event.data || {};
          if (type === 'VERSION')   setSWVersion(version);
          if (type === 'NAVIGATE')  window.location.href = url;
        });

        // Reload when SW takes control (after update applied)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });

        // Check for updates every 60s
        setInterval(() => reg.update().catch(() => {}), 60_000);

      } catch (err) {
        console.error('[PWA] SW registration failed:', err);
        setStatus('error');
      }
    };

    registerSW();
  }, []);

  function trackInstalling(sw: ServiceWorker) {
    sw.addEventListener('statechange', () => {
      if (sw.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // New SW waiting behind current
          waitingRef.current = sw;
          setUpdate(true);
          setStatus('update-ready');
        } else {
          // First install
          setStatus('active');
        }
      }
      if (sw.state === 'activated') {
        setStatus('active');
        setUpdate(false);
      }
    });
  }

  // ── Actions ──────────────────────────────────────────────────────────

  const applyUpdate = useCallback(() => {
    const waiting = waitingRef.current;
    if (!waiting) return;
    waiting.postMessage({ type: 'SKIP_WAITING' });
    // controllerchange event above handles the reload
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!installPrompt.current) return 'unavailable';
    const result = await installPrompt.current.prompt();
    const outcome = result.outcome as 'accepted' | 'dismissed';
    installPrompt.current = null;
    setInstallable(false);
    if (outcome === 'accepted') setInstalled(true);
    return outcome;
  }, []);

  const sendMessage = useCallback((msg: Record<string, unknown>) => {
    navigator.serviceWorker.controller?.postMessage(msg);
  }, []);

  const registerSync = useCallback(async (tag: string): Promise<boolean> => {
    try {
      if (!regRef.current) return false;
      if (!('sync' in regRef.current)) return false;
      await (regRef.current as any).sync.register(tag);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    status,
    isOnline,
    isInstallable,
    isInstalled,
    updateAvailable,
    swVersion,
    applyUpdate,
    promptInstall,
    sendMessage,
    registerSync,
  };
}

// Type for beforeinstallprompt (not in standard TS lib yet)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
