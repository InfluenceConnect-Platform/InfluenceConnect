'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/shared/AuthLayout';
import Button from '@/components/shared/Button';
import api from '@/lib/api';

export default function VerifyOTPPage() {
  const router = useRouter();

  const [emailOTP, setEmailOTP] = useState(['', '', '', '', '', '']);
  const [mobileOTP, setMobileOTP] = useState(['', '', '', '', '', '']);
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailTimer, setEmailTimer] = useState(42);
  const [mobileTimer, setMobileTimer] = useState(42);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendingMobile, setResendingMobile] = useState(false);

  const emailRefs = useRef<(HTMLInputElement | null)[]>([]);
  const mobileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const userId = typeof window !== 'undefined'
    ? localStorage.getItem('pendingUserId')
    : null;

  useEffect(() => {
    if (emailTimer <= 0) return;
    const interval = setInterval(() => setEmailTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [emailTimer]);

  useEffect(() => {
    if (mobileTimer <= 0) return;
    const interval = setInterval(() => setMobileTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [mobileTimer]);

  const handleInput = (
    index: number,
    value: string,
    otpArray: string[],
    setOTP: (v: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    const digit = value.replace(/[^0-9]/g, '').slice(0, 1);
    const newOTP = [...otpArray];
    newOTP[index] = digit;
    setOTP(newOTP);
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };

  const handlePaste = (
    e: React.ClipboardEvent,
    otpArray: string[],
    setOTP: (v: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6).split('');
    if (digits.length === 0) return;
    const newOTP = [...otpArray];
    digits.forEach((d, i) => { if (i < 6) newOTP[i] = d; });
    setOTP(newOTP);
    const lastFilled = Math.min(digits.length, 5);
    refs.current[lastFilled]?.focus();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    otpArray: string[],
    setOTP: (v: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === 'Backspace') {
      if (otpArray[index]) {
        const newOTP = [...otpArray];
        newOTP[index] = '';
        setOTP(newOTP);
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handleResend = async (type: 'email' | 'mobile') => {
    setError('');
    setSuccess('');
    if (type === 'email') setResendingEmail(true);
    else setResendingMobile(true);

    try {
      await api.post('/api/auth/resend-otp', { userId, type });
      if (type === 'email') {
        setEmailOTP(['', '', '', '', '', '']);
        setEmailTimer(42);
        emailRefs.current[0]?.focus();
      } else {
        setMobileOTP(['', '', '', '', '', '']);
        setMobileTimer(42);
        mobileRefs.current[0]?.focus();
      }
      setSuccess(`New ${type} code sent!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to resend ${type} code.`);
    } finally {
      if (type === 'email') setResendingEmail(false);
      else setResendingMobile(false);
    }
  };

  const verifyOTP = async (type: 'email' | 'mobile', otpArray: string[]) => {
    const otp = otpArray.join('');
    if (otp.length < 6) {
      setError(`Please enter all 6 digits for ${type} verification.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/verify-otp', { userId, type, otp });

      if (type === 'email') setEmailVerified(true);
      if (type === 'mobile') setMobileVerified(true);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.removeItem('pendingUserId');

        const user = response.data.user;
        if (user.role === 'influencer') router.push('/influencer/dashboard');
        else if (user.role === 'brand') router.push('/brand/dashboard');
        else router.push('/admin/dashboard');
      }

    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const bothFilled =
    emailOTP.every(d => d !== '') &&
    mobileOTP.every(d => d !== '');

  const handleVerifyBoth = async () => {
    if (!emailVerified) await verifyOTP('email', emailOTP);
    if (!mobileVerified) await verifyOTP('mobile', mobileOTP);
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-2xl">

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-3 mb-8 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-[#5D8A8F]/30 border border-[#5D8A8F]/50 text-[#7FA8AD] flex items-center justify-center text-xs font-bold">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            <span className="text-slate-600">Account created</span>
          </div>
          <div className="w-8 h-px bg-slate-700"></div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-[#7FA8AD] text-white flex items-center justify-center text-xs font-bold shadow-[0_0_12px_rgba(127,168,173,0.5)]">2</span>
            <span className="text-slate-200 font-semibold">Verify identity</span>
          </div>
          <div className="w-8 h-px bg-slate-700"></div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-600 flex items-center justify-center text-xs font-bold">3</span>
            Complete profile
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Verify your email and mobile
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            We sent 6-digit codes to both. Enter them below to confirm it&apos;s really you.
          </p>
        </div>

        {/* Dual OTP cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">

          {/* Email OTP */}
          <div className={`border-2 rounded-xl p-5 transition-all duration-300 ${
            emailVerified
              ? 'border-emerald-600/50 bg-emerald-900/20'
              : 'border-slate-700/60 bg-[#0E1B2E]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${emailVerified ? 'bg-emerald-900/50' : 'bg-slate-800'}`}>
                  <svg className={`w-4 h-4 ${emailVerified ? 'text-emerald-400' : 'text-[#7FA8AD]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div>
                  <div className="text-[0.65rem] text-slate-500 uppercase tracking-wider font-bold">Email code</div>
                  <div className="text-sm font-semibold font-mono text-slate-200">
                    {localStorage.getItem('pendingEmail')?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'your email'}
                  </div>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${emailVerified ? 'bg-emerald-900/50 text-emerald-400' : 'bg-amber-900/30 text-amber-400'}`}>
                {emailVerified ? 'Verified' : 'Pending'}
              </span>
            </div>

            <div className="flex gap-2 mb-3">
              {emailOTP.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { emailRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInput(i, e.target.value, emailOTP, setEmailOTP, emailRefs)}
                  onKeyDown={e => handleKeyDown(e, i, emailOTP, setEmailOTP, emailRefs)}
                  onPaste={e => handlePaste(e, emailOTP, setEmailOTP, emailRefs)}
                  disabled={emailVerified}
                  className={`
                    flex-1 aspect-square max-w-[42px] text-center text-lg font-bold border-2 rounded-xl
                    focus:outline-none transition-all duration-150
                    ${emailVerified
                      ? 'border-emerald-600/50 bg-emerald-900/20 text-emerald-400'
                      : digit
                        ? 'border-[#7FA8AD] bg-[#7FA8AD]/10 text-[#9FC8CD]'
                        : 'border-slate-700 bg-[#0A1628] text-slate-100 focus:border-[#7FA8AD] focus:bg-[#7FA8AD]/5'
                    }
                  `}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">
                {emailTimer > 0 ? `Resend in 0:${String(emailTimer).padStart(2, '0')}` : 'Code expired'}
              </span>
              <button
                disabled={emailTimer > 0 || resendingEmail || emailVerified}
                onClick={() => handleResend('email')}
                className="text-[#7FA8AD] font-semibold hover:text-[#9FC8CD] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {resendingEmail ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          </div>

          {/* Mobile OTP */}
          <div className={`border-2 rounded-xl p-5 transition-all duration-300 ${
            mobileVerified
              ? 'border-emerald-600/50 bg-emerald-900/20'
              : 'border-slate-700/60 bg-[#0E1B2E]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mobileVerified ? 'bg-emerald-900/50' : 'bg-slate-800'}`}>
                  <svg className={`w-4 h-4 ${mobileVerified ? 'text-emerald-400' : 'text-[#7FA8AD]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                </div>
                <div>
                  <div className="text-[0.65rem] text-slate-500 uppercase tracking-wider font-bold">Mobile code</div>
                  <div className="text-sm font-semibold font-mono text-slate-200">
                    +91 {localStorage.getItem('pendingMobile')?.replace(/(\d{2})\d+(\d{2})/, '$1***$2') || 'your mobile'}
                  </div>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${mobileVerified ? 'bg-emerald-900/50 text-emerald-400' : 'bg-amber-900/30 text-amber-400'}`}>
                {mobileVerified ? 'Verified' : 'Pending'}
              </span>
            </div>

            <div className="flex gap-2 mb-3">
              {mobileOTP.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { mobileRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInput(i, e.target.value, mobileOTP, setMobileOTP, mobileRefs)}
                  onKeyDown={e => handleKeyDown(e, i, mobileOTP, setMobileOTP, mobileRefs)}
                  onPaste={e => handlePaste(e, mobileOTP, setMobileOTP, mobileRefs)}
                  disabled={mobileVerified}
                  className={`
                    flex-1 aspect-square max-w-[42px] text-center text-lg font-bold border-2 rounded-xl
                    focus:outline-none transition-all duration-150
                    ${mobileVerified
                      ? 'border-emerald-600/50 bg-emerald-900/20 text-emerald-400'
                      : digit
                        ? 'border-[#7FA8AD] bg-[#7FA8AD]/10 text-[#9FC8CD]'
                        : 'border-slate-700 bg-[#0A1628] text-slate-100 focus:border-[#7FA8AD] focus:bg-[#7FA8AD]/5'
                    }
                  `}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">
                {mobileTimer > 0 ? `Resend in 0:${String(mobileTimer).padStart(2, '0')}` : 'Code expired'}
              </span>
              <button
                disabled={mobileTimer > 0 || resendingMobile || mobileVerified}
                onClick={() => handleResend('mobile')}
                className="text-[#7FA8AD] font-semibold hover:text-[#9FC8CD] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {resendingMobile ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          </div>

        </div>

        {/* Info note */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex items-start gap-2.5 mb-5 text-sm text-slate-400">
          <svg className="w-4 h-4 text-[#7FA8AD] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Check your email inbox for the 6-digit code. Mobile OTP will be sent via SMS once MSG91 is configured.
        </div>

        {/* Success / Error */}
        {success && (
          <div className="mb-4 p-3.5 bg-emerald-900/30 border border-emerald-700/40 rounded-xl text-sm text-emerald-300 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3.5 bg-red-900/30 border border-red-700/40 rounded-xl text-sm text-red-300 flex items-start gap-2.5">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* CTA */}
        <Button fullWidth loading={loading} onClick={handleVerifyBoth} disabled={!bothFilled}>
          {emailVerified && mobileVerified ? 'Both verified — Continue →' : 'Verify codes →'}
        </Button>

        <p className="text-xs text-slate-600 text-center mt-4">
          Wrong email or mobile?{' '}
          <a href="/auth/signup" className="text-[#7FA8AD] font-semibold hover:text-[#9FC8CD] transition-colors">
            Go back and edit
          </a>
        </p>

      </div>
    </AuthLayout>
  );
}
