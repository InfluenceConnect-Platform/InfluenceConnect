'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useTheme } from '@/lib/useTheme';

interface AccountInfo {
  name: string;
  email: string;
  mobile: string;
  signupMethod: string;
  createdAt: string;
  plan: string;
}

interface Props {
  account: AccountInfo;
  accentColor: string; // e.g. '#3D5087' for brand, '#5D8A8F' for influencer
  onUpdate: (updates: Partial<AccountInfo>) => void;
  showPlan?: boolean;  // false for accounts without a plan (e.g. admin)
}

type FieldState = 'idle' | 'sending' | 'otp' | 'verifying' | 'done';

function Spinner() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );
}

interface FieldMsg {
  type: 'success' | 'error';
  text: string;
}

export default function AccountInfoSection({ account, accentColor, onUpdate, showPlan = true }: Props) {
  const { isDark } = useTheme();

  const [name, setName] = useState(account.name);
  const [nameState, setNameState] = useState<'idle' | 'saving' | 'done'>('idle');
  const [nameMsg, setNameMsg] = useState<FieldMsg | null>(null);

  const [email, setEmail] = useState(account.email);
  const [emailState, setEmailState] = useState<FieldState>('idle');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailMsg, setEmailMsg] = useState<FieldMsg | null>(null);

  const [mobile, setMobile] = useState(account.mobile);
  const [mobileState, setMobileState] = useState<FieldState>('idle');
  const [mobileOtp, setMobileOtp] = useState('');
  const [mobileMsg, setMobileMsg] = useState<FieldMsg | null>(null);

  const [emailExpiryTimer, setEmailExpiryTimer] = useState(-1);
  const [mobileExpiryTimer, setMobileExpiryTimer] = useState(-1);

  useEffect(() => {
    if (emailExpiryTimer <= 0 || (emailState !== 'otp' && emailState !== 'verifying')) return;
    const interval = setInterval(() => setEmailExpiryTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [emailExpiryTimer, emailState]);

  useEffect(() => {
    if (mobileExpiryTimer <= 0 || (mobileState !== 'otp' && mobileState !== 'verifying')) return;
    const interval = setInterval(() => setMobileExpiryTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [mobileExpiryTimer, mobileState]);

  const formatExpiry = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;

  const inputCls = `flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
    isDark
      ? 'bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500'
      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
  }`;

  const otpInputCls = `w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 tracking-widest font-mono ${
    isDark
      ? 'bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500'
      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
  }`;

  const labelCls = `block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`;

  const updateBtnCls = `flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl border transition-all cursor-pointer disabled:opacity-50`;

  function msgBanner(msg: FieldMsg) {
    return (
      <p className={`text-xs mt-2 px-3 py-2 rounded-lg ${
        msg.type === 'success'
          ? isDark ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : isDark ? 'bg-red-900/30 text-red-400 border border-red-800/50' : 'bg-red-50 text-red-600 border border-red-200'
      }`}>
        {msg.text}
      </p>
    );
  }

  // ── Name ──
  async function handleUpdateName() {
    if (!name.trim() || name.trim() === account.name) return;
    setNameState('saving');
    setNameMsg(null);
    try {
      await api.put('/api/auth/account', { name: name.trim() });
      onUpdate({ name: name.trim() });
      setNameMsg({ type: 'success', text: 'Name updated successfully.' });
      setNameState('done');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to update name.';
      setNameMsg({ type: 'error', text: msg });
      setNameState('idle');
    }
  }

  // ── Email ──
  async function handleRequestEmailOtp() {
    if (!email.trim() || email.trim() === account.email) return;
    setEmailState('sending');
    setEmailMsg(null);
    try {
      const res = await api.post('/api/auth/account/email/request', { email });
      setEmailMsg({ type: 'success', text: res.data.message });
      setEmailState('otp');
      setEmailOtp('');
      setEmailExpiryTimer(600);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to send verification code.';
      setEmailMsg({ type: 'error', text: msg });
      setEmailState('idle');
    }
  }

  async function handleVerifyEmail() {
    if (emailOtp.length < 6) return;
    setEmailState('verifying');
    setEmailMsg(null);
    try {
      const res = await api.post('/api/auth/account/email/verify', { otp: emailOtp });
      onUpdate({ email: res.data.email });
      setEmailMsg({ type: 'success', text: res.data.message });
      setEmailState('done');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Verification failed.';
      setEmailMsg({ type: 'error', text: msg });
      setEmailState('otp');
    }
  }

  // ── Mobile ──
  async function handleRequestMobileOtp() {
    if (!mobile.trim() || mobile.trim() === account.mobile) return;
    setMobileState('sending');
    setMobileMsg(null);
    try {
      const res = await api.post('/api/auth/account/mobile/request', { mobile });
      setMobileMsg({ type: 'success', text: res.data.message });
      setMobileState('otp');
      setMobileOtp('');
      setMobileExpiryTimer(600);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to send verification code.';
      setMobileMsg({ type: 'error', text: msg });
      setMobileState('idle');
    }
  }

  async function handleVerifyMobile() {
    if (mobileOtp.length < 6) return;
    setMobileState('verifying');
    setMobileMsg(null);
    try {
      const res = await api.post('/api/auth/account/mobile/verify', { otp: mobileOtp });
      onUpdate({ mobile: res.data.mobile });
      setMobileMsg({ type: 'success', text: res.data.message });
      setMobileState('done');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Verification failed.';
      setMobileMsg({ type: 'error', text: msg });
      setMobileState('otp');
    }
  }

  const isDirtyEmail = email.trim() !== account.email;
  const isDirtyMobile = mobile.trim() !== account.mobile;
  const isDirtyName = name.trim() !== account.name;

  return (
    <div className="space-y-6">
      {/* Full Name */}
      <div>
        <label className={labelCls}>Full Name</label>
        <div className="flex gap-2 items-stretch">
          <input
            className={inputCls}
            value={name}
            onChange={e => { setName(e.target.value); setNameState('idle'); setNameMsg(null); }}
            placeholder="Your name"
          />
          <button
            onClick={handleUpdateName}
            disabled={!isDirtyName || nameState === 'saving'}
            style={isDirtyName && nameState !== 'saving' ? { background: accentColor, borderColor: accentColor, color: '#fff' } : {}}
            className={`${updateBtnCls} ${
              isDirtyName && nameState !== 'saving'
                ? 'text-white'
                : isDark
                  ? 'border-slate-700 text-slate-500 bg-slate-800/40 cursor-not-allowed'
                  : 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
            }`}
          >
            {nameState === 'saving' ? <Spinner /> : null}
            Update
          </button>
        </div>
        {nameMsg && msgBanner(nameMsg)}
      </div>

      {/* Email */}
      <div>
        <label className={labelCls}>Email Address</label>

        {emailState === 'otp' || emailState === 'verifying' ? (
          <div className="space-y-2">
            <div className={`text-xs px-3 py-2 rounded-lg ${isDark ? 'bg-slate-800/60 text-slate-400 border border-slate-700' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
              A 6-digit code was sent to <strong>{email}</strong>. Enter it below.
            </div>
            <div className="flex gap-2">
              <input
                className={otpInputCls}
                value={emailOtp}
                onChange={e => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="— — — — — —"
                maxLength={6}
                autoFocus
              />
              <button
                onClick={handleVerifyEmail}
                disabled={emailOtp.length < 6 || emailState === 'verifying'}
                style={emailOtp.length === 6 ? { background: accentColor, borderColor: accentColor, color: '#fff' } : {}}
                className={`${updateBtnCls} px-4 ${
                  emailOtp.length === 6
                    ? 'text-white'
                    : isDark ? 'border-slate-700 text-slate-500 bg-slate-800/40 cursor-not-allowed' : 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                }`}
              >
                {emailState === 'verifying' ? <Spinner /> : null}
                Verify
              </button>
            </div>
            {emailExpiryTimer >= 0 && (
              <p className={`text-xs transition-colors ${
                emailExpiryTimer === 0 ? 'text-red-400' :
                emailExpiryTimer < 60 ? 'text-amber-400' :
                isDark ? 'text-slate-500' : 'text-gray-400'
              }`}>
                {emailExpiryTimer === 0
                  ? 'Code expired — go back and request a new one'
                  : `Expires in ${formatExpiry(emailExpiryTimer)}`}
              </p>
            )}
            <button
              onClick={() => { setEmailState('idle'); setEmailMsg(null); setEmailExpiryTimer(-1); }}
              className={`text-xs ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
            >
              ← Change email
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-stretch">
            <input
              className={inputCls}
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailState('idle'); setEmailMsg(null); }}
              placeholder="you@example.com"
            />
            <button
              onClick={handleRequestEmailOtp}
              disabled={!isDirtyEmail || emailState === 'sending' || emailState === 'done'}
              style={isDirtyEmail && emailState === 'idle' ? { background: accentColor, borderColor: accentColor, color: '#fff' } : {}}
              className={`${updateBtnCls} ${
                isDirtyEmail && emailState === 'idle'
                  ? 'text-white'
                  : isDark ? 'border-slate-700 text-slate-500 bg-slate-800/40 cursor-not-allowed' : 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
              }`}
            >
              {emailState === 'sending' ? <Spinner /> : null}
              {emailState === 'done' ? '✓ Updated' : 'Update'}
            </button>
          </div>
        )}
        {emailMsg && msgBanner(emailMsg)}
      </div>

      {/* Mobile */}
      <div>
        <label className={labelCls}>Phone Number</label>

        {mobileState === 'otp' || mobileState === 'verifying' ? (
          <div className="space-y-2">
            <div className={`text-xs px-3 py-2 rounded-lg ${isDark ? 'bg-slate-800/60 text-slate-400 border border-slate-700' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
              A 6-digit code was sent to <strong>{mobile}</strong>. Enter it below.
            </div>
            <div className="flex gap-2">
              <input
                className={otpInputCls}
                value={mobileOtp}
                onChange={e => setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="— — — — — —"
                maxLength={6}
                autoFocus
              />
              <button
                onClick={handleVerifyMobile}
                disabled={mobileOtp.length < 6 || mobileState === 'verifying'}
                style={mobileOtp.length === 6 ? { background: accentColor, borderColor: accentColor, color: '#fff' } : {}}
                className={`${updateBtnCls} px-4 ${
                  mobileOtp.length === 6
                    ? 'text-white'
                    : isDark ? 'border-slate-700 text-slate-500 bg-slate-800/40 cursor-not-allowed' : 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                }`}
              >
                {mobileState === 'verifying' ? <Spinner /> : null}
                Verify
              </button>
            </div>
            {mobileExpiryTimer >= 0 && (
              <p className={`text-xs transition-colors ${
                mobileExpiryTimer === 0 ? 'text-red-400' :
                mobileExpiryTimer < 60 ? 'text-amber-400' :
                isDark ? 'text-slate-500' : 'text-gray-400'
              }`}>
                {mobileExpiryTimer === 0
                  ? 'Code expired — go back and request a new one'
                  : `Expires in ${formatExpiry(mobileExpiryTimer)}`}
              </p>
            )}
            <button
              onClick={() => { setMobileState('idle'); setMobileMsg(null); setMobileExpiryTimer(-1); }}
              className={`text-xs ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
            >
              ← Change number
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-stretch">
            <input
              className={inputCls}
              value={mobile}
              onChange={e => { setMobile(e.target.value); setMobileState('idle'); setMobileMsg(null); }}
              placeholder="+91 XXXXX XXXXX"
            />
            <button
              onClick={handleRequestMobileOtp}
              disabled={!isDirtyMobile || mobileState === 'sending' || mobileState === 'done'}
              style={isDirtyMobile && mobileState === 'idle' ? { background: accentColor, borderColor: accentColor, color: '#fff' } : {}}
              className={`${updateBtnCls} ${
                isDirtyMobile && mobileState === 'idle'
                  ? 'text-white'
                  : isDark ? 'border-slate-700 text-slate-500 bg-slate-800/40 cursor-not-allowed' : 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
              }`}
            >
              {mobileState === 'sending' ? <Spinner /> : null}
              {mobileState === 'done' ? '✓ Updated' : 'Update'}
            </button>
          </div>
        )}
        {mobileMsg && msgBanner(mobileMsg)}
      </div>

      <p className={`text-xs pt-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
        Member since {new Date(account.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        {showPlan && <> · {account.plan === 'premium' ? '★ Premium' : 'Freemium'} plan</>}
      </p>
    </div>
  );
}
