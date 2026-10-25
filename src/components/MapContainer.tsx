'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map, Marker, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';

// Default Indore location fallback
const DEFAULT_LNG = 75.8577;
const DEFAULT_LAT = 22.7196;
const DEFAULT_ZOOM = 15;

export default function MapContainer() {
    const mapRef = useRef<MapRef>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isLocating, setIsLocating] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const firstFix = useRef(false);

    // Map style from env
    const mapStyle = process.env.NEXT_PUBLIC_MAP_STYLE || 'https://demotiles.maplibre.org/style.json';

    // Ensure we're on the client side
    useEffect(() => {
        setIsClient(true);
    }, []);

    // ── Fly to location helper ──────────────────────────────────────────
    const flyToLocation = useCallback((lng: number, lat: number) => {
        if (!mapRef.current) return;
        mapRef.current.flyTo({
            center: [lng, lat],
            zoom: DEFAULT_ZOOM,
            duration: 1200,
            essential: true,
        });
    }, []);

    // ── Live Location Tracking via watchPosition ────────────────────────
    useEffect(() => {
        if (!isClient || typeof navigator === 'undefined') return;

        if (!navigator.geolocation) {
            console.warn('Geolocation not supported — using Indore default');
            setUserLocation([DEFAULT_LNG, DEFAULT_LAT]);
            setIsLocating(false);
            setLocationError('Geolocation not supported on this device');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { longitude, latitude, accuracy: acc } = position.coords;
                console.log('🟢 Live Location Updated:', latitude, longitude, '±', acc, 'm');

                setUserLocation([longitude, latitude]);
                setAccuracy(acc);
                setIsLocating(false);
                setLocationError(null);

                // On first GPS fix: fly the map to the real location
                if (!firstFix.current) {
                    firstFix.current = true;
                    // Small delay to ensure map is mounted before flyTo
                    setTimeout(() => flyToLocation(longitude, latitude), 300);
                } else {
                    // Subsequent updates: smoothly pan to new position
                    flyToLocation(longitude, latitude);
                }
            },
            (error) => {
                console.warn('📍 Location Error:', error.message);
                setIsLocating(false);

                if (!firstFix.current) {
                    // Use Indore default if we never got a real fix
                    setUserLocation([DEFAULT_LNG, DEFAULT_LAT]);
                    setLocationError(`Location unavailable: ${error.message}`);
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,        // Always get a fresh position
                timeout: 10000,       // 10 s timeout
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isClient]);

    // ── Loading state ────────────────────────────────────────────────────
    if (!isClient) {
        return (
            <div style={{
                width: '100%', height: 320,
                background: 'rgba(20,184,166,0.05)',
                border: '1px solid rgba(20,184,166,0.2)',
                borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 10,
            }}>
                <div style={{ fontSize: 28 }}>🗺️</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading map…</div>
            </div>
        );
    }

    // ── Acquiring location state ────────────────────────────────────────
    if (isLocating) {
        return (
            <div style={{
                width: '100%', height: 320,
                background: 'rgba(20,184,166,0.05)',
                border: '1px solid rgba(20,184,166,0.2)',
                borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 12,
            }}>
                <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    border: '3px solid rgba(20,184,166,0.3)',
                    borderTopColor: 'var(--teal)',
                    animation: 'spin 1s linear infinite',
                }} />
                <div style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600 }}>
                    📍 Acquiring your live location…
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    Please allow location access
                </div>
            </div>
        );
    }

    // Use real location or fallback
    const displayLng = userLocation?.[0] ?? DEFAULT_LNG;
    const displayLat = userLocation?.[1] ?? DEFAULT_LAT;

    return (
        <div style={{ width: '100%', position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
            {/* Live indicator badge */}
            <div style={{
                position: 'absolute', top: 10, left: 10, zIndex: 10,
                background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(20,184,166,0.4)',
                borderRadius: 10, padding: '5px 10px',
                display: 'flex', alignItems: 'center', gap: 6,
            }}>
                <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: locationError ? '#ef4444' : '#34d399',
                    display: 'inline-block',
                    animation: locationError ? 'none' : 'livePulse 2s infinite',
                }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: locationError ? '#ef4444' : '#34d399' }}>
                    {locationError ? 'Demo Location' : 'Live GPS'}
                </span>
                {accuracy && !locationError && (
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>±{Math.round(accuracy)}m</span>
                )}
            </div>

            {/* Error notice (non-blocking) */}
            {locationError && (
                <div style={{
                    position: 'absolute', bottom: 10, left: 10, right: 10, zIndex: 10,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 8, padding: '6px 10px',
                    fontSize: 11, color: '#fca5a5', backdropFilter: 'blur(8px)',
                }}>
                    ⚠️ {locationError} — Showing Indore default
                </div>
            )}

            {/* The Map */}
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: displayLng,
                    latitude: displayLat,
                    zoom: DEFAULT_ZOOM,
                }}
                style={{ width: '100%', height: 320 }}
                mapStyle={mapStyle}
                attributionControl={false}
            >
                <NavigationControl position="top-right" />

                {/* ── Your live location marker ── */}
                <Marker longitude={displayLng} latitude={displayLat} anchor="center">
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Pulsing ring */}
                        <div style={{
                            position: 'absolute',
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'rgba(20,184,166,0.25)',
                            animation: 'livePulse 2s infinite',
                        }} />
                        {/* Inner dot */}
                        <div style={{
                            width: 16, height: 16, borderRadius: '50%',
                            background: '#14b8a6',
                            border: '3px solid #fff',
                            boxShadow: '0 2px 8px rgba(20,184,166,0.6)',
                            zIndex: 1,
                        }} />
                    </div>
                </Marker>

                {/* ── Example danger zone marker ── */}
                <Marker longitude={75.85} latitude={22.72} anchor="center">
                    <div title="Reported danger zone" style={{
                        fontSize: 22, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                        cursor: 'pointer',
                    }}>⚠️</div>
                </Marker>

                {/* ── Safe zone example ── */}
                <Marker longitude={75.862} latitude={22.725} anchor="center">
                    <div title="Police Station" style={{
                        fontSize: 22, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                        cursor: 'pointer',
                    }}>🚔</div>
                </Marker>
            </Map>

            <style>{`
                @keyframes livePulse {
                    0%   { transform: scale(1);   opacity: 1; }
                    50%  { transform: scale(1.5); opacity: 0.4; }
                    100% { transform: scale(1);   opacity: 1; }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
