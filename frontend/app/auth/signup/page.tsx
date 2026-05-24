'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/shared/AuthLayout';
import Input from '@/components/shared/Input';
import Button from '@/components/shared/Button';
import api from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Role = 'influencer' | 'brand';

const ROLE_META: Record<Role, {
  label: string;
  sub: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  gradient: string;
  fields: {
    name:     { label: string; placeholder: string; helper?: string };
    email:    { label: string; placeholder: string; helper: string };
    mobile:   { label: string; placeholder: string; helper: string };
    password: { label: string; placeholder: string; helper?: string };
  };
}> = {
  influencer: {
    label: 'Influencer',
    sub: 'Creators, reviewers & content makers',
    gradient: 'from-[#7FA8AD] to-[#5D8A8F]',
    icon: (
      <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    activeIcon: (
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    fields: {
      name:     { label: 'Your full name',          placeholder: 'e.g. Priya Sharma',          helper: 'Your public name visible to brands on the platform' },
      email:    { label: 'Email address',            placeholder: 'you@example.com',             helper: 'A verification code will be sent to this address' },
      mobile:   { label: 'Mobile number',            placeholder: '98765 43210',                 helper: 'Used for two-factor authentication and campaign alerts' },
      password: { label: 'Create a password',        placeholder: 'At least 8 characters',       helper: undefined },
    }
  },
  brand: {
    label: 'Brand',
    sub: 'Businesses, companies & agencies',
    gradient: 'from-[#3D5087] to-[#2B3B68]',
    icon: (
      <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    activeIcon: (
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    fields: {
      name:     { label: 'Brand / Company name',     placeholder: 'e.g. BoAt Lifestyle',         helper: 'Enter your registered brand or company name' },
      email:    { label: 'Work email',               placeholder: 'marketing@yourbrand.com',      helper: 'A verification code will be sent to this address' },
      mobile:   { label: 'Business contact number',  placeholder: '98765 43210',                  helper: 'Used for two-factor authentication and campaign notifications' },
      password: { label: 'Create a password',        placeholder: 'At least 8 characters',        helper: undefined },
    }
  }
};

const FEATURES = [
  {
    color: 'bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F]',
    icon: (
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    text: 'Mobile + email OTP verification keeps bots out',
  },
  {
    color: 'bg-gradient-to-br from-amber-500 to-orange-500',
    icon: (
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    text: 'Public creator profile with custom URL',
  },
  {
    color: 'bg-gradient-to-br from-indigo-500 to-blue-600',
    icon: (
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    text: 'In-platform chat with auto contact moderation',
  },
];

const STATS = [
  { value: '2K+', label: 'Creators', color: 'bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200 text-teal-900' },
  { value: '800+', label: 'Brands', color: 'bg-gradient-to-br from-indigo-50 to-blue-100 border-indigo-200 text-indigo-900' },
  { value: '5K+', label: 'Collabs', color: 'bg-gradient-to-br from-violet-50 to-purple-100 border-violet-200 text-violet-900' },
];

export default function SignupPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role>('influencer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!name || !email || !mobile || !password) { setError('All fields are required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/register', { name, email, mobile: `+91${mobile}`, password, role });
      localStorage.setItem('pendingUserId', response.data.userId);
      localStorage.setItem('pendingEmail', email);
      localStorage.setItem('pendingMobile', mobile);
      router.push('/auth/verify-otp');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      if (!e.response) setError('Cannot reach the server. Make sure the backend is running.');
      else setError(e.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

        {/* ── Left panel ── */}
        <div className="hidden lg:flex flex-col">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-800/80 backdrop-blur-sm border border-slate-700/60 rounded-full text-xs font-semibold text-slate-300 mb-6 shadow-sm w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            Trusted by creators and brands across India
          </div>

          <h1 className="text-[2.75rem] font-bold leading-[1.12] tracking-tight text-white mb-4">
            Create your account<br />
            and{' '}
            <span className="bg-gradient-to-r from-[#7FA8AD] via-[#5D8A8F] to-[#7C9ED9] bg-clip-text text-transparent">
              start connecting
            </span>.
          </h1>

          <p className="text-slate-400 text-[0.95rem] leading-relaxed mb-8 max-w-[22rem]">
            Whether you create content or run a brand, Influence Connect is where serious collaborations begin.
          </p>

          <div className="flex flex-col gap-3 p-5 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-sm mb-8">
            {FEATURES.map((item, i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  {item.icon}
                </div>
                <span className="text-sm text-slate-300 font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {STATS.map((s, i) => (
              <div key={i} className="p-4 rounded-2xl text-center bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-sm">
                <div className={`text-xl font-bold ${s.color.includes('teal') ? 'text-teal-400' : s.color.includes('indigo') ? 'text-indigo-400' : 'text-violet-400'}`}>{s.value}</div>
                <div className="text-xs font-semibold mt-0.5 text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right — Signup card ── */}
        <div className="rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.4),0_8px_32px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.06)] border border-slate-700/60">

          {/* Gradient accent bar */}
          <div className="h-[3px] bg-gradient-to-r from-[#7FA8AD] via-[#5D8A8F] to-[#3D5087]" />

          <div className="bg-[#0E1B2E] px-8 pt-7 pb-8">

            {/* IC branding inside card */}
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7FA8AD] to-[#3D5087] flex items-center justify-center text-white font-bold text-sm shadow-md">
                IC
              </div>
              <div>
                <span className="text-sm font-bold text-slate-100 tracking-tight block leading-none">Influence Connect</span>
                <span className="text-[0.65rem] text-slate-500 font-medium tracking-wide uppercase">Creator · Brand Platform</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-1.5 tracking-tight">Create your account</h2>
            <p className="text-sm text-slate-400 mb-6">
              Secure your account with email and mobile verification.
            </p>

            {/* Role picker */}
            <label className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest block mb-2.5">
              I am signing up as
            </label>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {(['influencer', 'brand'] as Role[]).map((r) => {
                const isActive = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      isActive
                        ? `bg-gradient-to-br ${ROLE_META[r].gradient} border-transparent shadow-lg`
                        : 'border-slate-700 hover:border-slate-600 bg-slate-800/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/20' : 'bg-slate-700/80'}`}>
                        {isActive ? ROLE_META[r].activeIcon : ROLE_META[r].icon}
                      </div>
                      <span className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-200'}`}>
                        {ROLE_META[r].label}
                      </span>
                      {isActive && (
                        <svg className="w-3.5 h-3.5 text-white/90 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    <div className={`text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                      {ROLE_META[r].sub}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Form fields */}
            <div className="flex flex-col gap-3">
              <Input dark label={ROLE_META[role].fields.name.label} placeholder={ROLE_META[role].fields.name.placeholder} helper={ROLE_META[role].fields.name.helper} value={name} onChange={setName} />
              <Input dark label={ROLE_META[role].fields.email.label} type="email" placeholder={ROLE_META[role].fields.email.placeholder} helper={ROLE_META[role].fields.email.helper} value={email} onChange={setEmail} />
              <Input dark label={ROLE_META[role].fields.mobile.label} type="tel" placeholder={ROLE_META[role].fields.mobile.placeholder} helper={ROLE_META[role].fields.mobile.helper} value={mobile} onChange={setMobile} prefix="+91" />
              <Input dark label={ROLE_META[role].fields.password.label} type="password" placeholder={ROLE_META[role].fields.password.placeholder} value={password} onChange={setPassword} showPasswordToggle />
            </div>

            {error && (
              <div className="mt-3 p-3.5 bg-red-900/30 border border-red-700/40 rounded-xl text-sm text-red-300 flex items-start gap-2.5">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Bot protection */}
            <div className="mt-4 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center gap-3 text-xs text-slate-500 font-medium">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              Bot protection enabled · Secured by Cloudflare
            </div>

            <div className="mt-4">
              <Button type="button" fullWidth loading={loading} onClick={handleSignup}>
                Continue to verification →
              </Button>
            </div>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-700/80" />
              <span className="text-[0.7rem] text-slate-500 font-semibold uppercase tracking-wider whitespace-nowrap">or</span>
              <div className="flex-1 h-px bg-slate-700/80" />
            </div>

            <button
              type="button"
              onClick={() => { window.location.href = `${API_URL}/api/auth/google?role=${role}`; }}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 border border-slate-700 rounded-xl text-sm font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 hover:border-slate-600 hover:shadow-md active:scale-[0.985] transition-all duration-200 cursor-pointer"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083 43.595 20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Continue with Google
            </button>

            <p className="text-[0.72rem] text-slate-600 text-center mt-5">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[#7FA8AD] font-semibold hover:text-[#9FC8CD] transition-colors">
                Sign in →
              </Link>
            </p>
          </div>
        </div>

      </div>
    </AuthLayout>
  );
}
