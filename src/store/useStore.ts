// SafePath Global State Store
// Zustand - Team The Riser

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VulnerabilityType =
  | 'Solo Woman'
  | 'Night Traveler'
  | 'With Child/Elderly'
  | 'Differently-Abled'
  | 'Student'
  | 'Tourist';

export type Language = 'en' | 'hi' | 'mr';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  vulnerabilityType: VulnerabilityType;
  contacts: EmergencyContact[];
  onboardingComplete: boolean;
}

export interface RouteOption {
  id: number;
  name: string;
  distance: string;
  duration: string;
  safetyScore: number;
  level: 'safe' | 'moderate' | 'risk';
  factors: { label: string; value: string }[];
  coordinates: [number, number][];
}

export interface Journey {
  active: boolean;
  routeId: number | null;
  startTime: string | null;   // ISO string — safe for JSON serialization
  checkInTimer: number;       // seconds
  currentLocation: { lat: number; lng: number } | null;
  deviationDetected: boolean;
}

export interface SafeZone {
  id: string;
  name: string;
  type: 'home' | 'work' | 'friend' | 'police' | 'other';
  lat: number;
  lng: number;
  radius: number;  // in meters
  addedAt: string;
}

export interface IncidentReport {
  id: string;
  lat: number;
  lng: number;
  type: 'harassment' | 'robbery' | 'assault' | 'stalking' | 'other';
  timestamp: string;
  severity: 1 | 2 | 3 | 4 | 5;  // 1=low, 5=critical
  anonymous: boolean;
  description?: string;
}

export interface AppState {
  // User
  profile: UserProfile;
  language: Language;

  // Journey
  journey: Journey;

  // Route planning
  origin: string;
  destination: string;
  selectedRouteId: number;
  routes: RouteOption[];

  // SOS
  sosActive: boolean;
  silentSOS: boolean;  // Silent mode: shake triggers alert immediately

  // Safety Features
  safeZones: SafeZone[];
  incidentReports: IncidentReport[];
  checkInFrequency: number;  // seconds, 0 = disabled
  lastCheckIn: string | null;  // ISO string

  // Actions
  setProfile: (p: Partial<UserProfile>) => void;
  setLanguage: (l: Language) => void;
  completeOnboarding: () => void;

  setOrigin: (o: string) => void;
  setDestination: (d: string) => void;
  setSelectedRoute: (id: number) => void;
  setRoutes: (r: RouteOption[]) => void;

  startJourney: (routeId: number) => void;
  endJourney: () => void;
  checkIn: () => void;
  tickCheckIn: () => void;
  updateLocation: (lat: number, lng: number) => void;

  activateSOS: () => void;
  deactivateSOS: () => void;
  setSilentSOS: (enabled: boolean) => void;

  addSafeZone: (zone: SafeZone) => void;
  removeSafeZone: (id: string) => void;
  addIncidentReport: (report: IncidentReport) => void;
  setCheckInFrequency: (seconds: number) => void;
  updateLastCheckIn: () => void;

  // UI
  darkMode: boolean;
  toggleDarkMode: () => void;

  addContact: (c: EmergencyContact) => void;
  removeContact: (id: string) => void;

  deleteAllData: () => void;
}

const defaultProfile: UserProfile = {
  name: '',
  phone: '',
  vulnerabilityType: 'Solo Woman',
  contacts: [],
  onboardingComplete: false,
};

const defaultJourney: Journey = {
  active: false,
  routeId: null,
  startTime: null,
  checkInTimer: 300,
  currentLocation: null,
  deviationDetected: false,
};

const defaultSafeZones: SafeZone[] = [
  {
    id: 'home',
    name: 'Home',
    type: 'home',
    lat: 22.7196,
    lng: 75.8577,
    radius: 500,
    addedAt: new Date().toISOString(),
  },
];

