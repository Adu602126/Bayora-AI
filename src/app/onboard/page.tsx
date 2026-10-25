'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, type VulnerabilityType } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/translations';
import { Plus, Check, AlertCircle, Loader } from 'lucide-react';
import {
  sendPhoneVerificationCode,
  verifyPhoneOTP,
  signUpWithEmail,
} from '@/lib/firebase';

const VULNERABILITY_TYPES: VulnerabilityType[] = [
  'Solo Woman',
  'Night Traveler',
  'With Child/Elderly',
  'Differently-Abled',
  'Student',
  'Tourist',
];

const VUL_HI: Record<string, string> = {
  'Solo Woman': 'अकेली महिला',
  'Night Traveler': 'रात्रि यात्री',
  'With Child/Elderly': 'बच्चे/बुजुर्ग के साथ',
  'Differently-Abled': 'दिव्यांग',
  'Student': 'छात्र',
  'Tourist': 'पर्यटक',
};

export default function OnboardPage() {
  const router = useRouter();
  const { setProfile, completeOnboarding, language } = useStore();
  const { user, enterGuestMode } = useAuth();
  const t = useTranslation(language);

  // Current step state
  const [step, setStep] = useState(0);

  // Auth flow
  const [authMethod, setAuthMethod] = useState<'phone' | 'email' | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const otpTimerRef = useRef<number | null>(null);
  const [otpTimer, setOtpTimer] = useState(0);

  // Profile info
  const [name, setName] = useState('');
  const [vulType, setVulType] = useState<VulnerabilityType>('Solo Woman');

  // ────────────────────────────────────────────────────────────
  // AUTH HANDLERS
  // ────────────────────────────────────────────────────────────

  const startOTPTimer = () => {
    setOtpTimer(60);
    const timer = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    otpTimerRef.current = timer as any;
  };

  const handleSendPhoneOTP = async () => {
    if (!phone || phone.length < 10) {
      setAuthError('Please enter a valid phone number');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      // Format phone number (assuming Indian numbers)
      const formattedPhone = phone.startsWith('+') ? phone : '+91' + phone.replace(/\D/g, '');

      const result = await sendPhoneVerificationCode(
        formattedPhone,
        'recaptcha-container'
      );

      if (result) {
        setConfirmationResult(result);
        startOTPTimer();
        setStep(1); // Move to OTP verification step
      } else {
        setAuthError('Failed to send OTP. Please try again.');
      }
    } catch (error: any) {
      setAuthError(error.message || 'An error occurred');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setAuthError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!confirmationResult) {
      setAuthError('OTP session expired. Please request a new OTP.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const user = await verifyPhoneOTP(confirmationResult, otp);
      if (user) {
        setStep(2); // Move to profile setup
      } else {
        setAuthError('Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      setAuthError(error.message || 'OTP verification failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUpEmail = async () => {
    if (!email || !password) {
      setAuthError('Please enter email and password');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const user = await signUpWithEmail(email, password);
      if (user) {
        setStep(2); // Move to profile setup
      } else {
        setAuthError('Failed to create account. Email may already exist.');
      }
    } catch (error: any) {
      setAuthError(error.message || 'Sign up failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────
  // PROFILE & FINISH HANDLERS
  // ────────────────────────────────────────────────────────────

  const handleFinish = () => {
    if (!name.trim()) {
      setAuthError('Please enter your name');
      return;
    }

    setProfile({
      name: name || 'User',
      phone,
      vulnerabilityType: vulType,
    });
    completeOnboarding();
    router.replace('/home');
  };



  // ────────────────────────────────────────────────────────────
  // STEP COMPONENTS
  // ────────────────────────────────────────────────────────────

  const steps = [
    // Step 0: Welcome
    <div key={0} className="fade-in" style={{ padding: 24 }}>
      <div
        style={{
          background: 'linear-gradient(135deg,var(--bg-2),var(--bg-4))',
          margin: -24,
          padding: '36px 24px 28px',
          textAlign: 'center',
          marginBottom: 0,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            background: 'rgba(20,184,166,0.12)',
            border: '1.5px solid rgba(20,184,166,0.3)',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: 32,
          }}
        >
          🛡️
        </div>
        <div
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: -0.5,
            marginBottom: 10,
          }}
        >
          SafePath<br />
          <span style={{ color: 'var(--teal)' }}>Indore</span>
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
          {t('onboardSub')}
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <div
          className="card"
          style={{ borderColor: 'rgba(20,184,166,0.15)', marginBottom: 20 }}
        >
          {[
            {
              emoji: '🗺️',
              title: t('feature1Title'),
              sub: t('feature1Sub'),
            },
            {
              emoji: '📡',
              title: t('feature2Title'),
              sub: t('feature2Sub'),
            },
            {
              emoji: '🆘',
              title: t('feature3Title'),
              sub: t('feature3Sub'),
            },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                marginBottom: i < 2 ? 14 : 0,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  background: 'rgba(20,184,166,0.1)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 16,
                }}
              >
                {f.emoji}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                  {f.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-2)',
                    lineHeight: 1.5,
                  }}
                >
                  {f.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-3)',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          {t('teamCredit')}
        </div>
        <button className="btn-primary" onClick={() => setStep(1)}>
          {t('getStarted')} →
        </button>

        {/* ── Quick Demo bypass ── */}
        <button
          onClick={() => {
            enterGuestMode();
            setProfile({ name: 'Demo User', vulnerabilityType: 'Solo Woman' });
            completeOnboarding();
            router.replace('/home');
          }}
          style={{
            width: '100%',
            marginTop: 12,
            background: 'transparent',
            border: '1px solid rgba(20,184,166,0.25)',
            borderRadius: 12,
            padding: '12px 16px',
            cursor: 'pointer',
            fontSize: 13,
            color: 'var(--teal)',
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
          }}
        >
          👤 Demo Mode — Skip Sign In
        </button>

      </div>
    </div>,

    // Step 1: Auth Method Selection & Phone/Email Verification
    <div key={1} className="fade-in" style={{ padding: 24 }}>
      <div style={{ marginBottom: 28 }}>
        <div className="section-h" style={{ marginBottom: 4 }}>
          Step 1 of 3
        </div>
        <div className="progress-track" style={{ marginBottom: 16 }}>
          <div className="progress-fill" style={{ width: '33%' }} />
        </div>
        <div
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          Verify Identity
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
          Choose how you want to verify your account
        </div>
      </div>

      {!authMethod ? (
        // Auth method selection
        <div style={{ marginBottom: 28 }}>
          <button
            className="card"
            onClick={() => {
              setAuthMethod('phone');
              setAuthError('');
            }}
            style={{
              display: 'flex',
              gap: 16,
              padding: '16px 12px',
              marginBottom: 12,
              cursor: 'pointer',
              border: '1.5px solid rgba(20,184,166,0.2)',
              borderRadius: 12,
              background: 'var(--bg-2)',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 32 }}>📱</div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>
                Phone Verification
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-3)',
                }}
              >
                Get OTP via SMS (Recommended)
              </div>
            </div>
          </button>

          <button
            className="card"
            onClick={() => {
              setAuthMethod('email');
              setAuthError('');
            }}
            style={{
              display: 'flex',
              gap: 16,
              padding: '16px 12px',
              cursor: 'pointer',
              border: '1.5px solid rgba(20,184,166,0.2)',
              borderRadius: 12,
              background: 'var(--bg-2)',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 32 }}>✉️</div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>
                Email Signup
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-3)',
                }}
              >
                Create account with email
              </div>
            </div>
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 8px',
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(100,116,139,0.2)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(100,116,139,0.2)' }} />
          </div>

          {/* ── GUEST / DEMO MODE BYPASS ── */}
          <button
            onClick={() => {
              enterGuestMode();
              setProfile({ name: 'Demo User', vulnerabilityType: 'Solo Woman' });
              completeOnboarding();
              router.replace('/home');
            }}
            style={{
              width: '100%',
              background: 'rgba(20,184,166,0.08)',
              border: '1.5px dashed rgba(20,184,166,0.35)',
              borderRadius: 12,
              padding: '14px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: 'var(--font-body)',
            }}
          >
            <span style={{ fontSize: 26 }}>👤</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)', marginBottom: 2 }}>Continue as Guest / Demo Mode</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Skip sign-in · Full app access · No data saved</div>
            </div>
          </button>

        </div>
      ) : authMethod === 'phone' && !confirmationResult ? (
        // Phone number entry
        <div>
          {authError && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: 10,
                marginBottom: 16,
                display: 'flex',
                gap: 8,
              }}
            >
              <AlertCircle size={16} style={{ color: 'var(--red)', flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                {authError}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 12,
                color: 'var(--text-2)',
                display: 'block',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}
            >
              Phone Number
            </label>
            <input
              className="inp"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              disabled={authLoading}
            />
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-3)',
                marginTop: 4,
              }}
            >
              We&apos;ll send you an OTP to verify
            </div>
          </div>

          <div
            id="recaptcha-container"
            style={{ marginBottom: 16 }}
          />

          <button
            className="btn-primary"
            onClick={handleSendPhoneOTP}
            disabled={authLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {authLoading && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {authLoading ? 'Sending...' : 'Send OTP'}
          </button>

          <button
            className="btn-secondary"
            onClick={() => {
              setAuthMethod(null);
              setAuthError('');
            }}
            style={{ marginTop: 12 }}
          >
            Back
          </button>
        </div>
      ) : authMethod === 'phone' && confirmationResult ? (
        // OTP verification
        <div>
          {authError && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: 10,
                marginBottom: 16,
                display: 'flex',
                gap: 8,
              }}
            >
              <AlertCircle size={16} style={{ color: 'var(--red)', flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                {authError}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 12,
                color: 'var(--text-2)',
                display: 'block',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}
            >
              Enter 6-Digit OTP
            </label>
            <input
              className="inp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              disabled={authLoading}
              style={{ fontSize: 24, letterSpacing: '8px', textAlign: 'center' }}
            />
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-3)',
                marginTop: 4,
              }}
            >
              Sent to {phone}
              {otpTimer > 0 && ` • Resend in ${otpTimer}s`}
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleVerifyOTP}
            disabled={authLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {authLoading && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {authLoading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <button
            className="btn-secondary"
            onClick={() => {
              setConfirmationResult(null);
              setOtp('');
              setAuthError('');
            }}
            style={{ marginTop: 12 }}
          >
            Try Different Number
          </button>
        </div>
      ) : authMethod === 'email' ? (
        // Email signup
        <div>
          {authError && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: 10,
                marginBottom: 16,
                display: 'flex',
                gap: 8,
              }}
            >
              <AlertCircle size={16} style={{ color: 'var(--red)', flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                {authError}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 12,
                color: 'var(--text-2)',
                display: 'block',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}
            >
              Email Address
            </label>
            <input
              className="inp"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={authLoading}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 12,
                color: 'var(--text-2)',
                display: 'block',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}
            >
              Password
            </label>
            <input
              className="inp"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              disabled={authLoading}
            />
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-3)',
                marginTop: 4,
              }}
            >
              Must be at least 6 characters
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleSignUpEmail}
            disabled={authLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {authLoading && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {authLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <button
            className="btn-secondary"
            onClick={() => {
              setAuthMethod(null);
              setAuthError('');
            }}
            style={{ marginTop: 12 }}
          >
            Back
          </button>
        </div>
      ) : null}
    </div>,

    // Step 2: Profile Setup
    <div key={2} className="fade-in" style={{ padding: 24 }}>
      <div style={{ marginBottom: 28 }}>
        <div className="section-h" style={{ marginBottom: 4 }}>
          Step 2 of 3
        </div>
        <div className="progress-track" style={{ marginBottom: 16 }}>
          <div className="progress-fill" style={{ width: '66%' }} />
        </div>
        <div
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          {t('yourProfile')}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
          {t('profileSub')}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            fontSize: 12,
            color: 'var(--text-2)',
            display: 'block',
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
          }}
        >
          {t('fullName')}
        </label>
        <input
          className="inp"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Priya Sharma"
        />
      </div>

      <div style={{ marginBottom: 28 }}>
        <label
          style={{
            fontSize: 12,
            color: 'var(--text-2)',
            display: 'block',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
          }}
        >
          {t('iTravelAs')}
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {VULNERABILITY_TYPES.map((vt) => (
            <button
              key={vt}
              className={`profile-chip ${vulType === vt ? 'selected' : ''}`}
              onClick={() => setVulType(vt)}
            >
              {language === 'hi' ? VUL_HI[vt] : vt}
            </button>
          ))}
        </div>
      </div>

      <button className="btn-primary" onClick={() => setStep(3)}>
        {t('continue')}
      </button>
    </div>,

    // Step 3: Confirmation
    <div key={3} className="fade-in" style={{ padding: 24 }}>
      <div style={{ marginBottom: 28 }}>
        <div className="section-h" style={{ marginBottom: 4 }}>
          Step 3 of 3
        </div>
        <div className="progress-track" style={{ marginBottom: 16 }}>
          <div className="progress-fill" style={{ width: '100%' }} />
        </div>
        <div
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          {t('allSet')}, {name.split(' ')[0] || 'there'}!
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
          {t('allSetSub')}
        </div>
      </div>

      <div
        className="card"
        style={{
          borderColor: 'rgba(20,184,166,0.3)',
          marginBottom: 20,
          textAlign: 'center',
          padding: '24px 16px',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 14 }}>✅</div>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>
          Account Verified
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
          {language === 'hi' ? VUL_HI[vulType] : vulType} • {phone}
        </div>
      </div>

      <div
        style={{
          background: 'rgba(20,184,166,0.08)',
          border: '1px solid rgba(20,184,166,0.2)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--teal)',
            marginBottom: 4,
          }}
        >
          💡 {t('enableNotif')}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {t('enableNotifSub')}
        </div>
      </div>

      <button className="btn-primary" onClick={handleFinish}>
        {t('launch')}
      </button>
    </div>,
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', overflowY: 'auto' }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {steps[step]}
    </div>
  );
}
