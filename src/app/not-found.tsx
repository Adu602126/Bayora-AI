import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #080d18 0%, #0e1628 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center',
      fontFamily: 'var(--font-body, system-ui)',
    }}>
      {/* Animated shield */}
      <div style={{ position: 'relative', marginBottom: 32 }}>
        <div style={{
          width: 100, height: 100, borderRadius: 28,
          background: 'linear-gradient(135deg, rgba(20,184,166,0.15), rgba(59,130,246,0.1))',
          border: '1.5px solid rgba(20,184,166,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44,
          boxShadow: '0 0 60px rgba(20,184,166,0.15)',
          animation: 'floatNotFound 3s ease-in-out infinite',
        }}>🛡️</div>
        {/* 404 badge */}
        <div style={{
          position: 'absolute', bottom: -10, right: -14,
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          borderRadius: 20, padding: '4px 10px',
          fontSize: 12, fontWeight: 900, color: '#fff',
          boxShadow: '0 2px 10px rgba(239,68,68,0.4)',
          fontFamily: 'var(--font-head, system-ui)',
        }}>404</div>
      </div>

      <h1 style={{
        fontFamily: 'var(--font-head, system-ui)',
        fontSize: 28, fontWeight: 900, color: '#e8f0fe',
        marginBottom: 12, letterSpacing: -0.5,
      }}>
        Route not found
      </h1>

      <p style={{
        fontSize: 14, color: '#546a8a', lineHeight: 1.7, marginBottom: 32, maxWidth: 280,
      }}>
        Looks like this path doesn&apos;t exist. SafePath only guides you to places that are <span style={{ color: '#14b8a6' }}>safe and real</span>.
      </p>

      <Link href="/home" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'linear-gradient(135deg, #14b8a6, #2563eb)',
        color: '#fff', textDecoration: 'none',
        padding: '13px 28px', borderRadius: 14,
        fontFamily: 'var(--font-head, system-ui)',
        fontSize: 14, fontWeight: 700,
        boxShadow: '0 4px 20px rgba(20,184,166,0.3)',
        transition: 'transform 0.2s',
      }}>
        🏠 Back to Safety
      </Link>

      <div style={{ marginTop: 20, fontSize: 11, color: '#2d3f5c' }}>
        SafePath Indore · Team The Riser · BGI Hackathon 2026
      </div>

      <style>{`
        @keyframes floatNotFound {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
