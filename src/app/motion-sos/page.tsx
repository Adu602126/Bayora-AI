'use client';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import MotionSOS from '@/components/MotionSOS';

export default function MotionSOSPage() {
  const router = useRouter();
  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border-2)',
          flexShrink: 0,
        }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 8 }}
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 800 }}>Motion SOS</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Auto-alert on phone drop or shake</div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <MotionSOS />
        </div>
      </div>
    </AppShell>
  );
}
