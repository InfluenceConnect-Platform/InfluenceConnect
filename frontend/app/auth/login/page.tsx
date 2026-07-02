'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/shared/AuthLayout';
import Input from '@/components/shared/Input';
import Button from '@/components/shared/Button';
import api from '@/lib/api';
import ForgotPasswordModal from '@/components/shared/ForgotPasswordModal';
import { useTheme } from '@/lib/useTheme';

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authConflict, setAuthConflict] = useState<'use_google' | 'use_password' | null>(null);
  const [showForgotPw, setShowForgotPw] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  useEffect(() => {
    const errorCode = searchParams.get('error');
    if (errorCode === 'google_failed') {
      setError('Google sign-in failed. Please try again or use email and password.');
    } else if (errorCode === 'email_exists') {
      setAuthConflict('use_password');
    } else if (errorCode === 'suspended') {
      setError('Your account has been suspended. Please contact support.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (lockTimer <= 0) return;
    const interval = setInterval(() => setLockTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [lockTimer]);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setLoading(false);
        setError('');
        setAuthConflict(null);
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const handleLogin = async () => {
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      document.cookie = `ic_role=${response.data.user.role}; path=/; max-age=604800; SameSite=Lax`;
      const user = response.data.user;
      if (user.role === 'influencer') router.push('/influencer/dashboard');
      else if (user.role === 'brand') router.push('/brand/dashboard');
      else router.push('/admin/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; code?: string; lockedUntil?: string } } };
      if (!e.response) setError('Cannot reach the server. Make sure the backend is running.');
      else if (e.response.data?.code === 'USE_GOOGLE') setAuthConflict('use_google');
      else if (e.response.data?.code === 'ACCOUNT_LOCKED') {
        const lockedUntil = e.response.data.lockedUntil ? new Date(e.response.data.lockedUntil) : null;
        const remaining = lockedUntil ? Math.ceil((lockedUntil.getTime() - Date.now()) / 1000) : 0;
        setLockTimer(Math.max(0, remaining));
        setError('');
      }
      else setError(e.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const backendURL = `${window.location.protocol}//${window.location.hostname}:8000`;
    window.location.href = `${backendURL}/api/auth/google`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  const FEATURES = [
    {
      color: 'bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F]',
      icon: (
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ),
      text: 'Live campaign analytics in your dashboard',
    },
    {
      color: 'bg-gradient-to-br from-violet-500 to-purple-600',
      icon: (
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      text: 'In-platform chat with auto contact moderation',
    },
    {
      color: 'bg-gradient-to-br from-emerald-500 to-green-600',
      icon: (
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
      text: 'Secure JWT sessions with 7-day expiry',
    },
  ];

  const handleForgotPwSuccess = (resetEmail: string) => {
    setShowForgotPw(false);
    setEmail(resetEmail);
    setPassword('');
    setError('');
    setAuthConflict(null);
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

        {/* ── Left panel ── */}
        <div className="hidden lg:flex flex-col">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 backdrop-blur-sm border rounded-full text-xs font-semibold mb-6 shadow-sm w-fit transition-colors ${
            isDark
              ? 'bg-slate-800/80 border-slate-700/60 text-slate-300'
              : 'bg-white/80 border-gray-200 text-gray-600'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            Trusted by creators and brands across India
          </div>

          <h1 className={`text-[2.75rem] font-bold leading-[1.12] tracking-tight mb-4 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Welcome back to<br />
            <span className="bg-gradient-to-r from-[#7FA8AD] via-[#5D8A8F] to-[#7C9ED9] bg-clip-text text-transparent">
              Influence Connect
            </span>.
          </h1>

          <p className={`text-[0.95rem] leading-relaxed mb-8 max-w-[22rem] transition-colors ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            Pick up where you left off — manage campaigns, close deals, and grow your presence.
          </p>

          <div className={`flex flex-col gap-3 p-5 backdrop-blur-sm border rounded-2xl shadow-sm mb-8 transition-colors ${
            isDark
              ? 'bg-slate-800/60 border-slate-700/50'
              : 'bg-white/70 border-gray-200'
          }`}>
            {FEATURES.map((item, i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  {item.icon}
                </div>
                <span className={`text-sm font-medium transition-colors ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Trust card */}
          <div className={`p-5 backdrop-blur-sm border rounded-2xl transition-colors ${
            isDark
              ? 'bg-slate-800/60 border-slate-700/50 shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
              : 'bg-white/70 border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7FA8AD] to-[#3D5087] flex items-center justify-center flex-shrink-0 shadow-md">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <div>
                <p className={`text-sm font-bold transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>Built for safe collaborations</p>
                <p className={`text-[0.7rem] font-medium transition-colors ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Verified brands · protected deals</p>
              </div>
            </div>
            <div className={`space-y-2.5 pt-3.5 border-t transition-colors ${isDark ? 'border-slate-700/50' : 'border-gray-200'}`}>
              {[
                'Every brand is GST-verified before going live',
                'Contact details stay private until a deal is agreed',
              ].map((line, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  <span className={`text-xs leading-relaxed transition-colors ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right — Login card ── */}
        <div className={`rounded-2xl overflow-hidden transition-all ${
          isDark
            ? 'shadow-[0_2px_8px_rgba(0,0,0,0.4),0_8px_32px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.06)] border border-slate-700/60'
            : 'shadow-[0_2px_8px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.08)] border border-gray-200'
        }`}>

          {/* Gradient accent bar */}
          <div className="h-[3px] bg-gradient-to-r from-[#7FA8AD] via-[#5D8A8F] to-[#3D5087]" />

          <div className={`px-8 pt-7 pb-8 transition-colors ${isDark ? 'bg-[#0E1B2E]' : 'bg-white'}`}>

            {/* IC branding inside card */}
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7FA8AD] to-[#3D5087] flex items-center justify-center text-white font-bold text-sm shadow-md">
                IC
              </div>
              <div>
                <span className={`text-sm font-bold tracking-tight block leading-none transition-colors ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Influence Connect</span>
                <span className={`text-[0.65rem] font-medium tracking-wide uppercase transition-colors ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Creator · Brand Platform</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className={`text-2xl font-bold mb-1.5 tracking-tight transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome back</h2>
              <p className={`text-sm transition-colors ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="text-[#5D8A8F] font-semibold hover:text-[#4A7A7F] transition-colors">
                  Sign up free →
                </Link>
              </p>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className={`w-full flex items-center justify-center gap-2.5 px-4 py-3 border rounded-xl text-sm font-semibold active:scale-[0.985] transition-all duration-200 cursor-pointer mb-5 ${
                isDark
                  ? 'border-slate-700 text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 hover:border-slate-600 hover:shadow-md'
                  : 'border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083 43.595 20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className={`flex-1 h-px transition-colors ${isDark ? 'bg-slate-700/80' : 'bg-gray-200'}`} />
              <span className={`text-[0.7rem] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>or</span>
              <div className={`flex-1 h-px transition-colors ${isDark ? 'bg-slate-700/80' : 'bg-gray-200'}`} />
            </div>

            <div className="flex flex-col gap-4" onKeyDown={handleKeyDown}>
              <Input dark={isDark} label="Email address" type="email" placeholder="you@example.com" value={email} onChange={setEmail} />
              <Input dark={isDark} label="Password" type="password" placeholder="Min. 8 characters" value={password} onChange={setPassword} showPasswordToggle />
            </div>

            <div className="flex justify-end mt-2.5 mb-5">
              <button
                type="button"
                onClick={() => setShowForgotPw(true)}
                className="text-xs text-[#5D8A8F] hover:text-[#4A7A7F] font-semibold cursor-pointer transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {authConflict === 'use_google' && (
              <div className={`mb-4 p-4 border rounded-xl flex flex-col gap-3 ${
                isDark ? 'bg-teal-900/40 border-teal-700/50' : 'bg-teal-50 border-teal-200'
              }`}>
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                    isDark ? 'bg-slate-800 border-teal-700/50' : 'bg-white border-teal-200'
                  }`}>
                    <GoogleIcon />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>This account uses Google Sign-In.</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Please continue with Google to log in.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-semibold active:scale-[0.985] transition-all cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 border-teal-700/50 text-slate-200 hover:bg-slate-700'
                      : 'bg-white border-teal-300 text-gray-700 hover:bg-teal-50'
                  }`}
                >
                  Continue with Google →
                </button>
              </div>
            )}

            {authConflict === 'use_password' && (
              <div className={`mb-4 p-4 border rounded-xl flex items-start gap-2.5 ${
                isDark ? 'bg-amber-900/30 border-amber-700/40' : 'bg-amber-50 border-amber-200'
              }`}>
                <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>An account with this email already exists.</p>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-amber-400/80' : 'text-amber-600'}`}>Please log in with your password instead.</p>
                </div>
              </div>
            )}

            {lockTimer > 0 && (
              <div className={`mb-4 p-3.5 border rounded-xl flex items-start gap-2.5 ${
                isDark ? 'bg-red-900/30 border-red-700/40' : 'bg-red-50 border-red-200'
              }`}>
                <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-red-300' : 'text-red-700'}`}>Account temporarily locked</p>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-red-400/80' : 'text-red-500'}`}>
                    Too many failed attempts. Try again in{' '}
                    <span className="font-mono font-bold">
                      {Math.floor(lockTimer / 60)}:{String(lockTimer % 60).padStart(2, '0')}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {error && !authConflict && (
              <div className={`mb-4 p-3.5 border rounded-xl text-sm flex items-start gap-2.5 ${
                isDark ? 'bg-red-900/30 border-red-700/40 text-red-300' : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <Button fullWidth loading={loading} onClick={handleLogin} disabled={lockTimer > 0}>
              Sign in →
            </Button>

            <p className={`text-[0.72rem] text-center mt-5 leading-relaxed transition-colors ${isDark ? 'text-slate-600' : 'text-gray-500'}`}>
              By continuing you agree to our{' '}
              <span className="text-[#5D8A8F] cursor-pointer hover:text-[#4A7A7F] font-semibold transition-colors">Terms</span>{' '}
              and{' '}
              <span className="text-[#5D8A8F] cursor-pointer hover:text-[#4A7A7F] font-semibold transition-colors">Privacy Policy</span>.
            </p>
          </div>
        </div>

      </div>

      {showForgotPw && (
        <ForgotPasswordModal
          onClose={() => setShowForgotPw(false)}
          onSuccess={handleForgotPwSuccess}
        />
      )}
    </AuthLayout>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083 43.595 20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}

// useSearchParams() must be wrapped in Suspense for production builds
export default function LoginPageWrapper() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
