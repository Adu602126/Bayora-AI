// Skeleton loader components for loading states

export function SkeletonCard({ height = 80 }: { height?: number }) {
  return (
    <div className="shimmer" style={{
      height, borderRadius: 14,
      border: '1px solid var(--border-2)',
      marginBottom: 10,
    }} />
  );
}

export function SkeletonText({ width = '100%', height = 12 }: { width?: string | number; height?: number }) {
  return (
    <div className="shimmer" style={{
      width, height, borderRadius: 6, marginBottom: 8,
    }} />
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return (
    <div className="shimmer" style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
    }} />
  );
}

export function SkeletonHomePage() {
  return (
    <div style={{ padding: '16px 16px 100px' }}>
      {/* Hero skeleton */}
      <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 24, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <SkeletonText width={80} height={10} />
            <SkeletonText width={160} height={28} />
            <SkeletonText width={100} height={10} />
          </div>
          <div className="shimmer" style={{ width: 72, height: 60, borderRadius: 12 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[1,2,3].map(i => <div key={i} className="shimmer" style={{ flex: 1, height: 52, borderRadius: 10 }} />)}
        </div>
        <div className="shimmer" style={{ height: 48, borderRadius: 12 }} />
      </div>

      {/* Tip skeleton */}
      <div className="shimmer" style={{ height: 60, borderRadius: '0 12px 12px 0', marginBottom: 20, borderLeft: '3px solid var(--border-3)' }} />

      {/* Quick actions skeleton */}
      <SkeletonText width={120} height={10} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: 90, borderRadius: 12 }} />)}
      </div>

      {/* Reports skeleton */}
      {[1,2,3].map(i => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, background: 'var(--bg-3)', borderRadius: 12, padding: 12 }}>
          <SkeletonAvatar size={34} />
          <div style={{ flex: 1 }}>
            <SkeletonText width="60%" height={10} />
            <SkeletonText width="80%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}
