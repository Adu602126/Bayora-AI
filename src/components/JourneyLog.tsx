'use client';
import { useState, useEffect } from 'react';
import { X, BookOpen, Trash2, Plus, AlertTriangle, CheckCircle, Navigation, Shield } from 'lucide-react';

interface LogEntry {
  id: string;
  date: string;
  type: 'journey' | 'incident' | 'sos' | 'safe';
  title: string;
  note: string;
  location: string;
}

interface Props { onClose: () => void; }

const TYPE_META = {
  journey:  { icon: Navigation,    color: '#14b8a6', bg: 'rgba(20,184,166,0.12)',  label: 'Journey' },
  incident: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Incident' },
  sos:      { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: 'SOS' },
  safe:     { icon: CheckCircle,   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   label: 'Safe' },
};

const SAMPLE: LogEntry[] = [
  { id:'1', date:'Today, 8:12 AM',     type:'journey',  title:'Vijay Nagar → Palasia', note:'All clear, arrived safely in 12 min.',          location:'Indore, MP' },
  { id:'2', date:'Yesterday, 10:45 PM', type:'incident', title:'Poor lighting reported', note:'Bhanwarkua underpass very dark, avoided route.', location:'Bhanwarkua, Indore' },
  { id:'3', date:'May 7, 6:30 PM',     type:'safe',     title:'Arrived safely',          note:'Used Safe Timer — dismissed with 4 min left.',   location:'Home, Vijay Nagar' },
];

export default function JourneyLog({ onClose }: Props) {
  const [entries, setEntries] = useState<LogEntry[]>(() => {
    try { const s = localStorage.getItem('sp-journey-log'); return s ? JSON.parse(s) : SAMPLE; }
    catch { return SAMPLE; }
  });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote]   = useState('');
  const [loc, setLoc]     = useState('');
  const [type, setType]   = useState<LogEntry['type']>('journey');
  const [filter, setFilter] = useState<LogEntry['type'] | 'all'>('all');

  useEffect(() => { localStorage.setItem('sp-journey-log', JSON.stringify(entries)); }, [entries]);

  const add = () => {
    if (!title.trim()) return;
    const e: LogEntry = {
      id: Date.now().toString(),
      date: 'Just now',
      type, title: title.trim(),
      note: note.trim(),
      location: loc.trim() || 'Indore, MP',
    };
    setEntries(p => [e, ...p]);
    setAdding(false); setTitle(''); setNote(''); setLoc('');
  };

  const filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'flex-end', backdropFilter:'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fade-in-up" style={{ width:'100%', maxWidth:430, margin:'0 auto', background:'var(--bg-2)', borderRadius:'24px 24px 0 0', border:'1px solid var(--border-2)', padding:'20px 20px 36px', maxHeight:'85vh', overflowY:'auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <BookOpen size={18} color="var(--teal)" />
            <span style={{ fontFamily:'var(--font-head)', fontSize:17, fontWeight:800 }}>Journey Log</span>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={() => setAdding(true)} style={{ background:'rgba(20,184,166,0.1)', border:'1px solid rgba(20,184,166,0.3)', color:'var(--teal)', borderRadius:8, padding:'5px 10px', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
              <Plus size={11} /> Add
            </button>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)' }}><X size={18} /></button>
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display:'flex', gap:6, marginBottom:16, overflowX:'auto', paddingBottom:2 }}>
          {(['all', 'journey', 'incident', 'sos', 'safe'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0,
              background: filter===f ? 'rgba(20,184,166,0.15)' : 'var(--bg-4)',
              border:`1px solid ${filter===f ? 'rgba(20,184,166,0.4)' : 'var(--border-3)'}`,
              color: filter===f ? 'var(--teal)' : 'var(--text-3)',
              textTransform:'capitalize',
            }}>{f}</button>
          ))}
        </div>

        {/* Add form */}
        {adding && (
          <div style={{ background:'var(--bg-3)', border:'1px solid rgba(20,184,166,0.25)', borderRadius:14, padding:14, marginBottom:14 }}>
            <div className="section-h" style={{ marginBottom:10 }}>New Entry</div>
            <div style={{ display:'flex', gap:6, marginBottom:10 }}>
              {(Object.entries(TYPE_META) as [LogEntry['type'], typeof TYPE_META[keyof typeof TYPE_META]][]).map(([k, m]) => {
                const Ic = m.icon;
                return (
                  <button key={k} onClick={() => setType(k)} style={{ flex:1, padding:'6px 4px', background: type===k ? m.bg : 'var(--bg-4)', border:`1px solid ${type===k ? m.color+'55' : 'var(--border-3)'}`, borderRadius:8, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                    <Ic size={13} style={{ color:m.color }} />
                    <span style={{ fontSize:9, fontWeight:700, color:m.color }}>{m.label}</span>
                  </button>
                );
              })}
            </div>
            <input className="inp" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} style={{ marginBottom:8 }} />
            <input className="inp" placeholder="Location" value={loc} onChange={e => setLoc(e.target.value)} style={{ marginBottom:8 }} />
            <textarea
              className="inp" placeholder="Notes (optional)"
              value={note} onChange={e => setNote(e.target.value)}
              style={{ marginBottom:12, resize:'none', height:70 }}
            />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setAdding(false)} style={{ flex:1, padding:11, borderRadius:11, border:'1px solid var(--border-2)', background:'var(--bg-4)', color:'var(--text-2)', cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:600, fontSize:13 }}>Cancel</button>
              <button onClick={add} className="btn-primary" style={{ flex:2 }}><Plus size={14} /> Save Entry</button>
            </div>
          </div>
        )}

        {/* Entries */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-3)' }}>
            <Shield size={36} style={{ marginBottom:12, opacity:0.3 }} />
            <div style={{ fontSize:13 }}>No entries yet</div>
          </div>
        ) : filtered.map((e, i) => {
          const m = TYPE_META[e.type]; const Ic = m.icon;
          return (
            <div key={e.id} className="fade-in" style={{ animationDelay:`${i*40}ms`, background:'var(--bg-3)', border:'1px solid var(--border-2)', borderRadius:13, padding:'12px 14px', marginBottom:8, display:'flex', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:m.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                <Ic size={15} style={{ color:m.color }} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:2 }}>
                  <div style={{ fontSize:13, fontWeight:700, lineHeight:1.3 }}>{e.title}</div>
                  <button onClick={() => setEntries(p => p.filter(x => x.id !== e.id))} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.2)', flexShrink:0, padding:'0 0 0 6px' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
                <div style={{ fontSize:10, color:'var(--text-3)', marginBottom:e.note ? 5 : 0 }}>📍 {e.location} · {e.date}</div>
                {e.note && <div style={{ fontSize:11, color:'var(--text-2)', lineHeight:1.5 }}>{e.note}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
