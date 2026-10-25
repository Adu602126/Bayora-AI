'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';

// Handles Web Share Target API — when someone shares a location link to SafePath
function ShareTargetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { setDestination } = useStore();

  useEffect(() => {
    const text  = params.get('text')  || '';
    const title = params.get('title') || '';
    const url   = params.get('url')   || '';

    // Try to extract a destination from shared text
    const combined = `${title} ${text} ${url}`.trim();
    if (combined) {
      setDestination(combined.slice(0, 100)); // truncate
      router.replace('/routes');
    } else {
      router.replace('/home');
    }
  }, [params, router, setDestination]);

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔗</div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Processing shared content…</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Redirecting to route planner</div>
      </div>
    </div>
  );
}

export default function ShareTargetPage() {
  return (
    <Suspense fallback={
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔗</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Loading…</div>
        </div>
      </div>
    }>
      <ShareTargetInner />
    </Suspense>
  );
}
