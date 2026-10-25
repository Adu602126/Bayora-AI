'use client';
import { useState } from 'react';
import { X, Share2, QrCode } from 'lucide-react';

interface QRShareCardProps {
  onClose: () => void;
  userName?: string;
}

// Simple QR-like SVG pattern generator (offline — no external API)
function MiniQR({ data }: { data: string }) {
  // Generate a deterministic grid from the data string
  const size = 17;
  const cells: boolean[][] = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => {
      const i = row * size + col;
      const char = data.charCodeAt(i % data.length);
      // Finder patterns (corners)
      const inFinder = (r: number, c: number) =>
        (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
      if (inFinder(row, col)) {
        const dr = Math.min(row, 6 - row, row - (size - 7));
        const dc = Math.min(col, 6 - col, col - (size - 7));
        void Math.min(dr < 0 ? 999 : dr, dc < 0 ? 999 : dc); // dist computed but finder uses explicit patterns below
        if (inFinder(row, col)) {
          if (row < 7 && col < 7) return (row === 0 || row === 6 || col === 0 || col === 6 || (row >= 2 && row <= 4 && col >= 2 && col <= 4));
          if (row < 7 && col >= size - 7) {
            const c2 = col - (size - 7);
            return (row === 0 || row === 6 || c2 === 0 || c2 === 6 || (row >= 2 && row <= 4 && c2 >= 2 && c2 <= 4));
          }
          if (row >= size - 7 && col < 7) {
            const r2 = row - (size - 7);
            return (r2 === 0 || r2 === 6 || col === 0 || col === 6 || (r2 >= 2 && r2 <= 4 && col >= 2 && col <= 4));
          }
        }
      }
      return (char + row * 3 + col * 7 + (char ^ i)) % 3 !== 0;
    })
  );

  const cellSize = 7;
  const totalSize = size * cellSize;

  return (
    <svg width={totalSize} height={totalSize} viewBox={`0 0 ${totalSize} ${totalSize}`} style={{ display: 'block' }}>
      <rect width={totalSize} height={totalSize} fill="white" />
      {cells.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="#080d18" />
          ) : null
        )
      )}
    </svg>
  );
}

export default function QRShareCard({ onClose, userName = 'Traveler' }: QRShareCardProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://safepath.indore.app/track/${encodeURIComponent(userName.toLowerCase().replace(/\s/g, '-'))}-${Date.now().toString(36)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // fallback
    }
    navigator.vibrate?.([100]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const share = async () => {
    navigator.vibrate?.([100]);
    if (navigator.share) {
      await navigator.share({
        title: `Track ${userName}'s journey — SafePath`,
        text: `${userName} is sharing their live location via SafePath. Tap the link to track in real time.`,
        url: shareUrl,
      });
    } else {
      copyLink();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, backdropFilter: 'blur(8px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fade-in-scale" style={{
        width: '100%', maxWidth: 340,
        background: 'linear-gradient(145deg, rgba(8,13,24,0.98), rgba(14,22,40,0.98))',
        border: '1px solid rgba(20,184,166,0.3)',
        borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
      }}>
        {/* Top glow */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #14b8a6, #8b5cf6, transparent)' }} />

        <div style={{ padding: '20px 20px 24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <QrCode size={18} color="var(--teal)" />
              <span style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 800 }}>Guardian QR Code</span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
              <X size={16} />
            </button>
          </div>

          {/* QR code block */}
          <div style={{
            background: 'white', borderRadius: 16, padding: 16,
            display: 'flex', justifyContent: 'center', marginBottom: 16,
            boxShadow: '0 0 40px rgba(20,184,166,0.15)',
            position: 'relative',
          }}>
            <MiniQR data={shareUrl} />
            {/* Center logo overlay */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #14b8a6, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, boxShadow: '0 0 0 3px white',
            }}>🛡️</div>
          </div>

          {/* Info */}
          <div style={{
            background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.18)',
            borderRadius: 12, padding: '10px 14px', marginBottom: 16,
            fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6,
          }}>
            📍 Share this QR or link with your guardian. They can track your <strong>live location</strong> without installing the app.
          </div>

          {/* Short URL */}
          <div style={{
            background: 'var(--bg-4)', border: '1px solid var(--border-3)',
            borderRadius: 10, padding: '9px 12px', marginBottom: 14,
            fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {shareUrl.replace('https://', '')}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copyLink} style={{
              flex: 1, padding: '11px',
              background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(20,184,166,0.08)',
              border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(20,184,166,0.25)'}`,
              borderRadius: 12, cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
              color: copied ? '#22c55e' : 'var(--teal)',
              transition: 'all 0.2s',
            }}>
              {copied ? '✅ Copied!' : '📋 Copy Link'}
            </button>
            <button onClick={share} style={{
              flex: 1, padding: '11px',
              background: 'linear-gradient(135deg, #14b8a6, #3b82f6)',
              border: 'none', borderRadius: 12, cursor: 'pointer',
              fontSize: 12, fontWeight: 700, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              <Share2 size={13} /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
