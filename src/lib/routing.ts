export interface DynamicRoute {
  id: number;
  name: string;
  distance: string;
  duration: string;
  coordinates: [number, number][];
}

// Helper to convert "1262.6" meters to "1.2 km"
function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Helper to convert "112.9" seconds to "2 min"
function formatDuration(seconds: number) {
  const m = Math.round(seconds / 60);
  return m < 1 ? '< 1 min' : `${m} min`;
}

// 1. Geocoding
export async function geocode(query: string): Promise<[number, number] | null> {
  // If it's already coordinates like "22.7196, 75.8577", parse it directly (GPS button uses lat, lng)
  if (query.match(/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/)) {
    const parts = query.split(',').map(s => parseFloat(s.trim()));
    return [parts[1], parts[0]]; // Return [lng, lat]
  }

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'SafePath-App/1.0' }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
    }
    return null;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
}

// 2. Routing
export async function getDynamicRoutes(origin: string, destination: string): Promise<DynamicRoute[] | null> {
  const originCoords = await geocode(origin);
  const destCoords = await geocode(destination);

  if (!originCoords || !destCoords) return null;

  try {
    // Request up to 3 alternatives from OSRM
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?overview=full&geometries=geojson&alternatives=true`);
    const data = await res.json();

    if (data.code !== 'Ok' || !data.routes) return null;

    return data.routes.map((route: any, index: number) => ({
      id: index + 1,
      name: index === 0 ? 'Main Route' : `Alternative ${index}`,
      distance: formatDistance(route.distance),
      duration: formatDuration(route.duration),
      coordinates: route.geometry.coordinates
    }));
  } catch (error) {
    console.error("Routing failed:", error);
    return null;
  }
}

// 3. Real Global Safe Zones (Overpass API)
export interface POI {
  coords: [number, number];
  label: string;
  type: 'police' | 'hospital';
}

export async function getPOIsNearRoute(routeCoords: [number, number][]): Promise<POI[]> {
  if (!routeCoords || routeCoords.length === 0) return [];

  // Pick 3 points along the route to search around: start, middle, end
  const start = routeCoords[0];
  const mid = routeCoords[Math.floor(routeCoords.length / 2)];
  const end = routeCoords[routeCoords.length - 1];

  const pts = [start, mid, end];
  const radius = 2000; // 2km radius around each point

  // Overpass QL to find police and hospitals
  let query = '[out:json];(';
  for (const [lng, lat] of pts) {
    query += `node(around:${radius},${lat},${lng})["amenity"="police"];`;
    query += `way(around:${radius},${lat},${lng})["amenity"="police"];`;
    query += `node(around:${radius},${lat},${lng})["amenity"="hospital"];`;
    query += `way(around:${radius},${lat},${lng})["amenity"="hospital"];`;
  }
  query += ');out center;';

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(query)
    });
    const data = await res.json();
    
    // Deduplicate and map
    const seen = new Set<string>();
    const pois: POI[] = [];
    
    for (const el of data.elements) {
      const type = el.tags?.amenity;
      const label = el.tags?.name || (type === 'police' ? 'Police Station' : 'Hospital');
      const lat = el.lat || el.center?.lat;
      const lng = el.lon || el.center?.lon;
      
      const key = `${lat},${lng}`;
      if (!seen.has(key)) {
        seen.add(key);
        pois.push({ coords: [lng, lat], label, type });
      }
    }
    return pois;
  } catch (err) {
    console.error("Overpass POI fetch failed:", err);
    return [];
  }
}
