'use client';

import { useState, useEffect } from 'react';
import InfluencerNav from '@/components/shared/InfluencerNav';
import { useTheme } from '@/lib/useTheme';
import api from '@/lib/api';

interface AccountInfo {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  plan: string;
  signupMethod: string;
  createdAt: string;
  deleteScheduledAt: string | null;
}

type Section = 'account' | 'security' | 'support' | 'legal' | 'danger';

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  {
    id: 'account',
    label: 'Account Info',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    id: 'security',
    label: 'Security',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  },
  {
    id: 'support',
    label: 'Help & Support',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  },
  {
    id: 'legal',
    label: 'Legal',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  },
  {
    id: 'danger',
    label: 'Danger Zone',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  },
];

const FAQ_ITEMS = [
  { q: 'How do I apply to a campaign?', a: 'Go to the Campaigns section and browse active campaigns. Click on one and hit Apply to submit your application.' },
  { q: 'How does the deal negotiation work?', a: 'After applying, brands can send you a deal offer. You can accept, reject, or counter-offer directly in the Messages section.' },
  { q: 'When and how do I get paid?', a: 'Payment terms are agreed upon in the deal. Once deliverables are marked complete and approved by the brand, payment is released per your agreement.' },
  { q: 'Can I work with multiple brands at once?', a: 'Yes — there is no limit on the number of active campaigns you can participate in simultaneously.' },
  { q: 'How do I grow my visibility on the platform?', a: 'Complete your profile fully, connect your social accounts, and maintain a high response rate. Premium brands filter by engagement metrics so keeping your stats updated helps.' },
];

