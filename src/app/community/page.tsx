'use client';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import CommunityAlert from '@/components/CommunityAlert';

export default function CommunityPage() {
  const router = useRouter();
  return (
    <AppShell>
      <div style={{ padding: '0 0 100px', overflowY: 'auto', height: '100%' }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '16px 16px 8px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border-2)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 8 }}
          >
            <ChevronLeft size={22} />
          </button>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800 }}>
            Community Alert
          </div>
        </div>

        <div style={{ padding: '0 0 20px' }}>
          <CommunityAlert />
        </div>
      </div>
    </AppShell>
  );
}
