'use client';
import { useState } from 'react';
import { X, Plus, Phone, Trash2, User, Edit2, Check } from 'lucide-react';
import { useStore, EmergencyContact } from '@/store/useStore';
import { toast } from '@/components/Toast';

interface Props { onClose: () => void; }

const RELATIONS = ['Mom', 'Dad', 'Sister', 'Brother', 'Friend', 'Partner', 'Guardian', 'Colleague', 'Neighbor', 'Other'];

const AVATAR_COLORS = [
  '#14b8a6','#3b82f6','#8b5cf6','#f59e0b','#22c55e','#ec4899','#f97316','#6366f1',
];

export default function ContactManager({ onClose }: Props) {
  const { profile, addContact, removeContact } = useStore();
  const contacts = profile.contacts;

  const [adding, setAdding]     = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [relation, setRelation] = useState('Friend');

  const resetForm = () => { setName(''); setPhone(''); setRelation('Friend'); setAdding(false); setEditId(null); };

  const save = () => {
    if (!name.trim() || !phone.trim()) return;
    if (phone.replace(/\D/g,'').length < 10) { toast.error('Invalid phone', 'Enter a 10-digit number.'); return; }

    if (editId) {
      removeContact(editId);
    }

    addContact({
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim(),
      relation,
    });

    toast.success(editId ? 'Contact updated' : 'Contact added', `${name} is now an emergency contact.`);
    resetForm();
  };

  const startEdit = (c: EmergencyContact) => {
    setEditId(c.id); setName(c.name); setPhone(c.phone); setRelation(c.relation);
    setAdding(true);
  };

  const del = (c: EmergencyContact) => {
    removeContact(c.id);
    toast.info('Contact removed', `${c.name} removed from emergency list.`);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'flex-end', backdropFilter:'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fade-in-up" style={{ width:'100%', maxWidth:430, margin:'0 auto', background:'var(--bg-2)', borderRadius:'24px 24px 0 0', border:'1px solid var(--border-2)', padding:'20px 20px 40px', maxHeight:'85vh', overflowY:'auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <User size={18} color="var(--teal)" />
            <span style={{ fontFamily:'var(--font-head)', fontSize:17, fontWeight:800 }}>Emergency Contacts</span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => { resetForm(); setAdding(true); }} style={{ background:'rgba(20,184,166,0.1)', border:'1px solid rgba(20,184,166,0.3)', color:'var(--teal)', borderRadius:8, padding:'5px 10px', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
              <Plus size={11} /> Add
            </button>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)' }}><X size={18} /></button>
          </div>
        </div>

        <p style={{ fontSize:12, color:'var(--text-3)', marginBottom:16, lineHeight:1.6 }}>
          These people will be alerted when you trigger SOS. Add up to 5 contacts.
        </p>

        {/* Add / Edit form */}
        {adding && (
          <div style={{ background:'var(--bg-3)', border:'1px solid rgba(20,184,166,0.25)', borderRadius:16, padding:16, marginBottom:16 }}>
            <div className="section-h" style={{ marginBottom:12 }}>{editId ? 'Edit Contact' : 'New Contact'}</div>

            <input className="inp" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} style={{ marginBottom:8 }} />
            <input className="inp" placeholder="Phone number (+91...)" value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" style={{ marginBottom:12 }} />

            {/* Relation picker */}
            <div className="section-h" style={{ marginBottom:8 }}>Relation</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
              {RELATIONS.map(r => (
                <button key={r} onClick={() => setRelation(r)} style={{
                  padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer',
                  background: relation===r ? 'rgba(20,184,166,0.15)' : 'var(--bg-4)',
                  border:`1px solid ${relation===r ? 'rgba(20,184,166,0.4)' : 'var(--border-3)'}`,
                  color: relation===r ? 'var(--teal)' : 'var(--text-3)',
                }}>{r}</button>
              ))}
            </div>

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={resetForm} style={{ flex:1, padding:12, borderRadius:12, border:'1px solid var(--border-2)', background:'var(--bg-4)', color:'var(--text-2)', cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:600, fontSize:13 }}>Cancel</button>
              <button onClick={save} className="btn-primary" style={{ flex:2 }}>
                <Check size={14} /> {editId ? 'Save Changes' : 'Add Contact'}
              </button>
            </div>
          </div>
        )}

        {/* Contacts list */}
        {contacts.length === 0 && !adding ? (
          <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-3)' }}>
            <Phone size={36} style={{ marginBottom:12, opacity:0.25 }} />
            <div style={{ fontSize:13, marginBottom:6 }}>No emergency contacts yet</div>
            <div style={{ fontSize:11, lineHeight:1.5 }}>Add at least one person who should be contacted in an emergency.</div>
          </div>
        ) : contacts.map((c, i) => {
          const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
          return (
            <div key={c.id} className="fade-in" style={{ animationDelay:`${i*40}ms`, background:'var(--bg-3)', border:'1px solid var(--border-2)', borderRadius:14, padding:'14px', marginBottom:10, display:'flex', alignItems:'center', gap:12 }}>
              {/* Avatar */}
              <div style={{ width:44, height:44, borderRadius:14, background:`${color}22`, border:`2px solid ${color}55`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'var(--font-head)', fontWeight:800, fontSize:17, color }}>
                {c.name[0]?.toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:2 }}>{c.name}</div>
                <div style={{ fontSize:11, color:'var(--text-3)' }}>
                  <span style={{ color:'rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.06)', borderRadius:4, padding:'1px 6px', marginRight:6, fontSize:10 }}>{c.relation}</span>
                  {c.phone}
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => startEdit(c)} style={{ background:'rgba(20,184,166,0.1)', border:'1px solid rgba(20,184,166,0.25)', borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'var(--teal)' }}>
                  <Edit2 size={13} />
                </button>
                <button onClick={() => del(c)} style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'var(--red)' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}

        {contacts.length > 0 && (
          <div style={{ fontSize:11, color:'var(--text-3)', textAlign:'center', marginTop:8, lineHeight:1.5 }}>
            ✅ {contacts.length} contact{contacts.length > 1 ? 's' : ''} will be alerted in an SOS. Recommended: 3+.
          </div>
        )}
      </div>
    </div>
  );
}