export default function InfluencerSettings() {
  const { isDark } = useTheme();
  const [activeSection, setActiveSection] = useState<Section>('account');

  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoMsg, setInfoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [schedulingDelete, setSchedulingDelete] = useState(false);
  const [cancellingDelete, setCancellingDelete] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    api.get('/api/auth/account').then(r => {
      setAccount(r.data);
      setName(r.data.name);
      setEmail(r.data.email);
      setMobile(r.data.mobile);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSavingInfo(true);
    setInfoMsg(null);
    try {
      const res = await api.put('/api/auth/account', { name, email, mobile });
      setAccount(prev => prev ? { ...prev, ...res.data.user } : prev);
      setInfoMsg({ type: 'success', text: 'Account details updated successfully.' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to update account.';
      setInfoMsg({ type: 'error', text: msg });
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) { setPwMsg({ type: 'error', text: 'New passwords do not match.' }); return; }
    if (newPw.length < 8) { setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' }); return; }
    setSavingPw(true);
    try {
      await api.put('/api/auth/account/password', { currentPassword: currentPw, newPassword: newPw });
      setPwMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to change password.';
      setPwMsg({ type: 'error', text: msg });
    } finally {
      setSavingPw(false);
    }
  }

  async function handleScheduleDelete() {
    if (deleteConfirmText !== 'DELETE') return;
    setSchedulingDelete(true);
    setDeleteMsg(null);
    try {
      const res = await api.post('/api/auth/account/delete');
      setAccount(prev => prev ? { ...prev, deleteScheduledAt: res.data.deleteScheduledAt } : prev);
      setDeleteMsg({ type: 'success', text: res.data.message });
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to schedule deletion.';
      setDeleteMsg({ type: 'error', text: msg });
    } finally {
      setSchedulingDelete(false);
    }
  }

  async function handleCancelDelete() {
    setCancellingDelete(true);
    setDeleteMsg(null);
    try {
      await api.delete('/api/auth/account/delete');
      setAccount(prev => prev ? { ...prev, deleteScheduledAt: null } : prev);
      setDeleteMsg({ type: 'success', text: 'Account deletion cancelled. Your account is safe.' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to cancel deletion.';
      setDeleteMsg({ type: 'error', text: msg });
    } finally {
      setCancellingDelete(false);
    }
  }

  const inputCls = `w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
    isDark
      ? 'bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-[#5D8A8F] focus:ring-[#5D8A8F]/20'
      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#5D8A8F] focus:ring-[#5D8A8F]/10'
  }`;

  const labelCls = `block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`;

  const cardCls = `rounded-2xl border p-6 ${isDark ? 'bg-[#0f1e31] border-slate-700/60' : 'bg-white border-gray-200'}`;

  const accentBtn = 'flex items-center gap-2 bg-[#5D8A8F] hover:bg-[#4a7378] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-60 cursor-pointer';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#080f1a]' : 'bg-gray-50'}`}>
      <InfluencerNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            Account Settings
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Manage your account, security, and preferences.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-52 flex-shrink-0">
            <nav className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#0f1e31] border-slate-700/60' : 'bg-white border-gray-200'}`}>
              {SECTIONS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all text-left cursor-pointer
                    ${i < SECTIONS.length - 1 ? (isDark ? 'border-b border-slate-800' : 'border-b border-gray-100') : ''}
                    ${activeSection === s.id
                      ? s.id === 'danger'
                        ? 'bg-red-500/10 text-red-500'
                        : isDark ? 'bg-[#5D8A8F]/15 text-[#9DC4C9]' : 'bg-[#5D8A8F]/8 text-[#5D8A8F]'
                      : s.id === 'danger'
                        ? isDark ? 'text-red-400/70 hover:bg-red-900/10 hover:text-red-400' : 'text-red-400 hover:bg-red-50 hover:text-red-500'
                        : isDark ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                >
                  <span className="flex-shrink-0">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-5">
            {loading ? (
              <div className={`${cardCls} flex items-center justify-center h-48`}>
                <svg className="w-6 h-6 animate-spin text-[#5D8A8F]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              </div>
            ) : (
              <>
                {activeSection === 'account' && (
                  <div className={cardCls}>
                    <h2 className={`text-base font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Account Information</h2>
                    <p className={`text-xs mb-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Update your name, email address, and phone number.</p>

                    {account?.signupMethod === 'google' && (
                      <div className={`flex items-center gap-2 text-xs px-3.5 py-2.5 rounded-xl mb-5 ${isDark ? 'bg-slate-800/60 text-slate-400 border border-slate-700' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Signed in with Google — email changes will require re-verification.
                      </div>
                    )}

                    <form onSubmit={handleSaveInfo} className="space-y-4">
                      <div>
                        <label className={labelCls}>Full Name</label>
                        <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
                      </div>
                      <div>
                        <label className={labelCls}>Email Address</label>
                        <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                      </div>
                      <div>
                        <label className={labelCls}>Phone Number</label>
                        <input className={inputCls} value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+91 XXXXX XXXXX" required />
                      </div>

                      {infoMsg && (
                        <div className={`text-xs px-3.5 py-2.5 rounded-xl ${infoMsg.type === 'success' ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200') : (isDark ? 'bg-red-900/30 text-red-400 border border-red-800/50' : 'bg-red-50 text-red-600 border border-red-200')}`}>
                          {infoMsg.text}
                        </div>
                      )}

                      <div className="pt-1">
                        <button type="submit" disabled={savingInfo} className={accentBtn}>
                          {savingInfo ? <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving…</> : 'Save changes'}
                        </button>
                      </div>
                    </form>

                    <div className={`mt-6 pt-5 border-t ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        Member since {account ? new Date(account.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'} · {account?.plan === 'premium' ? '★ Premium' : 'Freemium'} plan
                      </p>
                    </div>
                  </div>
                )}

                {activeSection === 'security' && (
                  <div className={cardCls}>
                    <h2 className={`text-base font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Change Password</h2>
                    <p className={`text-xs mb-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      {account?.signupMethod === 'google' ? 'Your account uses Google sign-in and does not have a separate password.' : "Use a strong password you don't use elsewhere."}
                    </p>

                    {account?.signupMethod === 'google' ? (
                      <div className={`flex items-center gap-2 text-xs px-3.5 py-3 rounded-xl ${isDark ? 'bg-slate-800/60 text-slate-400 border border-slate-700' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        Password changes are not available for Google accounts. Manage your password through Google.
                      </div>
                    ) : (
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                          <label className={labelCls}>Current Password</label>
                          <input className={inputCls} type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" required />
                        </div>
                        <div>
                          <label className={labelCls}>New Password</label>
                          <input className={inputCls} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 8 characters" required />
                        </div>
                        <div>
                          <label className={labelCls}>Confirm New Password</label>
                          <input className={inputCls} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" required />
                        </div>

                        {pwMsg && (
                          <div className={`text-xs px-3.5 py-2.5 rounded-xl ${pwMsg.type === 'success' ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200') : (isDark ? 'bg-red-900/30 text-red-400 border border-red-800/50' : 'bg-red-50 text-red-600 border border-red-200')}`}>
                            {pwMsg.text}
                          </div>
                        )}

                        <div className="pt-1">
                          <button type="submit" disabled={savingPw} className={accentBtn}>
                            {savingPw ? <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Updating…</> : 'Update password'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {activeSection === 'support' && (
                  <div className="space-y-5">
                    <div className={cardCls}>
                      <h2 className={`text-base font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Help & Support</h2>
                      <p className={`text-xs mb-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Frequently asked questions and contact options.</p>

                      <div className="space-y-2">
                        {FAQ_ITEMS.map((item, i) => (
                          <div key={i} className={`rounded-xl border overflow-hidden ${isDark ? 'border-slate-700/60' : 'border-gray-200'}`}>
                            <button
                              onClick={() => setOpenFaq(openFaq === i ? null : i)}
                              className={`w-full flex items-center justify-between px-4 py-3.5 text-left text-sm font-semibold transition-colors cursor-pointer ${isDark ? 'hover:bg-slate-800/40 text-slate-200' : 'hover:bg-gray-50 text-gray-800'}`}
                            >
                              {item.q}
                              <svg className={`w-4 h-4 flex-shrink-0 ml-3 transition-transform ${openFaq === i ? 'rotate-180' : ''} ${isDark ? 'text-slate-500' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                            </button>
                            {openFaq === i && (
                              <div className={`px-4 pb-4 text-sm leading-relaxed ${isDark ? 'text-slate-400 border-t border-slate-800' : 'text-gray-600 border-t border-gray-100'}`}>
                                <p className="pt-3">{item.a}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={cardCls}>
                      <h3 className={`text-sm font-bold mb-3 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>Still need help?</h3>
                      <p className={`text-xs mb-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Our team typically responds within 24 hours.</p>
                      <a
                        href="mailto:support@influenceconnect.in"
                        className="inline-flex items-center gap-2 bg-[#5D8A8F] hover:bg-[#4a7378] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        Email Support
                      </a>
                    </div>
                  </div>
                )}

                {activeSection === 'legal' && (
                  <div className={cardCls}>
                    <h2 className={`text-base font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Legal</h2>
                    <p className={`text-xs mb-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Review our policies and agreements.</p>

                    <div className="space-y-3">
                      {[
                        { title: 'Terms & Conditions', desc: 'The rules governing your use of InfluenceConnect.', href: '/legal/terms' },
                        { title: 'Privacy Policy', desc: 'How we collect, use, and protect your data.', href: '/legal/privacy' },
                        { title: 'Cookie Policy', desc: 'How we use cookies and similar technologies.', href: '/legal/cookies' },
                        { title: 'Refund Policy', desc: 'Our policy on subscription refunds and cancellations.', href: '/legal/refund' },
                      ].map(item => (
                        <a
                          key={item.title}
                          href={item.href}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all group ${isDark ? 'border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/40' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                          <div>
                            <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{item.title}</p>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{item.desc}</p>
                          </div>
                          <svg className={`w-4 h-4 flex-shrink-0 ml-3 transition-transform group-hover:translate-x-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'danger' && (
                  <div className={`${cardCls} border-red-500/30`}>
                    <h2 className="text-base font-bold mb-1 text-red-500">Danger Zone</h2>
                    <p className={`text-xs mb-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Irreversible actions. Proceed with caution.</p>

                    {deleteMsg && (
                      <div className={`text-xs px-3.5 py-2.5 rounded-xl mb-4 ${deleteMsg.type === 'success' ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200') : (isDark ? 'bg-red-900/30 text-red-400 border border-red-800/50' : 'bg-red-50 text-red-600 border border-red-200')}`}>
                        {deleteMsg.text}
                      </div>
                    )}

                    {account?.deleteScheduledAt ? (
                      <div className={`rounded-xl border p-5 ${isDark ? 'border-amber-700/40 bg-amber-900/10' : 'border-amber-200 bg-amber-50'}`}>
                        <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Deletion Scheduled</p>
                        <p className={`text-xs mb-4 ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                          Your account is scheduled for permanent deletion on{' '}
                          <strong>{new Date(account.deleteScheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                          You can cancel anytime before that date.
                        </p>
                        <button
                          onClick={handleCancelDelete}
                          disabled={cancellingDelete}
                          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-60 cursor-pointer"
                        >
                          {cancellingDelete ? <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Cancelling…</> : 'Cancel deletion'}
                        </button>
                      </div>
                    ) : (
                      <div className={`rounded-xl border p-5 ${isDark ? 'border-red-900/40 bg-red-900/10' : 'border-red-200 bg-red-50'}`}>
                        <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-red-400' : 'text-red-700'}`}>Delete Account</p>
                        <p className={`text-xs mb-4 ${isDark ? 'text-red-400/70' : 'text-red-500'}`}>
                          This schedules your account for permanent deletion in 30 days. All your deals, messages, and data will be erased. You can cancel within the 30-day window.
                        </p>

                        {!showDeleteConfirm ? (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            Delete my account
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                              Type <strong>DELETE</strong> to confirm
                            </p>
                            <input
                              className={`${inputCls} border-red-400 focus:border-red-500 focus:ring-red-500/20`}
                              value={deleteConfirmText}
                              onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
                              placeholder="Type DELETE here"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleScheduleDelete}
                                disabled={deleteConfirmText !== 'DELETE' || schedulingDelete}
                                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
                              >
                                {schedulingDelete ? <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Scheduling…</> : 'Confirm deletion'}
                              </button>
                              <button
                                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                                className={`text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
