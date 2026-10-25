'use client';
import { useState } from 'react';
import { AlertTriangle, Plus, MapPin, TrendingUp } from 'lucide-react';
import { useStore, IncidentReport } from '@/store/useStore';
import { toast } from '@/components/Toast';

const INCIDENT_TYPES = [
    { id: 'harassment', label: 'Harassment', emoji: '😠', color: '#f59e0b' },
    { id: 'robbery', label: 'Robbery', emoji: '💰', color: '#ef4444' },
    { id: 'assault', label: 'Assault', emoji: '⚠️', color: '#dc2626' },
    { id: 'stalking', label: 'Stalking', emoji: '👁️', color: '#a16207' },
    { id: 'other', label: 'Other', emoji: '❓', color: '#6b7280' },
];

export default function CommunityHeatMap() {
    const { incidentReports, addIncidentReport, journey } = useStore();
    const [showForm, setShowForm] = useState(false);
    const [reportType, setReportType] = useState<'harassment' | 'robbery' | 'assault' | 'stalking' | 'other'>('harassment');
    const [severity, setSeverity] = useState<1 | 2 | 3 | 4 | 5>(3);
    const [description, setDescription] = useState('');
    const [anonymous, setAnonymous] = useState(true);
    const [useCurrentLocation, setUseCurrentLocation] = useState(true);
    const [lat, setLat] = useState(22.7196);
    const [lng, setLng] = useState(75.8577);

    const handleSubmitReport = () => {
        if (!description.trim()) {
            toast.error('Error', 'Please describe the incident');
            return;
        }

        const newReport: IncidentReport = {
            id: `report-${Date.now()}`,
            lat: useCurrentLocation ? (journey.currentLocation?.lat || lat) : lat,
            lng: useCurrentLocation ? (journey.currentLocation?.lng || lng) : lng,
            type: reportType,
            timestamp: new Date().toISOString(),
            severity,
            anonymous,
            description,
        };

        addIncidentReport(newReport);
        toast.success('✅ Report Submitted', 'Thank you for helping the community stay safe');

        setReportType('harassment');
        setSeverity(3);
        setDescription('');
        setShowForm(false);
    };

    // Get nearby incidents (within 1km)
    const getNearbyIncidents = () => {
        const currentLat = journey.currentLocation?.lat || 22.7196;
        const currentLng = journey.currentLocation?.lng || 75.8577;

        return incidentReports.filter(report => {
            const latDiff = Math.abs(report.lat - currentLat);
            const lngDiff = Math.abs(report.lng - currentLng);
            return latDiff < 0.01 && lngDiff < 0.01; // ~1km radius
        });
    };

    const nearbyIncidents = getNearbyIncidents();
    const avgSeverity = nearbyIncidents.length > 0
        ? Math.round(nearbyIncidents.reduce((sum, r) => sum + r.severity, 0) / nearbyIncidents.length)
        : 0;

    const getSeverityColor = (sev: number) => {
        if (sev >= 4) return '#dc2626';
        if (sev >= 3) return '#ef4444';
        if (sev >= 2) return '#f59e0b';
        return '#fbbf24';
    };

    const getIncidentEmoji = (type: string) => {
        return INCIDENT_TYPES.find(t => t.id === type)?.emoji || '❓';
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.08))',
            border: '1px solid rgba(245,158,11,0.15)',
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
                        background: 'rgba(245,158,11,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <TrendingUp size={20} color="#f59e0b" />
                    </div>
                    <div>
                        <h3 style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'var(--text)',
                            margin: 0,
                        }}>
                            Community Safety Map
                        </h3>
                        <p style={{
                            fontSize: 11,
                            color: 'var(--text-3)',
                            margin: '2px 0 0 0',
                        }}>
                            Crowdsourced incident reports
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
                        background: 'rgba(245,158,11,0.2)',
                        color: '#f59e0b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 18,
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.2)')}
                >
                    {showForm ? '✕' : '+'}
                </button>
            </div>

            {/* Report Form */}
            {showForm && (
                <div style={{
                    background: 'rgba(245,158,11,0.05)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 12,
                    padding: '14px',
                    marginBottom: 14,
                }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>
                        What happened?
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                        {INCIDENT_TYPES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setReportType(t.id as any)}
                                style={{
                                    padding: '8px 10px',
                                    borderRadius: 6,
                                    border: reportType === t.id ? `2px solid ${t.color}` : '1px solid rgba(100,116,139,0.2)',
                                    background: reportType === t.id ? `${t.color}20` : 'rgba(255,255,255,0.05)',
                                    color: reportType === t.id ? t.color : 'var(--text-2)',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {t.emoji} {t.label}
                            </button>
                        ))}
                    </div>

                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>
                        Severity: {severity}/5
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="5"
                        value={severity}
                        onChange={(e) => setSeverity(Number(e.target.value) as any)}
                        style={{
                            width: '100%',
                            marginBottom: 10,
                            cursor: 'pointer',
                        }}
                    />

                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What happened? (details help others)"
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: 8,
                            border: '1px solid rgba(100,116,139,0.2)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--text)',
                            fontSize: 12,
                            minHeight: 60,
                            boxSizing: 'border-box',
                            marginBottom: 10,
                            fontFamily: 'inherit',
                            resize: 'vertical',
                        }}
                    />

                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={anonymous}
                            onChange={(e) => setAnonymous(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                        />
                        Report anonymously
                    </label>

                    <button
                        onClick={handleSubmitReport}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#f59e0b',
                            color: '#000',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.4)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        ✓ Submit Report
                    </button>
                </div>
            )}

            {/* Risk Status */}
            {nearbyIncidents.length > 0 && (
                <div style={{
                    background: `${getSeverityColor(avgSeverity)}20`,
                    border: `1px solid ${getSeverityColor(avgSeverity)}40`,
                    borderRadius: 10,
                    padding: '12px',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }}>
                    <AlertTriangle size={18} color={getSeverityColor(avgSeverity)} />
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                            ⚠️ {nearbyIncidents.length} incident{nearbyIncidents.length !== 1 ? 's' : ''} nearby
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                            Average severity: {avgSeverity}/5
                        </div>
                    </div>
                </div>
            )}

            {/* Incidents List */}
            {incidentReports.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>
                        Recent Reports
                    </div>
                    {incidentReports.slice(-5).reverse().map((report) => (
                        <div
                            key={report.id}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: `1px solid ${getSeverityColor(report.severity)}40`,
                                borderLeft: `3px solid ${getSeverityColor(report.severity)}`,
                                borderRadius: 8,
                                padding: '10px 12px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'start', gap: 10 }}>
                                <div style={{ fontSize: 16 }}>{getIncidentEmoji(report.type)}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                                        {INCIDENT_TYPES.find(t => t.id === report.type)?.label}
                                    </div>
                                    <p style={{ fontSize: 11, color: 'var(--text-2)', margin: '4px 0', lineHeight: 1.4 }}>
                                        {report.description}
                                    </p>
                                    <div style={{ fontSize: 10, color: 'var(--text-3)', display: 'flex', gap: 8 }}>
                                        <span>Severity: {'⭐'.repeat(report.severity)}</span>
                                        <span>•</span>
                                        <span>{report.anonymous ? 'Anonymous' : 'Reported'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '20px 12px',
                    color: 'var(--text-3)',
                }}>
                    <MapPin size={24} style={{ opacity: 0.5, margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 12, margin: 0 }}>No reports yet. Community data helps everyone stay safe!</p>
                </div>
            )}
        </div>
    );
}
