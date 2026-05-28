'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ForgotPasswordModal from '@/components/shared/ForgotPasswordModal';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPw, setShowPw]             = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [showForgotPw, setShowForgotPw] = useState(false);

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (token && stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.role === 'admin') router.replace('/admin/dashboard');
      } catch {}
    }
  }, [router]);

  const handleLogin = async () => {
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const user = response.data.user;
      if (user.role !== 'admin') {
        setError('Access denied. This portal is for admin accounts only.');
        return;
      }
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(user));
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      if (!e.response) setError('Cannot reach the server. Check the backend is running.');
      else setError(e.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex">

      {/* ── Left panel — brand / features ── */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] xl:w-[42%] bg-[#3E4751] px-10 xl:px-14 py-12 relative overflow-hidden flex-shrink-0">

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/[0.03] pointer-events-none" />
        <div className="absolute top-1/2 -right-10 w-40 h-40 rounded-full bg-white/[0.03] pointer-events-none" />

        {/* Top: logo */}
        <div>
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white font-bold text-sm shadow-inner">
              IC
            </div>
            <div>
              <p className="text-white font-bold text-[15px] tracking-tight leading-none">Influence Connect</p>
              <p className="text-white/40 text-[11px] font-medium tracking-widest uppercase mt-0.5">Admin Console</p>
            </div>
          </div>

          <h1 className="text-3xl xl:text-[2.2rem] font-bold text-white leading-tight tracking-tight mb-4">
            Platform control<br />at your fingertips.
          </h1>
          <p className="text-white/55 text-[0.95rem] leading-relaxed max-w-[300px]">
            Manage users, campaigns, subscriptions, and compliance from a single secure dashboard.
          </p>
        </div>

        {/* Middle: feature list */}
        <div className="flex flex-col gap-4 py-10">
          {[
            {
              icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              ),
              title: 'User management',
              desc: 'Suspend, restore, and inspect every account on the platform.',
            },
            {
              icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              ),
              title: 'Subscription & revenue',
              desc: 'Track MRR, premium conversions, and plan distribution live.',
            },
            {
              icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              ),
              title: 'GSTIN verification',
              desc: 'Review and approve brand tax registrations before they go live.',
            },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/[0.12] flex items-center justify-center text-white/70 flex-shrink-0 mt-0.5">
                {item.icon}
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight mb-0.5">{item.title}</p>
                <p className="text-white/45 text-xs leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom: security badge */}
        <div className="flex items-center gap-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-white/50 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <p className="text-white/45 text-xs leading-relaxed">
            Secured via JWT · Sessions expire in 7 days · Admin-only access
          </p>
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-12">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#3E4751] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              IC
            </div>
            <div>
              <p className="text-gray-900 font-bold text-[14px] tracking-tight leading-none">Influence Connect</p>
              <p className="text-gray-400 text-[10px] font-medium tracking-widest uppercase mt-0.5">Admin Console</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1.5">Sign in to your account</h2>
            <p className="text-sm text-gray-500">Enter your admin credentials to continue.</p>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-5" onKeyDown={handleKeyDown}>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] font-semibold uppercase tracking-widest text-gray-500">
                Email address
              </label>
              <input
                type="email"
                autoComplete="username"
                placeholder="admin@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className="w-full px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E4751]/20 focus:border-[#3E4751] hover:border-gray-300 transition-all duration-200 shadow-sm"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[0.72rem] font-semibold uppercase tracking-widest text-gray-500">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPw(true)}
                  className="text-xs text-[#3E4751] hover:text-[#5A6472] font-semibold cursor-pointer transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="w-full px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E4751]/20 focus:border-[#3E4751] hover:border-gray-300 transition-all duration-200 shadow-sm"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm text-white bg-[#3E4751] hover:bg-[#4A5562] active:scale-[0.985] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Signing in…
              </>
            ) : (
              <>
                Sign in to Admin Panel
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[0.68rem] font-semibold uppercase tracking-widest text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Footer link */}
          <p className="text-center text-sm text-gray-500">
            Not an admin?{' '}
            <a href="/auth/login" className="text-[#3E4751] hover:text-[#5A6472] font-semibold transition-colors">
              Go to user login →
            </a>
          </p>

        </div>
      </div>

      {showForgotPw && (
        <ForgotPasswordModal
          onClose={() => setShowForgotPw(false)}
          onSuccess={() => setShowForgotPw(false)}
        />
      )}
    </div>
  );
}

function Eye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
