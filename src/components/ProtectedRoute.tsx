'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredAuth?: boolean;
}

export function ProtectedRoute({
    children,
    requiredAuth = true,
}: ProtectedRouteProps) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        // If route requires auth and user is not authenticated, redirect to onboard
        if (requiredAuth && !isAuthenticated) {
            router.replace('/onboard');
            return;
        }

        // If route should only be shown to non-authenticated users (like onboard) and user is authenticated
        if (!requiredAuth && isAuthenticated) {
            router.replace('/home');
            return;
        }
    }, [isAuthenticated, loading, requiredAuth, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div
                        style={{
                            fontFamily: 'var(--font-head)',
                            fontSize: 28,
                            fontWeight: 800,
                            color: 'var(--teal)',
                        }}
                    >
                        SafePath
                    </div>
                    <div
                        style={{
                            fontSize: 13,
                            color: 'var(--text-3)',
                            marginTop: 4,
                        }}
                    >
                        Verifying...
                    </div>
                </div>
            </div>
        );
    }

    // If redirecting, show nothing
    if ((requiredAuth && !isAuthenticated) || (!requiredAuth && isAuthenticated)) {
        return null;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
