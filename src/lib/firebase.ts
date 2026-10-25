// ============================================================
// FIREBASE CONFIGURATION & INITIALIZATION
// Team The Riser | SafePath Indore | BGI Hackathon 2026
// ============================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  RecaptchaVerifier,
  GoogleAuthProvider,
} from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import {
  getFirestore,
  enableNetwork,
  disableNetwork,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

// Use inferred return types to avoid Firebase namespace/type conflicts
type FirebaseAuth = ReturnType<typeof getAuth>;
type FirebaseDB = ReturnType<typeof getFirestore>;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "safepath-87f4d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "safepath-87f4d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "safepath-87f4d.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ── Firestore with offline persistence (prevents 503 crashes) ──────────
// Module-level singleton prevents double-init on hot-reload
let _db: ReturnType<typeof getFirestore> | null = null;

function getDb() {
  if (_db) return _db;
  if (typeof window === 'undefined') {
    _db = getFirestore(app);
    return _db;
  }
  try {
    _db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // Already initialized on this app instance (e.g. hot-reload)
    _db = getFirestore(app);
  }
  return _db;
}

export const db = getDb();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Get auth instance (backward compatibility)
export function getAuthInstance(): FirebaseAuth | null {
  if (typeof window === 'undefined') return null;
  return auth;
}

// Get Firestore instance (backward compatibility)
export function getFirestoreInstance(): FirebaseDB | null {
  if (typeof window === 'undefined') return null;
  return db;
}

// Re-export network control for offline/online toggling
export { enableNetwork, disableNetwork };

// ────────────────────────────────────────────────────────────
// PHONE AUTHENTICATION
// ────────────────────────────────────────────────────────────

export async function sendPhoneVerificationCode(
  phoneNumber: string,
  recaptchaContainerId: string = 'recaptcha-container'
): Promise<ConfirmationResult | null> {
  const authInstance = getAuthInstance();
  if (!authInstance) {
    console.error('Auth not initialized');
    return null;
  }

  try {
    // Setup reCAPTCHA — Firebase v9+ signature: (auth, container, params)
    const recaptchaVerifier = new RecaptchaVerifier(authInstance, recaptchaContainerId, {
      size: 'invisible',
      callback: () => console.log('reCAPTCHA verified'),
    });

    const confirmationResult = await signInWithPhoneNumber(
      authInstance,
      phoneNumber,
      recaptchaVerifier
    );

    console.log('✓ Verification code sent to', phoneNumber);
    return confirmationResult;
  } catch (error) {
    console.error('✗ Phone verification failed:', error);
    return null;
  }
}

export async function verifyPhoneOTP(
  confirmationResult: ConfirmationResult,
  otp: string
) {
  try {
    const result = await confirmationResult.confirm(otp);
    console.log('✓ Phone verified! User:', result.user.uid);
    return result.user;
  } catch (error) {
    console.error('✗ OTP verification failed:', error);
    return null;
  }
}

// ────────────────────────────────────────────────────────────
// EMAIL AUTHENTICATION
// ────────────────────────────────────────────────────────────

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<any | null> {
  const authInstance = getAuthInstance();
  if (!authInstance) {
    console.error('Auth not initialized');
    return null;
  }

  try {
    const result = await createUserWithEmailAndPassword(
      authInstance,
      email,
      password
    );
    console.log('✓ Email signup successful:', result.user.uid);
    return result.user;
  } catch (error) {
    console.error('✗ Email signup failed:', error);
    return null;
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<any | null> {
  const authInstance = getAuthInstance();
  if (!authInstance) {
    console.error('Auth not initialized');
    return null;
  }

  try {
    const result = await signInWithEmailAndPassword(
      authInstance,
      email,
      password
    );
    console.log('✓ Email signin successful:', result.user.uid);
    return result.user;
  } catch (error) {
    console.error('✗ Email signin failed:', error);
    return null;
  }
}

// ────────────────────────────────────────────────────────────
// SESSION MANAGEMENT
// ────────────────────────────────────────────────────────────

export async function signOutUser(): Promise<boolean> {
  const authInstance = getAuthInstance();
  if (!authInstance) return false;

  try {
    await signOut(authInstance);
    console.log('✓ User signed out');
    return true;
  } catch (error) {
    console.error('✗ Sign out failed:', error);
    return false;
  }
}

export function getCurrentUser() {
  const authInstance = getAuthInstance();
  return authInstance?.currentUser || null;
}

export function onAuthStateChanged(callback: (user: any) => void) {
  const authInstance = getAuthInstance();
  if (!authInstance) {
    // Firebase unavailable — call callback with null immediately so app unblocks
    setTimeout(() => callback(null), 0);
    return () => {};
  }

  return authInstance.onAuthStateChanged(callback);
}

// Helper to check if Firebase is available
export function isFirebaseReady(): boolean {
  return typeof window !== 'undefined' && auth !== null;
}
