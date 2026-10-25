'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getFirestoreInstance } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Incident {
  id: string;
  lat: number;
  lng: number;
  type: string;
  severity: number;
  timestamp: string;
}

interface SafeMapProps {
  selectedRouteCoords?: [number, number][];
  dynamicPOIs?: { coords: [number, number]; label: string; type: 'police' | 'hospital' }[];
}

export default function SafeMap({ selectedRouteCoords, dynamicPOIs }: SafeMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  // Fetch recent 1-2 months incidents from Firebase
  const fetchRecentIncidents = async () => {
    const db = getFirestoreInstance();
    if (!db) {
      console.warn('Firestore is not initialized');
      return;
    }

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // Example using Firebase (adjust with your firebase config)
    const q = query(
      collection(db, 'incidents'),
      where('timestamp', '>=', twoMonthsAgo.toISOString())
    );

    try {
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Incident[];

      setIncidents(data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: process.env.NEXT_PUBLIC_MAP_STYLE || 'https://tiles.openfreemap.org/styles/liberty',
      center: [75.8577, 22.7196], // Indore
      zoom: 12.5,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Fetch data when map loads
    map.current.on('load', () => {
      fetchRecentIncidents();
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add/Update Heatmap Layer whenever incidents change
  useEffect(() => {
    if (!map.current || incidents.length === 0) return;

    const addOrUpdateHeatmap = () => {
      if (!map.current) return;

      const geojson = {
        type: 'FeatureCollection' as const,
        features: incidents.map(inc => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [inc.lng, inc.lat]
          },
          properties: {
            severity: inc.severity,
            type: inc.type
          }
        }))
      };

      // Remove old layer if exists
      if (map.current.getSource('risk-heatmap')) {
        map.current.removeLayer('risk-heatmap');
        map.current.removeSource('risk-heatmap');
      }

      map.current.addSource('risk-heatmap', {
        type: 'geojson',
        data: geojson
      });

      // Heatmap Layer
      map.current.addLayer({
        id: 'risk-heatmap',
        type: 'heatmap',
        source: 'risk-heatmap',
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'severity'], 1, 0.5, 5, 2],
          'heatmap-intensity': 0.8,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,255,0,0)',
            0.3, 'rgba(255,255,0,0.8)',
            0.6, 'rgba(255,165,0,0.9)',
            1, 'rgba(255,0,0,0.95)'
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 15, 15, 30],
          'heatmap-opacity': 0.85
        }
      });
    };

    if (map.current.isStyleLoaded()) {
      addOrUpdateHeatmap();
    } else {
      map.current.once('load', addOrUpdateHeatmap);
    }
  }, [incidents]);

  // ── Render Dynamic Real-World POIs ──────────────────────────────────────────
  useEffect(() => {
    if (!map.current || !dynamicPOIs || dynamicPOIs.length === 0) return;

    const drawZones = () => {
      if (!map.current) return;

      const geojson = {
        type: 'FeatureCollection' as const,
        features: dynamicPOIs.map(poi => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: poi.coords },
          properties: { label: poi.label, type: poi.type }
        }))
      };

      if (map.current.getSource('dynamic-pois')) {
        (map.current.getSource('dynamic-pois') as maplibregl.GeoJSONSource).setData(geojson);
        return;
      }

      map.current.addSource('dynamic-pois', { type: 'geojson', data: geojson });
      
      map.current.addLayer({
        id: 'dynamic-pois-circles',
        type: 'circle',
        source: 'dynamic-pois',
        paint: {
          'circle-color': [
            'match', ['get', 'type'],
            'police', 'rgba(34, 197, 94, 0.4)',
            'hospital', 'rgba(59, 130, 246, 0.4)',
            'rgba(34, 197, 94, 0.4)'
          ],
          'circle-radius': 30,
          'circle-stroke-width': 2,
          'circle-stroke-color': [
            'match', ['get', 'type'],
            'police', '#22c55e',
            'hospital', '#3b82f6',
            '#22c55e'
          ]
        }
      });
      
      map.current.addLayer({
        id: 'dynamic-pois-labels',
        type: 'symbol',
        source: 'dynamic-pois',
        layout: {
          'text-field': [
            'format',
            ['match', ['get', 'type'], 'police', '🛡️', 'hospital', '🏥', '🛡️'],
            { 'font-scale': 1.2 },
            '\n', {},
            ['get', 'label'], {}
          ],
          'text-size': 11,
          'text-variable-anchor': ['top'],
          'text-radial-offset': 1,
          'text-justify': 'center'
        },
        paint: {
          'text-color': '#1f2937',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });
    };

    if (map.current.isStyleLoaded()) {
      drawZones();
    } else {
      map.current.once('load', drawZones);
    }
  }, [dynamicPOIs]);

  // ── Render Route Polyline ───────────────────────────────────────────────────
  useEffect(() => {
    if (!map.current) return;

    const drawRoute = () => {
      if (!map.current) return;
      
      const sourceId = 'selected-route';
      const layerId = 'selected-route-line';

      if (map.current.getSource(sourceId)) {
        map.current.removeLayer(layerId);
        map.current.removeSource(sourceId);
      }

      if (!selectedRouteCoords || selectedRouteCoords.length === 0) return;

      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: selectedRouteCoords
          }
        }
      });

      map.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6', // Bright blue for the route
          'line-width': 6,
          'line-opacity': 0.8
        }
      });
      
      // Animate map to route bounds
      const bounds = new maplibregl.LngLatBounds(
        selectedRouteCoords[0],
        selectedRouteCoords[0]
      );
      for (const coord of selectedRouteCoords) {
        bounds.extend(coord as [number, number]);
      }
      map.current.fitBounds(bounds, { padding: 40, duration: 1000 });
    };

    if (map.current.isStyleLoaded()) {
      drawRoute();
    } else {
      map.current.once('load', drawRoute);
    }
  }, [selectedRouteCoords]);

  return (
    <div ref={mapContainer} style={{ width: '100%', height: '600px', borderRadius: '0.5rem', overflow: 'hidden' }} />
  );
}