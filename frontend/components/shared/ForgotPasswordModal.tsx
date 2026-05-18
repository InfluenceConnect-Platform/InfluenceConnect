'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface ForgotPasswordModalProps {
  onClose: () => void;
  onSuccess: (email: string) => void;
}

type Step = 'email' | 'reset' | 'done';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.length <= 2 ? local[0] : local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 3))}@${domain}`;
}

export default function ForgotPasswordModal({ onClose, onSuccess }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [resending, setResending] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startResendTimer = useCallback(() => {
    setResendTimer(60);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Trap focus inside modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSendOtp = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email.trim())) { setError('Enter a valid email address.'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/forgot-password', { email: email.trim() });
      if (res.data.userId) {
        setUserId(res.data.userId);
        setStep('reset');
        startResendTimer();
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        // Email not found — show a neutral message
        setError('If an account with that email exists, a reset code has been sent.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; code?: string } } };
      if (e.response?.data?.code === 'USE_GOOGLE') {
        setError('This account uses Google Sign-In. Password reset is not available.');
      } else {
        setError(e.response?.data?.error || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
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
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const res = await api.post('/api/auth/forgot-password', { email: email.trim() });
      if (res.data.userId) {
        setOtp(['', '', '', '', '', '']);
        startResendTimer();
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleResetPassword = async () => {
    const otpStr = otp.join('');
    if (otpStr.length < 6) { setError('Enter the 6-digit code sent to your email.'); return; }
    if (!newPassword) { setError('Enter your new password.'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/reset-password', {
        userId,
        otp: otpStr,
        newPassword,
      });
      setStep('done');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fp-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#7FA8AD] via-[#5D8A8F] to-[#3D5087]" />

        <div className="px-7 pt-6 pb-7">

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7FA8AD] to-[#3D5087] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div>
                  <h2 id="fp-modal-title" className="text-base font-bold text-gray-900">Forgot your password?</h2>
                  <p className="text-xs text-gray-500">No worries — we'll email you a reset code.</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-xs font-medium text-gray-700">Email address</label>
                <input
                  type="email"
                  autoFocus
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  className="w-full px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#7FA8AD] focus:border-[#7FA8AD] hover:border-gray-300 transition-all duration-150"
                />
              </div>

              {error && <ErrorBanner message={error} />}

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] hover:from-[#5D8A8F] hover:to-[#4A7A7F] shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? <Spinner /> : 'Send reset code →'}
              </button>

              <button
                onClick={onClose}
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 text-center transition-colors cursor-pointer"
              >
                Back to login
              </button>
            </>
          )}

          {/* ── Step 2: OTP + New Password ── */}
          {step === 'reset' && (
            <>
              <button
                onClick={() => { setStep('email'); setError(''); setOtp(['','','','','','']); }}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-5 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back
              </button>

              <h2 id="fp-modal-title" className="text-base font-bold text-gray-900 mb-1">Check your inbox</h2>
              <p className="text-sm text-gray-500 mb-5">
                We sent a 6-digit code to{' '}
                <span className="font-semibold text-gray-700">{maskEmail(email)}</span>.
                Enter it below along with your new password.
              </p>

              {/* OTP boxes */}
              <div className="mb-5">
                <label className="text-xs font-medium text-gray-700 mb-2 block">Reset code</label>
                <div className="flex gap-2.5" onPaste={handleOtpPaste}>
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
                        w-full aspect-square text-center text-xl font-bold text-gray-900 border rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-[#7FA8AD] focus:border-[#7FA8AD]
                        transition-all duration-150 bg-gray-50 hover:bg-white
                        ${digit ? 'border-[#7FA8AD] bg-teal-50/50' : 'border-gray-200'}
                      `}
                    />
                  ))}
                </div>

                <div className="flex justify-end mt-2">
                  {resendTimer > 0 ? (
                    <span className="text-xs text-gray-400">Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={resending}
                      className="text-xs text-[#5D8A8F] font-semibold hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {resending ? 'Sending…' : 'Resend code'}
                    </button>
                  )}
                </div>
              </div>

              {/* New password */}
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">New password</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(''); }}
                      className="w-full px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#7FA8AD] focus:border-[#7FA8AD] hover:border-gray-300 transition-all duration-150"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowNewPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                      {showNewPw ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                  {newPassword && (
                    <PasswordStrength password={newPassword} />
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">Confirm new password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      placeholder="Repeat your new password"
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                      className={`w-full px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#7FA8AD] focus:border-[#7FA8AD] hover:border-gray-300 transition-all duration-150 ${confirmPassword && confirmPassword !== newPassword ? 'border-red-300' : 'border-gray-200'}`}
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirmPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                      {showConfirmPw ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-500">Passwords don&apos;t match</p>
                  )}
                </div>
              </div>

              {error && <ErrorBanner message={error} />}

              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] hover:from-[#5D8A8F] hover:to-[#4A7A7F] shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? <Spinner /> : 'Reset password →'}
              </button>
            </>
          )}

          {/* ── Step 3: Done ── */}
          {step === 'done' && (
            <div className="py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Password updated!</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto leading-relaxed">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <button
                onClick={() => onSuccess(email)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] hover:from-[#5D8A8F] hover:to-[#4A7A7F] shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
              >
                Back to login →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-start gap-2.5">
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {message}
    </div>
  );
}

function Spinner() {
  return (
    <>
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      Please wait…
    </>
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

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-400', 'bg-amber-400', 'bg-teal-400', 'bg-emerald-500'];
  const textColors = ['text-red-500', 'text-amber-500', 'text-teal-600', 'text-emerald-600'];

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[score - 1] || 'text-gray-400'}`}>
        {score === 0 ? 'Enter a password' : labels[score - 1]}
      </p>
    </div>
  );
}
