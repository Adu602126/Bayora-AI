'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
    onAuthStateChanged,
    getCurrentUser,
    signOutUser,
    getAuthInstance,
} from '@/lib/firebase';

export interface AuthContextType {
    user: any | null;
    loading: boolean;
    isAuthenticated: boolean;
    isGuestMode: boolean;
    logout: () => Promise<boolean>;
    refreshAuth: () => void;
    enterGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Auth timeout: if Firebase never responds, unblock the app after 5 s ──
const FIREBASE_TIMEOUT_MS = 5000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGuestMode, setIsGuestMode] = useState(false);
    const resolvedRef = useRef(false);

    const resolve = (currentUser: any) => {
        if (resolvedRef.current) return;
        resolvedRef.current = true;
        setUser(currentUser);
        setLoading(false);
    };

    useEffect(() => {
        // Try to get the auth instance
        const auth = getAuthInstance();

        // ⏱ Safety net: if Firebase auth callback never fires (bad config / offline)
        // we force loading=false so the app is not stuck forever.
        const timeout = setTimeout(() => {
            if (!resolvedRef.current) {
                console.warn('[AuthContext] Firebase auth timed out — unblocking app in guest mode');
                resolve(null);
            }
        }, FIREBASE_TIMEOUT_MS);

        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChanged((currentUser) => {
            clearTimeout(timeout);
            resolve(currentUser);
        });

        return () => {
            clearTimeout(timeout);
            unsubscribe();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const logout = async () => {
        setIsGuestMode(false);
        resolvedRef.current = false;
        return await signOutUser();
    };

    const refreshAuth = () => {
        const currentUser = getCurrentUser();
        setUser(currentUser);
    };

    const enterGuestMode = () => {
        // Mark as resolved so the Firebase timeout doesn't fire afterward
        resolvedRef.current = true;
        setLoading(false);
        setIsGuestMode(true);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                // Guest mode counts as authenticated so routes don't redirect
                isAuthenticated: !!user || isGuestMode,
                isGuestMode,
                logout,
                refreshAuth,
                enterGuestMode,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
