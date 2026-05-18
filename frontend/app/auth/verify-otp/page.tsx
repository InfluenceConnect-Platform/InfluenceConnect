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

  // Separate countdown timers
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

  // Handle digit input with auto advance
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
    if (digit && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  // Handle paste — distribute all digits across boxes
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

  // Handle backspace
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

  // Resend OTP for email or mobile
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

  // Verify a single OTP (email or mobile)
  const verifyOTP = async (type: 'email' | 'mobile', otpArray: string[]) => {
    const otp = otpArray.join('');
    if (otp.length < 6) {
      setError(`Please enter all 6 digits for ${type} verification.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/verify-otp', {
        userId,
        type,
        otp
      });

      if (type === 'email') setEmailVerified(true);
      if (type === 'mobile') setMobileVerified(true);

      // Both verified — save token and redirect
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.removeItem('pendingUserId');

        // Redirect based on role
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
        <div className="flex items-center justify-center gap-3 mb-8 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#7FA8AD] text-white flex items-center justify-center text-xs font-bold">✓</span>
            Account created
          </div>
          <div className="w-8 h-px bg-gray-300"></div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#7FA8AD] text-white flex items-center justify-center text-xs font-bold ring-4 ring-[#EEF4F5]">2</span>
            <span className="text-gray-800 font-medium">Verify identity</span>
          </div>
          <div className="w-8 h-px bg-gray-300"></div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">3</span>
            Complete profile
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Verify your email and mobile
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            We have sent 6-digit codes to both. Enter them below to confirm it is really you.
          </p>
        </div>

        {/* Dual OTP cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">

          {/* Email OTP */}
          <div className={`bg-white border-2 rounded-xl p-5 transition-all ${emailVerified ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${emailVerified ? 'bg-green-100' : 'bg-[#EEF4F5]'}`}>
                  <svg className={`w-4 h-4 ${emailVerified ? 'text-green-600' : 'text-[#5D8A8F]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Email code</div>
                  <div className="text-sm font-semibold font-mono text-gray-900">
                    {localStorage.getItem('pendingEmail')?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'your email'}
                  </div>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${emailVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
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
                    flex-1 aspect-square max-w-[42px] text-center text-lg font-bold border-2 rounded-lg
                    focus:outline-none focus:border-[#7FA8AD] transition-all
                    ${emailVerified ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-900'}
                  `}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">
                {emailTimer > 0 ? `Resend in 0:${String(emailTimer).padStart(2, '0')}` : 'Code expired'}
              </span>
              <button
                disabled={emailTimer > 0 || resendingEmail || emailVerified}
                onClick={() => handleResend('email')}
                className="text-[#5D8A8F] font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
              >
                {resendingEmail ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          </div>

          {/* Mobile OTP */}
          <div className={`bg-white border-2 rounded-xl p-5 transition-all ${mobileVerified ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mobileVerified ? 'bg-green-100' : 'bg-[#EEF4F5]'}`}>
                  <svg className={`w-4 h-4 ${mobileVerified ? 'text-green-600' : 'text-[#5D8A8F]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Mobile code</div>
                  <div className="text-sm font-semibold font-mono text-gray-900">
                    +91 {localStorage.getItem('pendingMobile')?.replace(/(\d{2})\d+(\d{2})/, '$1***$2') || 'your mobile'}
                  </div>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${mobileVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
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
                    flex-1 aspect-square max-w-[42px] text-center text-lg font-bold border-2 rounded-lg
                    focus:outline-none focus:border-[#7FA8AD] transition-all
                    ${mobileVerified ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-900'}
                  `}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">
                {mobileTimer > 0 ? `Resend in 0:${String(mobileTimer).padStart(2, '0')}` : 'Code expired'}
              </span>
              <button
                disabled={mobileTimer > 0 || resendingMobile || mobileVerified}
                onClick={() => handleResend('mobile')}
                className="text-[#5D8A8F] font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
              >
                {resendingMobile ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          </div>

        </div>

        {/* Info note */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-start gap-2.5 mb-5 text-sm text-gray-600">
          <svg className="w-4 h-4 text-[#5D8A8F] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Check your email inbox for the 6-digit code. Mobile OTP will be sent via SMS once MSG91 is configured.
        </div>

        {/* Success / Error */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* CTA */}
        <Button
          fullWidth
          loading={loading}
          onClick={handleVerifyBoth}
          disabled={!bothFilled}
        >
          {emailVerified && mobileVerified
            ? 'Both verified — Continue →'
            : 'Verify codes →'
          }
        </Button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Wrong email or mobile?{' '}
          <a href="/auth/signup" className="text-[#5D8A8F] font-medium hover:underline">
            Go back and edit
          </a>
        </p>

      </div>
    </AuthLayout>
  );
}