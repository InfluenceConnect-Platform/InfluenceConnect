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
  fields: {
    name:     { label: string; placeholder: string; helper?: string };
    email:    { label: string; placeholder: string; helper: string };
    mobile:   { label: string; placeholder: string; helper: string };
    password: { label: string; placeholder: string; helper?: string };
  };
}> = {
  influencer: {
    label: 'Influencer',
    sub: 'Creators, reviewers',
    icon: (
      <svg className="w-4 h-4 text-[#5D8A8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    sub: 'Businesses, brands',
    icon: (
      <svg className="w-4 h-4 text-[#5D8A8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    if (!name || !email || !mobile || !password) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/register', {
        name,
        email,
        mobile: `+91${mobile}`,
        password,
        role
      });

      localStorage.setItem('pendingUserId', response.data.userId);
      localStorage.setItem('pendingEmail', email);
      localStorage.setItem('pendingMobile', mobile);

      router.push('/auth/verify-otp');

    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      if (!e.response) {
        setError('Cannot reach the server. Make sure the backend is running.');
      } else {
        setError(e.response?.data?.error || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

        {/* ── Left panel ── */}
        <div className="hidden lg:flex flex-col">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-xs font-medium text-gray-600 mb-6 shadow-sm w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]"></span>
            Trusted by creators and brands across India
          </div>

          <h1 className="text-[2.6rem] font-bold leading-[1.15] tracking-tight text-gray-900 mb-4">
            Create your account<br />
            and{' '}
            <span className="bg-gradient-to-r from-[#7FA8AD] via-[#5D8A8F] to-[#3D5087] bg-clip-text text-transparent">
              start connecting
            </span>.
          </h1>

          <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-sm">
            Whether you create content or run a brand, Influence Connect is where serious collaborations begin.
          </p>

          <div className="flex flex-col gap-3.5">
            {[
              {
                icon: (
                  <svg className="w-4 h-4 text-[#5D8A8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                ),
                text: 'Mobile + email OTP verification keeps bots out'
              },
              {
                icon: (
                  <svg className="w-4 h-4 text-[#5D8A8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                ),
                text: 'Public creator profile with custom URL'
              },
              {
                icon: (
                  <svg className="w-4 h-4 text-[#5D8A8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                ),
                text: 'In-platform chat with auto contact moderation'
              }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EEF4F5] border border-[#dce9ea] flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <span className="text-sm text-gray-600">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { value: '2K+', label: 'Creators' },
              { value: '800+', label: 'Brands' },
              { value: '5K+', label: 'Collabs' }
            ].map((s, i) => (
              <div key={i} className="p-3.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-center shadow-sm">
                <div className="text-lg font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right — Signup card ── */}
        <div className="rounded-2xl overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.07),0_24px_56px_rgba(127,168,173,0.1)] border border-gray-200/80">
          {/* Gradient accent bar */}
          <div className="h-[3px] bg-gradient-to-r from-[#7FA8AD] via-[#5D8A8F] to-[#3D5087]" />

          <div className="bg-white p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">
              Sign up for Influence Connect
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Secure your account with email and mobile verification.
            </p>

            {/* Role picker */}
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-2.5">
              I am signing up as
            </label>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {(['influencer', 'brand'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`
                    p-3.5 rounded-xl border-2 text-left transition-all duration-150 cursor-pointer
                    ${role === r
                      ? 'border-[#7FA8AD] bg-[#EEF4F5] shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {ROLE_META[r].icon}
                    <span className="font-semibold text-sm text-gray-900">{ROLE_META[r].label}</span>
                  </div>
                  <div className="text-xs text-gray-500">{ROLE_META[r].sub}</div>
                </button>
              ))}
            </div>

            {/* Form fields — labels and hints change by role */}
            <div className="flex flex-col gap-3">
              <Input
                label={ROLE_META[role].fields.name.label}
                placeholder={ROLE_META[role].fields.name.placeholder}
                helper={ROLE_META[role].fields.name.helper}
                value={name}
                onChange={setName}
              />
              <Input
                label={ROLE_META[role].fields.email.label}
                type="email"
                placeholder={ROLE_META[role].fields.email.placeholder}
                helper={ROLE_META[role].fields.email.helper}
                value={email}
                onChange={setEmail}
              />
              <Input
                label={ROLE_META[role].fields.mobile.label}
                type="tel"
                placeholder={ROLE_META[role].fields.mobile.placeholder}
                helper={ROLE_META[role].fields.mobile.helper}
                value={mobile}
                onChange={setMobile}
                prefix="+91"
              />
              <Input
                label={ROLE_META[role].fields.password.label}
                type="password"
                placeholder={ROLE_META[role].fields.password.placeholder}
                value={password}
                onChange={setPassword}
              />
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Captcha placeholder */}
            <div className="mt-4 p-3 bg-gray-50 border border-dashed border-gray-200 rounded-lg flex items-center gap-3 text-sm text-gray-500">
              <div className="w-5 h-5 rounded-md bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">or sign up with</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <button
              type="button"
              onClick={() => { window.location.href = `${API_URL}/api/auth/google?role=${role}`; }}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-150 cursor-pointer"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083 43.595 20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Continue with Google
            </button>

            <p className="text-xs text-gray-500 text-center mt-5">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[#5D8A8F] font-semibold hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>

      </div>
    </AuthLayout>
  );
}
