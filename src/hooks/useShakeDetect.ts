import { useEffect, useRef } from 'react';

interface Options {
  threshold?: number;   // acceleration threshold (m/s²) — default 15
  shakes?: number;      // shakes needed before callback — default 3
  resetMs?: number;     // ms to reset shake count — default 1500
  onShake: () => void;
}

export function useShakeDetect({ threshold = 15, shakes = 3, resetMs = 1500, onShake }: Options) {
  const shakeCount = useRef(0);
  const lastTime   = useRef(0);
  const resetTimer = useRef<NodeJS.Timeout | null>(null);
  const last       = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;

      const { x = 0, y = 0, z = 0 } = acc;
      const now = Date.now();
      if (now - lastTime.current < 120) return;   // debounce 120ms
      lastTime.current = now;

      const dx = Math.abs((x ?? 0) - last.current.x);
      const dy = Math.abs((y ?? 0) - last.current.y);
      const dz = Math.abs((z ?? 0) - last.current.z);
      last.current = { x: x ?? 0, y: y ?? 0, z: z ?? 0 };

      if (dx > threshold || dy > threshold || dz > threshold) {
        shakeCount.current += 1;

        if (resetTimer.current) clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => { shakeCount.current = 0; }, resetMs);

        if (shakeCount.current >= shakes) {
          shakeCount.current = 0;
          if (resetTimer.current) clearTimeout(resetTimer.current);
          onShake();
        }
      }
    };

    // Request permission on iOS 13+
    const setup = async () => {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        try {
          const perm = await (DeviceMotionEvent as any).requestPermission();
          if (perm !== 'granted') return;
        } catch { return; }
      }
      window.addEventListener('devicemotion', handleMotion);
    };

    setup();
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [threshold, shakes, resetMs, onShake]);
}
