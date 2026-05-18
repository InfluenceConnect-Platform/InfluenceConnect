'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/shared/AuthLayout';
import Input from '@/components/shared/Input';
import Button from '@/components/shared/Button';
import api from '@/lib/api';
import ForgotPasswordModal from '@/components/shared/ForgotPasswordModal';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authConflict, setAuthConflict] = useState<'use_google' | 'use_password' | null>(null);
  const [showForgotPw, setShowForgotPw] = useState(false);

  useEffect(() => {
    const errorCode = searchParams.get('error');
    if (errorCode === 'google_failed') {
      setError('Google sign-in failed. Please try again or use email and password.');
    } else if (errorCode === 'email_exists') {
      setAuthConflict('use_password');
    }
  }, [searchParams]);

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
      const user = response.data.user;
      if (user.role === 'influencer') router.push('/influencer/dashboard');
      else if (user.role === 'brand') router.push('/brand/dashboard');
      else router.push('/admin/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; code?: string } } };
      if (!e.response) setError('Cannot reach the server. Make sure the backend is running.');
      else if (e.response.data?.code === 'USE_GOOGLE') setAuthConflict('use_google');
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-xs font-medium text-gray-600 mb-6 shadow-sm w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]" />
            Trusted by creators and brands across India
          </div>

          <h1 className="text-[2.6rem] font-bold leading-[1.15] tracking-tight text-gray-900 mb-4">
            Welcome back to<br />
            <span className="bg-gradient-to-r from-[#7FA8AD] via-[#5D8A8F] to-[#3D5087] bg-clip-text text-transparent">
              Influence Connect
            </span>.
          </h1>

          <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-sm">
            Pick up where you left off — manage campaigns, close deals, and grow your presence.
          </p>

          <div className="flex flex-col gap-3.5">
            {FEATURES.map((item, i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  {item.icon}
                </div>
                <span className="text-sm text-gray-600">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial card */}
          <div className="mt-10 p-5 bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200/60 rounded-2xl shadow-sm">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>
            <p className="text-sm text-gray-700 italic mb-4 leading-relaxed">
              &ldquo;Influence Connect helped us close 3 brand deals in our first week. The platform just works.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7FA8AD] to-[#3D5087] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                A
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Aarav Mehta</p>
                <p className="text-xs text-gray-500">Travel Creator · 180K followers</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right — Login card ── */}
        <div className="rounded-2xl overflow-hidden shadow-[0_4px_6px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08),0_32px_64px_rgba(127,168,173,0.12)] border border-gray-200/80">

          {/* Thicker gradient accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-[#7FA8AD] via-[#5D8A8F] to-[#3D5087]" />

          <div className="bg-white px-8 pt-7 pb-8">

            {/* IC branding inside card */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7FA8AD] to-[#3D5087] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                IC
              </div>
              <span className="text-sm font-semibold text-gray-700 tracking-tight">Influence Connect</span>
            </div>

            <div className="mb-6">
              <h2 className="text-[1.65rem] font-bold text-gray-900 mb-1 tracking-tight">Welcome back</h2>
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="text-[#5D8A8F] font-semibold hover:underline">
                  Sign up free →
                </Link>
              </p>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-150 cursor-pointer mb-5"
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
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">or continue with email</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            </div>

            <div className="flex flex-col gap-4" onKeyDown={handleKeyDown}>
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={setPassword}
                showPasswordToggle
              />
            </div>

            <div className="flex justify-end mt-2 mb-5">
              <button
                type="button"
                onClick={() => setShowForgotPw(true)}
                className="text-xs text-[#5D8A8F] hover:underline font-semibold cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {authConflict === 'use_google' && (
              <div className="mb-4 p-4 bg-teal-50 border border-teal-200 rounded-xl flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-teal-200 flex items-center justify-center flex-shrink-0">
                    <GoogleIcon />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">This account uses Google Sign-In.</p>
                    <p className="text-xs text-gray-500 mt-0.5">Please continue with Google to log in.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-teal-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Continue with Google →
                </button>
              </div>
            )}

            {authConflict === 'use_password' && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-900">An account with this email already exists.</p>
                  <p className="text-xs text-amber-700 mt-0.5">Please log in with your password instead.</p>
                </div>
              </div>
            )}

            {error && !authConflict && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-start gap-2.5">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <Button fullWidth loading={loading} onClick={handleLogin}>
              Log in →
            </Button>

            <p className="text-xs text-gray-400 text-center mt-5">
              By continuing you agree to our{' '}
              <span className="text-[#5D8A8F] cursor-pointer hover:underline font-medium">Terms</span>{' '}
              and{' '}
              <span className="text-[#5D8A8F] cursor-pointer hover:underline font-medium">Privacy Policy</span>.
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
