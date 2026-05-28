'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ForgotPasswordModal from '@/components/shared/ForgotPasswordModal';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
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
        setError('Access denied. This login is for admin accounts only.');
        return;
      }
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(user));
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      if (!e.response) setError('Cannot reach the server. Make sure the backend is running.');
      else setError(e.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen bg-[#1A1F26] flex items-center justify-center p-4">

      {/* Background texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#3E4751]/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#3E4751]/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[400px]">

        {/* Logo row */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#3E4751] flex items-center justify-center text-white font-bold text-sm shadow-lg ring-1 ring-white/10">
            IC
          </div>
          <div>
            <p className="text-white font-bold text-[15px] tracking-tight leading-none">Influence Connect</p>
            <p className="text-[#8B95A1] text-[11px] font-medium tracking-wide uppercase mt-0.5">Admin Panel</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#242B34] rounded-2xl border border-white/[0.07] shadow-[0_4px_16px_rgba(0,0,0,0.5),0_16px_48px_rgba(0,0,0,0.4)] overflow-hidden">

          {/* Top accent bar */}
          <div className="h-[3px] bg-gradient-to-r from-[#3E4751] via-[#5A6472] to-[#3E4751]" />

          <div className="px-7 pt-7 pb-8">

            <div className="mb-6">
              <h1 className="text-xl font-bold text-white tracking-tight mb-1">Admin sign in</h1>
              <p className="text-sm text-[#8B95A1]">Restricted access — authorised personnel only.</p>
            </div>

            <div className="flex flex-col gap-4 mb-2" onKeyDown={handleKeyDown}>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.68rem] font-bold uppercase tracking-widest text-[#6B7885]">
                  Email address
                </label>
                <input
                  type="email"
                  autoComplete="username"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  className="w-full px-4 py-3 text-sm text-white placeholder-[#4A5260] bg-[#1A1F26] border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A6472]/50 focus:border-[#5A6472] hover:border-white/[0.14] transition-all duration-200"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.68rem] font-bold uppercase tracking-widest text-[#6B7885]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    className="w-full px-4 py-3 pr-11 text-sm text-white placeholder-[#4A5260] bg-[#1A1F26] border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A6472]/50 focus:border-[#5A6472] hover:border-white/[0.14] transition-all duration-200"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5260] hover:text-[#8B95A1] transition-colors cursor-pointer"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end mb-5">
              <button
                type="button"
                onClick={() => setShowForgotPw(true)}
                className="text-xs text-[#7FA8AD] hover:text-[#9FC8CD] font-semibold cursor-pointer transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 p-3.5 bg-red-900/30 border border-red-700/40 rounded-xl flex items-start gap-2.5">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm text-white bg-[#3E4751] hover:bg-[#4A5562] active:scale-[0.985] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 ring-1 ring-white/10"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Signing in…
                </>
              ) : (
                'Sign in to Admin Panel →'
              )}
            </button>

          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[#4A5260] text-xs mt-5 leading-relaxed">
          Not an admin?{' '}
          <a href="/auth/login" className="text-[#6B7885] hover:text-[#8B95A1] font-semibold transition-colors">
            Go to user login →
          </a>
        </p>

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