// Mock routes for Indore
export const mockRoutes: RouteOption[] = [
  {
    id: 1,
    name: 'Via Vijay Nagar',
    distance: '4.2 km',
    duration: '14 min',
    safetyScore: 87,
    level: 'safe',
    factors: [
      { label: 'CCTV Coverage', value: 'High (92%)' },
      { label: 'Street Lighting', value: 'Excellent' },
      { label: 'Police Patrolling', value: 'Active' },
      { label: 'Crowd Density', value: 'Moderate' },
      { label: 'Emergency Services', value: '< 2 km away' },
      { label: 'Historical Incidents', value: 'Very Low' },
    ],
    coordinates: [
      [75.8577, 22.7196],
      [75.8600, 22.7220],
      [75.8650, 22.7250],
    ],
  },
  {
    id: 2,
    name: 'Via Bhanwarkua',
    distance: '3.8 km',
    duration: '12 min',
    safetyScore: 58,
    level: 'moderate',
    factors: [
      { label: 'CCTV Coverage', value: 'Moderate (54%)' },
      { label: 'Street Lighting', value: 'Fair' },
      { label: 'Police Patrolling', value: 'Infrequent' },
      { label: 'Crowd Density', value: 'Low' },
      { label: 'Emergency Services', value: '3–5 km away' },
      { label: 'Historical Incidents', value: 'Moderate' },
    ],
    coordinates: [
      [75.8577, 22.7196],
      [75.8530, 22.7180],
      [75.8560, 22.7140],
    ],
  },
  {
    id: 3,
    name: 'Via Old Palasia',
    distance: '3.1 km',
    duration: '10 min',
    safetyScore: 28,
    level: 'risk',
    factors: [
      { label: 'CCTV Coverage', value: 'None (0%)' },
      { label: 'Street Lighting', value: 'Poor' },
      { label: 'Police Patrolling', value: 'None' },
      { label: 'Crowd Density', value: 'Very Low' },
      { label: 'Emergency Services', value: '> 6 km away' },
      { label: 'Historical Incidents', value: 'High' },
    ],
    coordinates: [
      [75.8577, 22.7196],
      [75.8490, 22.7160],
      [75.8510, 22.7120],
    ],
  },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      language: 'en',
      journey: defaultJourney,
      origin: 'Vijay Nagar, Indore',
      destination: 'LIG Square, Indore',
      selectedRouteId: 1,
      routes: mockRoutes,
      sosActive: false,
      silentSOS: false,
      safeZones: defaultSafeZones,
      incidentReports: [],
      checkInFrequency: 600,  // 10 minutes
      lastCheckIn: null,
      darkMode: true,

      setProfile: (p) =>
        set((s) => ({ profile: { ...s.profile, ...p } })),

      setLanguage: (l) => set({ language: l }),

      completeOnboarding: () =>
        set((s) => ({
          profile: { ...s.profile, onboardingComplete: true },
        })),

      setOrigin: (o) => set({ origin: o }),
      setDestination: (d) => set({ destination: d }),
      setSelectedRoute: (id) => set({ selectedRouteId: id }),
      setRoutes: (r) => set({ routes: r }),

      startJourney: (routeId) =>
        set({
          journey: {
            active: true,
            routeId,
            startTime: new Date().toISOString(),   // FIX: ISO string, not Date object
            checkInTimer: 300,
            currentLocation: { lat: 22.7196, lng: 75.8577 },
            deviationDetected: false,
          },
        }),

      endJourney: () => set({ journey: defaultJourney }),

      checkIn: () =>
        set((s) => ({
          journey: { ...s.journey, checkInTimer: 300 },
        })),

      tickCheckIn: () =>
        set((s) => ({
          journey: {
            ...s.journey,
            checkInTimer: Math.max(0, s.journey.checkInTimer - 1),
          },
        })),

      updateLocation: (lat, lng) =>
        set((s) => ({
          journey: { ...s.journey, currentLocation: { lat, lng } },
        })),

      activateSOS: () => set({ sosActive: true }),
      deactivateSOS: () => set({ sosActive: false }),
      setSilentSOS: (enabled) => set({ silentSOS: enabled }),

      addSafeZone: (zone) =>
        set((s) => ({
          safeZones: [...s.safeZones, zone],
        })),

      removeSafeZone: (id) =>
        set((s) => ({
          safeZones: s.safeZones.filter((z) => z.id !== id),
        })),

      addIncidentReport: (report) =>
        set((s) => ({
          incidentReports: [...s.incidentReports, report],
        })),

      setCheckInFrequency: (seconds) => set({ checkInFrequency: seconds }),

      updateLastCheckIn: () => set({ lastCheckIn: new Date().toISOString() }),

      toggleDarkMode: () => set(s => {
        const next = !s.darkMode;
        import('@/lib/theme').then(({ setTheme }) => setTheme(next ? 'dark' : 'light'));
        return { darkMode: next };
      }),

      addContact: (c) =>
        set((s) => ({
          profile: {
            ...s.profile,
            contacts: [...s.profile.contacts, c],
          },
        })),

      removeContact: (id) =>
        set((s) => ({
          profile: {
            ...s.profile,
            contacts: s.profile.contacts.filter((c) => c.id !== id),
          },
        })),

      deleteAllData: () =>
        set({
          profile: defaultProfile,
          journey: defaultJourney,
          sosActive: false,
        }),
    }),
    {
      name: 'safepath-storage',
      partialize: (s) => ({
        profile: s.profile,
        language: s.language,
        origin: s.origin,
        destination: s.destination,
      }),
    }
  )
);
