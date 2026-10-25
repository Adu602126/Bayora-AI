// useBattery — monitor device battery level
'use client';
import { useEffect, useState } from 'react';

interface BatteryInfo {
  level: number;       // 0–1
  charging: boolean;
  isLow: boolean;      // < 0.15
}

export function useBattery(): BatteryInfo | null {
  const [battery, setBattery] = useState<BatteryInfo | null>(null);

  useEffect(() => {
    const nav = navigator as any;
    if (!nav.getBattery) return;

    nav.getBattery().then((b: any) => {
      const update = () => setBattery({
        level: b.level,
        charging: b.charging,
        isLow: b.level < 0.15 && !b.charging,
      });
      update();
      b.addEventListener('levelchange', update);
      b.addEventListener('chargingchange', update);
      return () => {
        b.removeEventListener('levelchange', update);
        b.removeEventListener('chargingchange', update);
      };
    });
  }, []);

  return battery;
}
