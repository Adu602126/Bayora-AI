'use client';
import { useState } from 'react';

// Fake calculator that hides SafePath — tap "=" 5 times to exit
export default function DecoyScreen({ onExit }: { onExit: () => void }) {
  const [display, setDisplay] = useState('0');
  const [exitCount, setExitCount] = useState(0);
  const [shake, setShake] = useState(false);

  const press = (val: string) => {
    if (val === '=') {
      const next = exitCount + 1;
      setExitCount(next);
      if (next >= 5) { onExit(); return; }
      // subtle shake hint after 3rd tap
      if (next === 3) { setShake(true); setTimeout(() => setShake(false), 400); }
      setDisplay(d => String(eval(d.replace(/[^0-9+\-*/().]/g, '')) || 0));
      return;
    }
    if (val === 'C') { setDisplay('0'); return; }
    if (val === '⌫') { setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0'); return; }
    if (val === '%') { setDisplay(d => String(parseFloat(d) / 100)); return; }
    setDisplay(d => d === '0' && val !== '.' ? val : d + val);
  };

  const BUTTONS = [
    ['C', '⌫', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '−'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];
  const OP_MAP: Record<string, string> = { '÷': '/', '×': '*', '−': '-' };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: '#1c1c1e', display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* Display */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end', justifyContent: 'flex-end',
        padding: '0 24px 20px',
        animation: shake ? 'calcShake 0.3s ease' : 'none',
      }}>
        <div style={{ fontSize: 58, fontWeight: 200, color: '#fff', letterSpacing: -2, wordBreak: 'break-all' }}>
          {display.length > 10 ? parseFloat(display).toExponential(4) : display}
        </div>
        {exitCount > 0 && exitCount < 5 && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
            {Array(exitCount).fill('·').join(' ')}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {BUTTONS.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 10, justifyContent: ri === 4 ? 'flex-end' : 'center' }}>
            {row.map(btn => {
              const isOp = ['÷', '×', '−', '+', '='].includes(btn);
              const isTop = ['C', '⌫', '%'].includes(btn);
              const isZero = btn === '0';
              return (
                <button
                  key={btn}
                  onClick={() => press(OP_MAP[btn] || btn)}
                  style={{
                    width: isZero ? 'calc(50% + 5px)' : 'calc(25% - 7.5px)',
                    height: 76,
                    borderRadius: 38,
                    background: isOp ? '#ff9f0a' : isTop ? '#636366' : '#333336',
                    border: 'none', cursor: 'pointer',
                    fontSize: 28, fontWeight: isOp ? 400 : 400,
                    color: '#fff',
                    display: 'flex', alignItems: 'center',
                    justifyContent: isZero ? 'flex-start' : 'center',
                    paddingLeft: isZero ? 28 : 0,
                    transition: 'filter 0.1s',
                    flexShrink: 0,
                  }}
                  onMouseDown={e => (e.currentTarget.style.filter = 'brightness(1.3)')}
                  onMouseUp={e => (e.currentTarget.style.filter = 'none')}
                >
                  {btn}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes calcShake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
