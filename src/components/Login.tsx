'use client';

import { useState } from 'react';
import { signInWithEmail, signUpWithEmail } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Loader } from 'lucide-react';

export default function Login({ onSuccess }: { onSuccess?: () => void }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { refreshAuth } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        if (!isLogin && password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);

        try {
            let user;
            if (isLogin) {
                user = await signInWithEmail(email, password);
                if (!user) throw new Error('Invalid email or password.');
            } else {
                user = await signUpWithEmail(email, password);
                if (!user) throw new Error('Failed to create account. Email may already be in use.');
            }

            // Success! Update auth context and redirect
            refreshAuth();
            if (onSuccess) {
                onSuccess();
            } else {
                router.push('/home');
            }
        } catch (err: any) {
            setError(err.message || 'An authentication error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto', fontFamily: 'var(--font-sans)' }}>
            <div style={{ 
                background: 'var(--bg-2, #1e293b)', 
                border: '1px solid rgba(100,116,139,0.2)', 
                borderRadius: '16px', 
                padding: '24px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text, #f8fafc)', margin: '0 0 8px 0' }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--text-2, #94a3b8)', margin: 0 }}>
                        {isLogin ? 'Securely access your SafePath account' : 'Join SafePath to secure your journeys'}
                    </p>
                </div>

                {error && (
                    <div style={{ 
                        background: 'rgba(239,68,68,0.1)', 
                        border: '1px solid rgba(239,68,68,0.3)', 
                        borderRadius: '8px', 
                        padding: '12px', 
                        marginBottom: '20px', 
                        display: 'flex', 
                        gap: '10px',
                        alignItems: 'flex-start'
                    }}>
                        <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '13px', color: '#ef4444', lineHeight: 1.4 }}>{error}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-2, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            Email Address
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                style={{
                                    width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px',
                                    border: '1px solid rgba(100,116,139,0.3)', background: 'rgba(15,23,42,0.5)',
                                    color: '#fff', fontSize: '14px', boxSizing: 'border-box'
                                }}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-2, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={isLogin ? "Enter your password" : "Min 6 characters"}
                                style={{
                                    width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px',
                                    border: '1px solid rgba(100,116,139,0.3)', background: 'rgba(15,23,42,0.5)',
                                    color: '#fff', fontSize: '14px', boxSizing: 'border-box'
                                }}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{
                            width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                            background: loading ? '#0f766e' : '#14b8a6', color: '#fff',
                            fontSize: '15px', fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            marginTop: '8px', transition: 'all 0.2s'
                        }}
                    >
                        {loading && <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />}
                        {loading ? 'Authenticating...' : (isLogin ? 'Secure Login' : 'Create Account')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-3, #64748b)' }}>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        style={{ background: 'none', border: 'none', color: '#14b8a6', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                        disabled={loading}
                    >
                        {isLogin ? 'Sign up here' : 'Log in here'}
                    </button>
                </div>
            </div>
        </div>
    );
}
