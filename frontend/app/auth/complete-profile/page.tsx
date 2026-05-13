'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/shared/AuthLayout';
import api from '@/lib/api';

type Step = 'phone' | 'otp';

export default function CompleteProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userId, setUserId] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const id = searchParams.get('userId');
    if (!id) { router.replace('/auth/login'); return; }
    setUserId(id);
  }, [searchParams, router]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSendOtp = async () => {
    setError('');
    const digits = mobile.replace(/\s/g, '');
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/send-mobile-otp', { userId, mobile: digits });
      setStep('otp');
      setResendCooldown(30);
      setSuccess('OTP sent! Check your messages.');
      setTimeout(() => { setSuccess(''); otpRefs.current[0]?.focus(); }, 800);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter all 6 digits.'); return; }

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/verify-otp', {
        userId,
        type: 'mobile',
        otp: code
      });

      // verify-otp returns token only when both email + mobile verified
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        const role = response.data.user?.role;
        if (role === 'brand') router.replace('/brand/dashboard');
        else router.replace('/influencer/dashboard');
      } else {
        // Partial verification — should not happen for Google users but handle gracefully
        router.replace('/auth/verify-otp');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtp(['', '', '', '', '', '']);
    setError('');
    await handleSendOtp();
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        <div className="rounded-2xl overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.07),0_24px_56px_rgba(127,168,173,0.1)] border border-gray-200/80">
          {/* Gradient accent bar */}
          <div className="h-[3px] bg-gradient-to-r from-[#7FA8AD] via-[#5D8A8F] to-[#3D5087]" />

          <div className="bg-white p-8">

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              <StepDot active={step === 'phone'} done={step === 'otp'} label="1" />
              <div className="flex-1 h-px bg-gray-200" />
              <StepDot active={step === 'otp'} done={false} label="2" />
            </div>

            {step === 'phone' ? (
              <>
                {/* Header */}
                <div className="mb-6">
                  <div className="w-11 h-11 rounded-xl bg-[#EEF4F5] border border-[#dce9ea] flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-[#5D8A8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.73a16 16 0 0 0 6 6l1.06-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
                    Verify your mobile
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Add your mobile number to enable two-factor authentication and receive real-time campaign notifications.
                  </p>
                </div>

                {/* Phone input */}
                <div className="flex flex-col gap-1.5 mb-5">
                  <label className="text-xs font-medium text-gray-700">Mobile number</label>
                  <div className="flex">
                    <span className="flex items-center px-3 py-2.5 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-sm text-gray-600 font-medium select-none">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="98765 43210"
                      value={mobile}
                      onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                      className="w-full px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 border border-gray-200 rounded-r-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#7FA8AD] focus:border-[#7FA8AD] hover:border-gray-300 transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500">A verification code will be sent to this number</p>
                </div>

                {error && <ErrorBox message={error} />}

                <button
                  onClick={handleSendOtp}
                  disabled={loading || mobile.replace(/\s/g, '').length < 10}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-white bg-[#7FA8AD] hover:bg-[#5D8A8F] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Sending OTP…
                    </>
                  ) : 'Send OTP →'}
                </button>
              </>
            ) : (
              <>
                {/* OTP step */}
                <div className="mb-6">
                  <div className="w-11 h-11 rounded-xl bg-[#EEF4F5] border border-[#dce9ea] flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-[#5D8A8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
                    Enter the OTP
                  </h2>
                  <p className="text-sm text-gray-500">
                    We sent a 6-digit code to{' '}
                    <span className="font-semibold text-gray-700">+91 {mobile}</span>.{' '}
                    <button
                      onClick={() => { setStep('phone'); setOtp(['','','','','','']); setError(''); }}
                      className="text-[#5D8A8F] hover:underline text-xs font-medium cursor-pointer"
                    >
                      Change
                    </button>
                  </p>
                </div>

                {success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    {success}
                  </div>
                )}

                {/* 6-box OTP input */}
                <div className="flex gap-2.5 mb-5 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`
                        w-11 h-12 text-center text-xl font-bold text-gray-900 border rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-[#7FA8AD] focus:border-[#7FA8AD]
                        transition-all duration-150
                        ${digit ? 'border-[#7FA8AD] bg-[#EEF4F5]' : 'border-gray-200 bg-white hover:border-gray-300'}
                      `}
                    />
                  ))}
                </div>

                {error && <ErrorBox message={error} />}

                <button
                  onClick={handleVerify}
                  disabled={loading || otp.join('').length < 6}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-white bg-[#7FA8AD] hover:bg-[#5D8A8F] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer mb-4"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Verifying…
                    </>
                  ) : 'Verify & Continue →'}
                </button>

                <p className="text-xs text-center text-gray-500">
                  Didn&apos;t receive the code?{' '}
                  {resendCooldown > 0 ? (
                    <span className="text-gray-400">Resend in {resendCooldown}s</span>
                  ) : (
                    <button
                      onClick={handleResend}
                      className="text-[#5D8A8F] font-semibold hover:underline cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
              </>
            )}

          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-5">
          Your number is used solely for authentication and notifications. We never share it with third parties.
        </p>
      </div>
    </AuthLayout>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className={`
      w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
      ${done ? 'bg-[#7FA8AD] text-white' : active ? 'bg-[#7FA8AD] text-white ring-4 ring-[#EEF4F5]' : 'bg-gray-100 text-gray-400'}
    `}>
      {done ? (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : label}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-start gap-2">
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {message}
    </div>
  );
}
