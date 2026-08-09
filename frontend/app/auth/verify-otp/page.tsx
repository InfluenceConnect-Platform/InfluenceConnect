'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/shared/AuthLayout';
import Button from '@/components/shared/Button';
import api from '@/lib/api';
import { useTheme } from '@/lib/useTheme';

export default function VerifyOTPPage() {
  const router = useRouter();
  const { isDark } = useTheme();

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
  const [emailExpiryTimer, setEmailExpiryTimer] = useState(600);
  const [mobileExpiryTimer, setMobileExpiryTimer] = useState(600);

  const emailRefs = useRef<(HTMLInputElement | null)[]>([]);
  const mobileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const userId = typeof window !== 'undefined'
    ? localStorage.getItem('pendingUserId')
    : null;
  const pendingEmail = typeof window !== 'undefined' ? localStorage.getItem('pendingEmail') : null;
  const pendingMobile = typeof window !== 'undefined' ? localStorage.getItem('pendingMobile') : null;

  // Theme the verification screen to match the account being created: brands
  // get forest green (#228B22), creators get ruby red (#E0115F) — same
  // ROLE_COLOR pair as the signup page just before this step. Both class
  // sets are written out in full so Tailwind generates them at build time.
  const isBrand = (typeof window !== 'undefined' ? localStorage.getItem('pendingRole') : null) === 'brand';
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
    if (emailTimer <= 0) return;
    const interval = setInterval(() => setEmailTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [emailTimer]);

  useEffect(() => {
    if (mobileTimer <= 0) return;
    const interval = setInterval(() => setMobileTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [mobileTimer]);

  useEffect(() => {
    if (emailExpiryTimer <= 0 || emailVerified) return;
    const interval = setInterval(() => setEmailExpiryTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [emailExpiryTimer, emailVerified]);

  useEffect(() => {
    if (mobileExpiryTimer <= 0 || mobileVerified) return;
    const interval = setInterval(() => setMobileExpiryTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [mobileExpiryTimer, mobileVerified]);

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
        setEmailExpiryTimer(600);
        emailRefs.current[0]?.focus();
      } else {
        setMobileOTP(['', '', '', '', '', '']);
        setMobileTimer(42);
        setMobileExpiryTimer(600);
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

  const formatExpiry = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;

  const otpInputClass = (digit: string, verified: boolean) => {
    if (verified) {
      return isDark
        ? 'border-emerald-600/50 bg-emerald-900/20 text-emerald-400'
        : 'border-emerald-400 bg-emerald-50 text-emerald-600';
    }
    if (digit) {
      return isDark ? TH.inputFilledDark : TH.inputFilledLight;
    }
    return isDark ? TH.inputIdleDark : TH.inputIdleLight;
  };

  return (
    <AuthLayout role={isBrand ? 'brand' : 'influencer'}>
      <div className="w-full max-w-2xl">

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
            <span className={`font-semibold transition-colors ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>Verify identity</span>
          </div>
          <div className={`w-8 h-px transition-colors ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`} />
          <div className="flex items-center gap-1.5">
            <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-600' : 'bg-gray-100 border-gray-300 text-gray-400'
            }`}>3</span>
            <span className={`transition-colors ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Complete profile</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-2xl font-bold mb-2 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Verify your email and mobile
          </h1>
          <p className={`text-sm max-w-md mx-auto leading-relaxed transition-colors ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            We sent 6-digit codes to both. Enter them below to confirm it&apos;s really you.
          </p>
        </div>

        {/* Dual OTP cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">

          {/* Email OTP */}
          <div className={`border-2 rounded-xl p-5 transition-all duration-300 ${
            emailVerified
              ? isDark ? 'border-emerald-600/50 bg-emerald-900/20' : 'border-emerald-400 bg-emerald-50'
              : isDark ? 'border-slate-700/60 bg-[#0E1B2E]' : 'border-gray-200 bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  emailVerified
                    ? isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'
                    : isDark ? 'bg-slate-800' : 'bg-gray-100'
                }`}>
                  <svg className={`w-4 h-4 ${emailVerified ? 'text-emerald-400' : isDark ? TH.iconDark : TH.iconLight}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div>
                  <div className={`text-[0.65rem] uppercase tracking-wider font-bold transition-colors ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Email code</div>
                  <div className={`text-sm font-semibold font-mono transition-colors ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                    {pendingEmail?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'your email'}
                  </div>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                emailVerified
                  ? isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                  : isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'
              }`}>
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
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInput(i, e.target.value, emailOTP, setEmailOTP, emailRefs)}
                  onKeyDown={e => handleKeyDown(e, i, emailOTP, setEmailOTP, emailRefs)}
                  onPaste={e => handlePaste(e, emailOTP, setEmailOTP, emailRefs)}
                  disabled={emailVerified}
                  className={`flex-1 aspect-square max-w-[42px] text-center text-lg font-bold border-2 rounded-xl focus:outline-none transition-all duration-150 ${otpInputClass(digit, emailVerified)}`}
                />
              ))}
            </div>

            {!emailVerified && (
              <p className={`text-xs mb-2 transition-colors ${
                emailExpiryTimer === 0 ? 'text-red-400' :
                emailExpiryTimer < 60 ? 'text-amber-400' :
                isDark ? 'text-slate-400' : 'text-gray-400'
              }`}>
                {emailExpiryTimer === 0
                  ? 'Code expired — request a new one'
                  : `Expires in ${formatExpiry(emailExpiryTimer)}`}
              </p>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className={`transition-colors ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {emailTimer > 0 ? `Resend in 0:${String(emailTimer).padStart(2, '0')}` : ''}
              </span>
              <button
                disabled={emailTimer > 0 || resendingEmail || emailVerified}
                onClick={() => handleResend('email')}
                className={`${TH.link} font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer`}
              >
                {resendingEmail ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          </div>

          {/* Mobile OTP */}
          <div className={`border-2 rounded-xl p-5 transition-all duration-300 ${
            mobileVerified
              ? isDark ? 'border-emerald-600/50 bg-emerald-900/20' : 'border-emerald-400 bg-emerald-50'
              : isDark ? 'border-slate-700/60 bg-[#0E1B2E]' : 'border-gray-200 bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  mobileVerified
                    ? isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'
                    : isDark ? 'bg-slate-800' : 'bg-gray-100'
                }`}>
                  <svg className={`w-4 h-4 ${mobileVerified ? 'text-emerald-400' : isDark ? TH.iconDark : TH.iconLight}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                </div>
                <div>
                  <div className={`text-[0.65rem] uppercase tracking-wider font-bold transition-colors ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Mobile code</div>
                  <div className={`text-sm font-semibold font-mono transition-colors ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                    +91 {pendingMobile?.replace(/(\d{2})\d+(\d{2})/, '$1***$2') || 'your mobile'}
                  </div>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                mobileVerified
                  ? isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                  : isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'
              }`}>
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
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInput(i, e.target.value, mobileOTP, setMobileOTP, mobileRefs)}
                  onKeyDown={e => handleKeyDown(e, i, mobileOTP, setMobileOTP, mobileRefs)}
                  onPaste={e => handlePaste(e, mobileOTP, setMobileOTP, mobileRefs)}
                  disabled={mobileVerified}
                  className={`flex-1 aspect-square max-w-[42px] text-center text-lg font-bold border-2 rounded-xl focus:outline-none transition-all duration-150 ${otpInputClass(digit, mobileVerified)}`}
                />
              ))}
            </div>

            {!mobileVerified && (
              <p className={`text-xs mb-2 transition-colors ${
                mobileExpiryTimer === 0 ? 'text-red-400' :
                mobileExpiryTimer < 60 ? 'text-amber-400' :
                isDark ? 'text-slate-400' : 'text-gray-400'
              }`}>
                {mobileExpiryTimer === 0
                  ? 'Code expired — request a new one'
                  : `Expires in ${formatExpiry(mobileExpiryTimer)}`}
              </p>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className={`transition-colors ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {mobileTimer > 0 ? `Resend in 0:${String(mobileTimer).padStart(2, '0')}` : ''}
              </span>
              <button
                disabled={mobileTimer > 0 || resendingMobile || mobileVerified}
                onClick={() => handleResend('mobile')}
                className={`${TH.link} font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer`}
              >
                {resendingMobile ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          </div>

        </div>

        {/* Info note */}
        <div className={`border rounded-xl p-3.5 flex items-start gap-2.5 mb-5 text-sm transition-colors ${
          isDark
            ? 'bg-slate-800/60 border-slate-700/60 text-slate-400'
            : 'bg-blue-50 border-blue-100 text-blue-600'
        }`}>
          <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? TH.iconDark : 'text-blue-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Check your email inbox for the 6-digit code. Mobile OTP will be sent via SMS once MSG91 is configured.
        </div>

        {/* Success / Error */}
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

        {/* CTA */}
        <Button fullWidth loading={loading} onClick={handleVerifyBoth} disabled={!bothFilled} colorScheme={isBrand ? 'brand' : 'influencer'}>
          {emailVerified && mobileVerified ? 'Both verified — Continue →' : 'Verify codes →'}
        </Button>

        <p className={`text-xs text-center mt-4 transition-colors ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Wrong email or mobile?{' '}
          <a href="/auth/signup" className={`${TH.link} font-semibold transition-colors`}>
            Go back and edit
          </a>
        </p>

      </div>
    </AuthLayout>
  );
}
