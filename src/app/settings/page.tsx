'use client';
import { useState, useEffect } from 'react';
import { Trash2, Download, ChevronRight, Lock, LockOpen, Users, Wifi, WifiOff, Sun, Moon } from 'lucide-react';
import TopBar from '@/components/TopBar';
import AppShell from '@/components/AppShell';
import ContactManager from '@/components/ContactManager';
import PINLock, { hasPIN, clearPIN } from '@/components/PINLock';
import { toast } from '@/components/Toast';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/translations';
import { useRouter } from 'next/navigation';

interface SettingsRowProps { label: string; sub?: string; right: React.ReactNode; onClick?: () => void; }
function SettingsRow({ label, sub, right, onClick }: SettingsRowProps) {
  return (
    <div className="settings-row" onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div>{right}</div>
    </div>
  );
}

interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; }
function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <label className="toggle-wrap">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  );
}

// Offline badge
function OfflineBadge() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return (
    <span style={{ fontSize: 12, color: online ? 'var(--green)' : 'var(--red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
      {online ? <Wifi size={12} /> : <WifiOff size={12} />}
      {online ? 'Online' : 'Offline'}
    </span>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { profile, language, setLanguage, deleteAllData, darkMode, toggleDarkMode } = useStore();
  const t = useTranslation(language);

  const [toggles, setToggles] = useState({
    locationShare: true, voiceSOS: true, autoCheckin: true,
    deviation: true, anonymous: false, push: true, sms: true, areaAlerts: false,
  });
  const setToggle = (key: keyof typeof toggles) => (val: boolean) =>
    setToggles(prev => ({ ...prev, [key]: val }));

  const [showContacts, setShowContacts] = useState(false);
  const [showPINSet,   setShowPINSet]   = useState(false);
  const [pinEnabled,   setPinEnabled]   = useState(false);

  useEffect(() => { setPinEnabled(hasPIN()); }, []);

  const handleDeleteData = () => {
    if (window.confirm('Delete ALL data? This cannot be undone.')) {
      deleteAllData();
      router.replace('/onboard');
    }
  };

  const handlePINToggle = (val: boolean) => {
    if (val) {
      setShowPINSet(true);
    } else {
      clearPIN();
      setPinEnabled(false);
      toast.info('PIN removed', 'App lock has been disabled.');
    }
  };

  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'US';

  return (
    <AppShell>
      {/* Overlays */}
      {showContacts && <ContactManager onClose={() => setShowContacts(false)} />}
      {showPINSet && (
        <PINLock
          mode="set"
          onSuccess={() => { setShowPINSet(false); setPinEnabled(true); toast.success('PIN enabled', 'Your app is now protected.'); }}
          onCancel={() => setShowPINSet(false)}
        />
      )}

      <TopBar showLogo />
      <div style={{ padding: 16, paddingBottom: 100 }}>

        <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{t('settingsTitle')}</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>{t('settingsSubtitle')}</div>

        {/* Profile card */}
        <div className="card" style={{ marginBottom: 24, cursor: 'pointer' }} onClick={() => setShowContacts(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(20,184,166,0.2), rgba(59,130,246,0.15))', border: '2px solid rgba(20,184,166,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 18, color: 'var(--teal)', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{profile.name || 'Set your name'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 1 }}>
                {profile.vulnerabilityType || 'Solo Woman'} · {profile.contacts.length} emergency contact{profile.contacts.length !== 1 ? 's' : ''}
              </div>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--text-3)' }} />
          </div>
        </div>

        {/* Emergency Contacts section */}
        <div className="section-h">Emergency Contacts</div>
        <div className="card" style={{ marginBottom: 20 }}>
          <SettingsRow
            label="Manage Contacts"
            sub={profile.contacts.length === 0 ? 'No contacts added yet — add someone now' : `${profile.contacts.length} contact${profile.contacts.length > 1 ? 's' : ''} configured`}
            onClick={() => setShowContacts(true)}
            right={
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:11, background:'rgba(20,184,166,0.1)', color:'var(--teal)', border:'1px solid rgba(20,184,166,0.3)', borderRadius:6, padding:'2px 8px', fontWeight:700 }}>
                  {profile.contacts.length} / 5
                </span>
                <Users size={16} style={{ color: 'var(--teal)' }} />
              </div>
            }
          />
        </div>

        {/* Security */}
        <div className="section-h">Security</div>
        <div className="card" style={{ marginBottom: 20 }}>
          <SettingsRow
            label="App PIN Lock"
            sub={pinEnabled ? '4-digit PIN is active' : 'Add a PIN to secure SafePath'}
            right={
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {pinEnabled ? <Lock size={14} style={{ color:'var(--teal)' }} /> : <LockOpen size={14} style={{ color:'var(--text-3)' }} />}
                <Toggle checked={pinEnabled} onChange={handlePINToggle} />
              </div>
            }
          />
          <SettingsRow
            label="Dark / Light Mode"
            sub={darkMode ? 'Currently dark mode' : 'Currently light mode'}
            right={
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {darkMode ? <Moon size={14} style={{ color:'#a78bfa' }} /> : <Sun size={14} style={{ color:'var(--amber)' }} />}
                <Toggle checked={darkMode} onChange={() => toggleDarkMode()} />
              </div>
            }
          />
        </div>

        {/* Privacy */}
        <div className="section-h">{t('privacy')}</div>
        <div className="card" style={{ marginBottom: 20 }}>
          <SettingsRow label={t('shareRealtime')} sub={t('shareRealtimeSub')} right={<Toggle checked={toggles.locationShare} onChange={setToggle('locationShare')} />} />
          <SettingsRow label={t('voiceSOS')}      sub={t('voiceSOSSub')}      right={<Toggle checked={toggles.voiceSOS}      onChange={setToggle('voiceSOS')}      />} />
          <SettingsRow label={t('autoCheckin')}   sub={t('autoCheckinSub')}   right={<Toggle checked={toggles.autoCheckin}   onChange={setToggle('autoCheckin')}   />} />
          <SettingsRow label={t('deviationAlerts')} sub={t('deviationSub')}   right={<Toggle checked={toggles.deviation}     onChange={setToggle('deviation')}     />} />
          <SettingsRow label={t('anonymousMode')} sub={t('anonymousSub')}     right={<Toggle checked={toggles.anonymous}     onChange={setToggle('anonymous')}     />} />
        </div>

        {/* Notifications */}
        <div className="section-h">{t('notifications')}</div>
        <div className="card" style={{ marginBottom: 20 }}>
          <SettingsRow label={t('pushNotif')}   sub={t('pushSub')}  right={<Toggle checked={toggles.push}       onChange={setToggle('push')}       />} />
          <SettingsRow label={t('smsFallback')} sub={t('smsSub')}   right={<Toggle checked={toggles.sms}        onChange={setToggle('sms')}        />} />
          <SettingsRow label={t('areaAlerts')}  sub={t('areaSub')}  right={<Toggle checked={toggles.areaAlerts} onChange={setToggle('areaAlerts')} />} />
        </div>

        {/* App */}
        <div className="section-h">{t('appSection')}</div>
        <div className="card" style={{ marginBottom: 20 }}>
          <SettingsRow
            label={t('language')}
            right={
              <div className="lang-toggle">
                <div className={`lang-opt ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</div>
                <div className={`lang-opt ${language === 'hi' ? 'active' : ''}`} onClick={() => setLanguage('hi')}>हि</div>
              </div>
            }
          />
          <SettingsRow label="Network Status"  sub="Live connectivity check" right={<OfflineBadge />} />
          <SettingsRow label={t('offlineMode')} sub="Basic features work without internet" right={<span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>{t('offlineActive')}</span>} />
          <SettingsRow label={t('appVersion')}  sub="SafePath v1.0.0 · BGI Hackathon 2026" right={<span style={{ fontSize: 12, color: 'var(--text-3)' }}>Latest</span>} />
        </div>

        {/* Data */}
        <div className="section-h">{t('dataSection')}</div>
        <div className="card" style={{ marginBottom: 24 }}>
          <SettingsRow
            label={t('exportData')} sub={t('exportSub')}
            onClick={() => toast.info('Export feature', 'Connect Firebase to download journey history as CSV.')}
            right={<Download size={16} style={{ color: 'var(--teal)' }} />}
          />
          <SettingsRow
            label={t('deleteData')} sub={t('deleteSub')}
            onClick={handleDeleteData}
            right={<Trash2 size={16} style={{ color: 'var(--red)' }} />}
          />
        </div>

        {/* Team */}
        <div style={{ background: 'var(--bg-3)', borderRadius: 14, padding: 16, textAlign: 'center', border: '1px solid var(--border-2)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Built with ❤️ for Indore</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)' }}>Team The Riser · BGI Hackathon 2026</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>Aditya Das · Raj Agrawal · Jayesh Kushwaha · Abhishek Raj</div>
        </div>
      </div>
    </AppShell>
  );
}
