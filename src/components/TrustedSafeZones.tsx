'use client';
import { useState } from 'react';
import { MapPin, Plus, X, Home, Briefcase, Users, AlertCircle } from 'lucide-react';
import { useStore, SafeZone } from '@/store/useStore';
import { toast } from '@/components/Toast';

const ZONE_TYPES = [
    { id: 'home', label: 'Home', icon: '🏠', emoji: '🏠' },
    { id: 'work', label: 'Work', icon: '💼', emoji: '💼' },
    { id: 'friend', label: 'Friend', icon: '👥', emoji: '👥' },
    { id: 'police', label: 'Police Station', icon: '🚔', emoji: '🚔' },
    { id: 'other', label: 'Other', icon: '📍', emoji: '📍' },
];

export default function TrustedSafeZones() {
    const { safeZones, addSafeZone, removeSafeZone, journey } = useStore();
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<'home' | 'work' | 'friend' | 'police' | 'other'>('home');
    const [useCurrentLocation, setUseCurrentLocation] = useState(true);
    const [lat, setLat] = useState(22.7196);
    const [lng, setLng] = useState(75.8577);

    const handleAddZone = () => {
        if (!name.trim()) {
            toast.error('Error', 'Please enter a name');
            return;
        }

        const newZone: SafeZone = {
            id: `${type}-${Date.now()}`,
            name,
            type,
            lat: useCurrentLocation ? (journey.currentLocation?.lat || lat) : lat,
            lng: useCurrentLocation ? (journey.currentLocation?.lng || lng) : lng,
            radius: 500,
            addedAt: new Date().toISOString(),
        };

        addSafeZone(newZone);
        toast.success('✅ Safe Zone Added', `${name} is now protected`);

        setName('');
        setType('home');
        setShowForm(false);
    };

    const handleRemoveZone = (id: string) => {
        removeSafeZone(id);
        toast.info('Removed', 'Safe zone removed');
    };

    const getZoneIcon = (typeId: string) => {
        const zone = ZONE_TYPES.find(z => z.id === typeId);
        return zone?.emoji || '📍';
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(20,184,166,0.08))',
            border: '1px solid rgba(34,197,94,0.15)',
            borderRadius: 16,
            padding: '16px',
            marginBottom: 16,
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(34,197,94,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <MapPin size={20} color="#22c55e" />
                    </div>
                    <div>
                        <h3 style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'var(--text)',
                            margin: 0,
                        }}>
                            Trusted Safe Zones
                        </h3>
                        <p style={{
                            fontSize: 11,
                            color: 'var(--text-3)',
                            margin: '2px 0 0 0',
                        }}>
                            Alert when leaving alone
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: 'none',
                        background: 'rgba(34,197,94,0.2)',
                        color: '#22c55e',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 18,
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.2)')}
                >
                    {showForm ? '✕' : '+'}
                </button>
            </div>

            {/* Add Zone Form */}
            {showForm && (
                <div style={{
                    background: 'rgba(20,184,166,0.05)',
                    border: '1px solid rgba(20,184,166,0.2)',
                    borderRadius: 12,
                    padding: '14px',
                    marginBottom: 14,
                }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>
                        Zone Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Mom's House"
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: 8,
                            border: '1px solid rgba(100,116,139,0.2)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--text)',
                            fontSize: 13,
                            marginBottom: 10,
                            boxSizing: 'border-box',
                        }}
                    />

                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>
                        Type
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                        {ZONE_TYPES.map(z => (
                            <button
                                key={z.id}
                                onClick={() => setType(z.id as any)}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    border: type === z.id ? '2px solid #14b8a6' : '1px solid rgba(100,116,139,0.2)',
                                    background: type === z.id ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.05)',
                                    color: type === z.id ? '#14b8a6' : 'var(--text-2)',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {z.emoji} {z.label}
                            </button>
                        ))}
                    </div>

                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={useCurrentLocation}
                            onChange={(e) => setUseCurrentLocation(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                        />
                        Use current location
                    </label>

                    <button
                        onClick={handleAddZone}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#22c55e',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(34,197,94,0.4)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        ✓ Add Safe Zone
                    </button>
                </div>
            )}

            {/* Zones List */}
            {safeZones.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {safeZones.map((zone) => (
                        <div
                            key={zone.id}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(20,184,166,0.15)',
                                borderRadius: 10,
                                padding: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ fontSize: 20 }}>{getZoneIcon(zone.type)}</div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                                        {zone.name}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                                        {zone.radius}m radius • {zone.type}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemoveZone(zone.id)}
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 6,
                                    border: 'none',
                                    background: 'rgba(239,68,68,0.15)',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.25)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '20px 12px',
                    color: 'var(--text-3)',
                }}>
                    <AlertCircle size={24} style={{ opacity: 0.5, margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 12, margin: 0 }}>No safe zones yet. Add your first one!</p>
                </div>
            )}
        </div>
    );
}
