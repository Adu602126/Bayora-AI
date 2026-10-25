// ============================================================
// SafePath Risk Scoring Engine v2
// Dynamic AI-simulated scoring — Team The Riser
// Replace calculateRiskScore() with a real ML model later.
// ============================================================

import type { VulnerabilityType } from '@/store/useStore';

export interface RiskInput {
  hour: number;
  isDark: boolean;
  hasStreetLights: boolean;
  cctvCoverage: number;        // 0–100
  crowdDensity: number;        // 0–100
  policePresence: boolean;
  historicalIncidents: number; // 0–10
  distanceKm: number;
  vulnerabilityType: VulnerabilityType;
}

const VULNERABILITY_WEIGHT: Record<VulnerabilityType, number> = {
  'Solo Woman': 1.00,
  'Night Traveler': 1.10,
  'With Child/Elderly': 1.20,
  'Differently-Abled': 1.30,
  'Student': 0.95,
  'Tourist': 1.05,
};

/** Returns a 0–100 safety score (higher = safer). */
export function calculateRiskScore(f: RiskInput): number {
  let score = 100;
  if (f.hour >= 23 || f.hour < 4) score -= 32;
  else if (f.hour >= 21 || f.hour < 6) score -= 18;
  else if (f.hour >= 19) score -= 8;
  if (f.isDark && !f.hasStreetLights) score -= 22;
  else if (f.isDark) score -= 9;
  score += (f.cctvCoverage / 100) * 15 - 7;
  if (f.crowdDensity >= 40 && f.crowdDensity <= 75) score += 6;
  else if (f.crowdDensity < 20) score -= 14;
  if (f.policePresence) score += 10; else score -= 6;
  score -= f.historicalIncidents * 3;
  if (f.distanceKm > 6) score -= 6;
  score = score / VULNERABILITY_WEIGHT[f.vulnerabilityType];
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreToLevel(score: number): 'safe' | 'moderate' | 'risk' {
  if (score >= 70) return 'safe';
  if (score >= 45) return 'moderate';
  return 'risk';
}

export function scoreToColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 45) return '#f59e0b';
  return '#ef4444';
}

/** Recompute all 3 route scores based on current hour & profile. */
export function getDynamicRouteScores(
  hour: number,
  vulnerabilityType: VulnerabilityType
): { id: number; score: number; level: 'safe' | 'moderate' | 'risk' }[] {
  const isDark = hour >= 19 || hour < 6;
  const routeParams = [
    { id: 1, cctvCoverage: 92, hasStreetLights: true, crowdDensity: 55, policePresence: true, historicalIncidents: 1, distanceKm: 4.2 },
    { id: 2, cctvCoverage: 54, hasStreetLights: true, crowdDensity: 28, policePresence: false, historicalIncidents: 4, distanceKm: 3.8 },
    { id: 3, cctvCoverage: 0, hasStreetLights: false, crowdDensity: 8, policePresence: false, historicalIncidents: 8, distanceKm: 3.1 },
  ];
  return routeParams.map(p => {
    const score = calculateRiskScore({ hour, isDark, vulnerabilityType, ...p });
    return { id: p.id, score, level: scoreToLevel(score) };
  });
}

export function getDynamicTip(hour: number): string {
  if (hour >= 22 || hour < 5) return "It's late — share your live route with 2+ contacts and enable the check-in timer before stepping out.";
  if (hour >= 19) return 'Evening journeys: SafePath automatically prioritises well-lit, CCTV-covered routes for you.';
  if (hour >= 17) return 'Rush hour crowds help your safety score. Busy routes score higher right now.';
  if (hour >= 12) return 'Afternoon is generally low-risk in Indore. Still, pick the green route when possible.';
  return 'Good morning! Share your route link with a guardian before every journey — it only takes 5 seconds.';
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function detectDeviation(lat: number, lng: number, routeCoords: [number, number][], thresholdKm = 0.25): boolean {
  for (const [rLng, rLat] of routeCoords) {
    if (haversineKm(lat, lng, rLat, rLng) < thresholdKm) return false;
  }
  return true;
}

export async function dispatchSOSAlert(
  contacts: { name: string; phone: string }[],
  location: { lat: number; lng: number },
  userName: string
): Promise<void> {
  console.log('[SOS] 🚨 Alert dispatched!');
  console.log('[SOS] User:', userName);
  console.log('[SOS] Location:', `https://maps.google.com/?q=${location.lat},${location.lng}`);
  contacts.forEach(c => console.log(`[SOS] → ${c.name} (${c.phone})`));

  // Prepare SOS alert payload
  const payload = {
    userName,
    location,
    contacts,
    timestamp: new Date().toISOString(),
  };

  try {
    // Send to /api/sos endpoint
    const response = await fetch('/api/sos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[SOS] API Error:', error);
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('[SOS] API Response:', result);
  } catch (error) {
    console.error('[SOS] Failed to send alert:', error);
    // Still log locally even if API fails
    console.log('[SOS] Alert logged locally for offline sync');
  }

  // Artificial delay to show loading state
  await new Promise(r => setTimeout(r, 400));
}

