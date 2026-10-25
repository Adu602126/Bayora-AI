'use client';
import { useState, useEffect } from 'react';
import { X, MapPin, Plus, Trash2, Home, Briefcase, Star, Bell, BellOff } from 'lucide-react';

interface Zone {
  id: string; name: string; address: string;
  type: 'home' | 'office' | 'favorite';
  radius: number;
  notifyOnEnter: boolean; notifyOnExit: boolean;
}

interface Props { onClose: () => void; }

const TYPE_META = {
  home:     { icon: Home,      color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  label: 'Home' },
  office:   { icon: Briefcase, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Office' },
  favorite: { icon: Star,      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Fav' },
};

const INITIAL: Zone[] = [
  { id:'1', name:'Home',   address:'Vijay Nagar, Indore', type:'home',   radius:150, notifyOnEnter:true,  notifyOnExit:true  },
  { id:'2', name:'Office', address:'Palasia, Indore',     type:'office', radius:100, notifyOnEnter:false, notifyOnExit:true  },
];

export default function TrustedZones({ onClose }: Props) {
  const [zones, setZones] = useState<Zone[]>(() => {
    try { const s = localStorage.getItem('sp-zones'); return s ? JSON.parse(s) : INITIAL; }
    catch { return INITIAL; }
  });
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [addr, setAddr] = useState('');
  const [type, setType] = useState<Zone['type']>('home');
  const [radius, setRadius] = useState(150);

  useEffect(() => { localStorage.setItem('sp-zones', JSON.stringify(zones)); }, [zones]);

  const addZone = () => {
    if (!name.trim() || !addr.trim()) return;
    setZones(p => [...p, { id: Date.now().toString(), name: name.trim(), address: addr.trim(), type, radius, notifyOnEnter: true, notifyOnExit: true }]);
    setAdding(false); setName(''); setAddr('');
  };

  const toggle = (id: string, f: 'notifyOnEnter' | 'notifyOnExit') =>
    setZones(p => p.map(z => z.id === id ? { ...z, [f]: !z[f] } : z));

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'flex-end', backdropFilter:'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fade-in-up" style={{ width:'100%', maxWidth:430, margin:'0 auto', background:'var(--bg-2)', borderRadius:'24px 24px 0 0', border:'1px solid var(--border-2)', padding:'20px 20px 40px', maxHeight:'80vh', overflowY:'auto' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <MapPin size={18} color="var(--teal)" />
            <span style={{ fontFamily:'var(--font-head)', fontSize:17, fontWeight:800 }}>Trusted Zones</span>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)' }}><X size={18} /></button>
        </div>

        <p style={{ fontSize:12, color:'var(--text-3)', marginBottom:16, lineHeight:1.6 }}>
          Mark safe locations. Get notified when you enter or leave these zones.
        </p>

        {zones.map(z => {
          const m = TYPE_META[z.type]; const Ic = m.icon;
          return (
            <div key={z.id} style={{ background:'var(--bg-3)', border:'1px solid var(--border-2)', borderRadius:14, padding:14, marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:34, height:34, borderRadius:9, background:m.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Ic size={16} style={{ color:m.color }} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{z.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-3)' }}>📍 {z.address} · {z.radius}m radius</div>
                </div>
                <button onClick={() => setZones(p => p.filter(x => x.id !== z.id))} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(239,68,68,0.6)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {([['notifyOnEnter','On Enter',z.notifyOnEnter],['notifyOnExit','On Exit',z.notifyOnExit]] as const).map(([f, label, val]) => (
                  <button key={f} onClick={() => toggle(z.id, f)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'7px', borderRadius:8, cursor:'pointer', background: val ? 'rgba(20,184,166,0.1)' : 'var(--bg-4)', border:`1px solid ${val ? 'rgba(20,184,166,0.35)' : 'var(--border-3)'}` }}>
                    {val ? <Bell size={11} style={{ color:'var(--teal)' }} /> : <BellOff size={11} style={{ color:'var(--text-3)' }} />}
                    <span style={{ fontSize:10, fontWeight:600, color: val ? 'var(--teal)' : 'var(--text-3)' }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {adding ? (
          <div style={{ background:'var(--bg-3)', border:'1px solid rgba(20,184,166,0.25)', borderRadius:14, padding:14 }}>
            <div className="section-h" style={{ marginBottom:10 }}>New Zone</div>
            <input className="inp" placeholder="Name (e.g. Home)" value={name} onChange={e => setName(e.target.value)} style={{ marginBottom:8 }} />
            <input className="inp" placeholder="Address or landmark" value={addr} onChange={e => setAddr(e.target.value)} style={{ marginBottom:12 }} />
            <div style={{ display:'flex', gap:6, marginBottom:12 }}>
              {(Object.entries(TYPE_META) as [Zone['type'], typeof TYPE_META[keyof typeof TYPE_META]][]).map(([k, m]) => {
                const Ic = m.icon;
                return (
                  <button key={k} onClick={() => setType(k)} style={{ flex:1, padding:'8px 4px', background: type===k ? m.bg : 'var(--bg-4)', border:`1px solid ${type===k ? m.color+'55' : 'var(--border-3)'}`, borderRadius:8, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                    <Ic size={14} style={{ color:m.color }} />
                    <span style={{ fontSize:10, fontWeight:600, color:m.color }}>{m.label}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
              {[50,100,150,200,300].map(r => (
                <button key={r} onClick={() => setRadius(r)} style={{ padding:'5px 10px', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer', background: radius===r ? 'rgba(20,184,166,0.12)' : 'var(--bg-4)', border:`1px solid ${radius===r ? 'rgba(20,184,166,0.4)' : 'var(--border-3)'}`, color: radius===r ? 'var(--teal)' : 'var(--text-2)' }}>{r}m</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setAdding(false)} style={{ flex:1, padding:12, borderRadius:12, border:'1px solid var(--border-2)', background:'var(--bg-4)', color:'var(--text-2)', cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:600, fontSize:13 }}>Cancel</button>
              <button onClick={addZone} className="btn-primary" style={{ flex:2 }}><Plus size={14} /> Add Zone</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ width:'100%', padding:13, borderRadius:13, background:'rgba(20,184,166,0.07)', border:'1px dashed rgba(20,184,166,0.35)', color:'var(--teal)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontFamily:'var(--font-body)', fontSize:13, fontWeight:700 }}>
            <Plus size={15} /> Add Trusted Zone
          </button>
        )}
      </div>
    </div>
  );
}
