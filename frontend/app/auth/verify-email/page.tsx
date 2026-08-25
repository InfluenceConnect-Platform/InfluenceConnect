'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/shared/AuthLayout';
import Button from '@/components/shared/Button';
import api from '@/lib/api';
import { useTheme } from '@/lib/useTheme';

// Step 1 of the split signup verification flow: email only. Mobile is its own
// page (verify-mobile) reached only once this succeeds — for influencers it's
// mandatory there, for brands it's optional (client's call: a brand only has
// to prove its email + GSTIN). See backend/controllers/auth.controller.js
// (tryActivateUser) for the activation rule this mirrors.
export default function VerifyEmailPage() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(42);
  const [resending, setResending] = useState(false);
  const [expiryTimer, setExpiryTimer] = useState(600);

  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Snapshotted once at mount, NOT re-read on every render. verify-mobile
  // (the next step) clears these same keys once the whole signup finishes —
  // if this page read them live instead, that later removal would flip
  // `userId` to null the moment ANY state update here caused a re-render
  // (e.g. setLoading(false) in a finally block), and the guard effect below
  // would then fire router.replace('/auth/signup') and clobber whatever
  // navigation was already in flight.
  const [userId] = useState<string | null>(
    () => (typeof window !== 'undefined' ? localStorage.getItem('pendingUserId') : null)
  );
  const [pendingEmail] = useState<string | null>(
    () => (typeof window !== 'undefined' ? localStorage.getItem('pendingEmail') : null)
  );
  const [isBrand] = useState<boolean>(
    () => (typeof window !== 'undefined' ? localStorage.getItem('pendingRole') : null) === 'brand'
  );

  // No pending signup to verify (e.g. a hard reload after already finishing,
  // or a direct hit with no signup in flight) — nothing useful to show here.
  useEffect(() => {
    if (!userId) router.replace('/auth/signup');
  }, [userId, router]);

  // Same ROLE_COLOR pair as the signup page and the old dual-verify screen.
  const TH = isBrand
    ? {
        step1Light: 'bg-emerald-50 border-emerald-300 text-emerald-700',
        step1Dark:  'bg-[#228B22]/30 border-[#228B22]/50 text-[#8FE39A]',
        step2Badge: 'bg-[#3FA34D] shadow-[0_0_12px_rgba(63,163,77,0.5)]',
        iconLight:  'text-[#228B22]',
        iconDark:   'text-[#8FE39A]',
        link:       'text-[#228B22] hover:text-[#1B6E1B]',
        inputFilledDark:  'border-[#3FA34D] bg-[#3FA34D]/10 text-[#8FE39A]',
        inputFilledLight: 'border-[#228B22] bg-[#228B22]/10 text-[#14531D]',
        inputIdleDark:    'border-slate-700 bg-[#0A1628] text-slate-100 focus:border-[#3FA34D] focus:bg-[#3FA34D]/5',
        inputIdleLight:   'border-gray-200 bg-gray-50 text-gray-900 focus:border-[#228B22] focus:bg-[#228B22]/5',
      }
    : {
        step1Light: 'bg-rose-50 border-rose-300 text-[#B00D4D]',
        step1Dark:  'bg-[#E0115F]/30 border-[#E0115F]/50 text-[#FFA8C6]',
        step2Badge: 'bg-[#F0417B] shadow-[0_0_12px_rgba(240,65,123,0.5)]',
        iconLight:  'text-[#E0115F]',
        iconDark:   'text-[#FFA8C6]',
        link:       'text-[#E0115F] hover:text-[#B00D4D]',
        inputFilledDark:  'border-[#F0417B] bg-[#F0417B]/10 text-[#FFA8C6]',
        inputFilledLight: 'border-[#E0115F] bg-[#E0115F]/10 text-[#7A0F3D]',
        inputIdleDark:    'border-slate-700 bg-[#0A1628] text-slate-100 focus:border-[#F0417B] focus:bg-[#F0417B]/5',
        inputIdleLight:   'border-gray-200 bg-gray-50 text-gray-900 focus:border-[#E0115F] focus:bg-[#E0115F]/5',
      };

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (expiryTimer <= 0) return;
    const interval = setInterval(() => setExpiryTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [expiryTimer]);

  const handleInput = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(0, 1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6).split('');
    if (digits.length === 0) return;
    const next = [...otp];
    digits.forEach((d, i) => { if (i < 6) next[i] = d; });
    setOtp(next);
    refs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const next = [...otp];
        next[index] = '';
        setOtp(next);
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResending(true);
    try {
      await api.post('/api/auth/resend-otp', { userId, type: 'email' });
      setOtp(['', '', '', '', '', '']);
      setResendTimer(42);
      setExpiryTimer(600);
      refs.current[0]?.focus();
      setSuccess('New code sent!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/verify-otp', { userId, type: 'email', otp: code });

      // Brands activate right here (email + GSTIN is all that's required) —
      // token comes back immediately. Influencers still need mobile, so no
      // token yet. Either way, on to the mobile step next.
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      router.push('/auth/verify-mobile');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatExpiry = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  const filled = otp.every(d => d !== '');

  const otpInputClass = (digit: string) => {
    if (digit) return isDark ? TH.inputFilledDark : TH.inputFilledLight;
    return isDark ? TH.inputIdleDark : TH.inputIdleLight;
  };

  return (
    <AuthLayout role={isBrand ? 'brand' : 'influencer'}>
      <div className="w-full max-w-md">

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-3 mb-8 text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${
              isDark ? TH.step1Dark : TH.step1Light
            }`}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            <span className={`transition-colors ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Account created</span>
          </div>
          <div className={`w-8 h-px transition-colors ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`} />
          <div className="flex items-center gap-1.5">
            <span className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold ${TH.step2Badge}`}>2</span>
            <span className={`font-semibold transition-colors ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>Verify email</span>
          </div>
          <div className={`w-8 h-px transition-colors ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`} />
          <div className="flex items-center gap-1.5">
            <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-600' : 'bg-gray-100 border-gray-300 text-gray-400'
            }`}>3</span>
            <span className={`transition-colors ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Verify mobile{isBrand ? ' (optional)' : ''}
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            isDark ? 'bg-slate-800' : 'bg-gray-100'
          }`}>
            <svg className={`w-5 h-5 ${isDark ? TH.iconDark : TH.iconLight}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h1 className={`text-2xl font-bold mb-2 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Verify your email
          </h1>
          <p className={`text-sm max-w-sm mx-auto leading-relaxed transition-colors ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            We sent a 6-digit code to{' '}
            <span className="font-semibold font-mono">
              {pendingEmail?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'your email'}
            </span>. Enter it below to continue.
          </p>
        </div>

        {/* OTP boxes */}
        <div className={`border-2 rounded-xl p-5 mb-5 transition-all duration-300 ${
          isDark ? 'border-slate-700/60 bg-[#0E1B2E]' : 'border-gray-200 bg-white'
        }`}>
          <div className="flex gap-2 justify-center mb-3" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={digit}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => handleKeyDown(e, i)}
                className={`flex-1 aspect-square max-w-[48px] text-center text-lg font-bold border-2 rounded-xl focus:outline-none transition-all duration-150 ${otpInputClass(digit)}`}
              />
            ))}
          </div>

          <p className={`text-xs text-center mb-2 transition-colors ${
            expiryTimer === 0 ? 'text-red-400' :
            expiryTimer < 60 ? 'text-amber-400' :
            isDark ? 'text-slate-400' : 'text-gray-400'
          }`}>
            {expiryTimer === 0 ? 'Code expired — request a new one' : `Expires in ${formatExpiry(expiryTimer)}`}
          </p>
          <div className="flex items-center justify-center gap-1 text-xs">
            <span className={`transition-colors ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {resendTimer > 0 ? `Resend in 0:${String(resendTimer).padStart(2, '0')}` : "Didn't get it?"}
            </span>
            {resendTimer <= 0 && (
              <button
                disabled={resending}
                onClick={handleResend}
                className={`${TH.link} font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer`}
              >
                {resending ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </div>
        </div>

        {success && (
          <div className={`mb-4 p-3.5 border rounded-xl text-sm flex items-center gap-2 ${
            isDark ? 'bg-emerald-900/30 border-emerald-700/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {success}
          </div>
        )}
        {error && (
          <div role="alert" className={`mb-4 p-3.5 border rounded-xl text-sm flex items-start gap-2.5 ${
            isDark ? 'bg-red-900/30 border-red-700/40 text-red-300' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <Button fullWidth loading={loading} onClick={handleVerify} disabled={!filled} colorScheme={isBrand ? 'brand' : 'influencer'}>
          Verify email →
        </Button>

        <p className={`text-xs text-center mt-4 transition-colors ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Wrong email?{' '}
          <a href="/auth/signup" className={`${TH.link} font-semibold transition-colors`}>
            Go back and edit
          </a>
        </p>

      </div>
    </AuthLayout>
  );
}
