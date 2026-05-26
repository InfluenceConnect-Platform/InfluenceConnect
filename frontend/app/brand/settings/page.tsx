'use client';

import { useState, useEffect } from 'react';
import BrandNav from '@/components/shared/BrandNav';
import AccountInfoSection from '@/components/shared/AccountInfoSection';
import LegalSection from '@/components/shared/LegalSection';
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
  { q: 'How do I create a campaign?', a: 'Go to Campaigns → New Campaign. Fill in the details, set your budget and deliverables, then publish.' },
  { q: 'How do influencers apply to my campaigns?', a: 'Once published, influencers on the platform can discover and apply. You\'ll see applications in the campaign detail view.' },
  { q: 'How does the Premium plan work?', a: 'Premium unlocks unlimited campaigns, priority discovery placement, and advanced analytics. You can upgrade anytime from the Billing section.' },
  { q: 'Can I message an influencer before accepting their application?', a: 'Yes — open the application and use the Messages tab to start a conversation.' },
  { q: 'How do I cancel my subscription?', a: 'Go to Billing and click Downgrade to Freemium. Your premium features remain active until the billing period ends.' },
];

export default function BrandSettings() {
  const { isDark } = useTheme();
  const [activeSection, setActiveSection] = useState<Section>('account');

  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Password form state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Danger zone state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [schedulingDelete, setSchedulingDelete] = useState(false);
  const [cancellingDelete, setCancellingDelete] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // FAQ open state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    api.get('/api/auth/account').then(r => setAccount(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

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
      ? 'bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-[#3D5087] focus:ring-[#3D5087]/20'
      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#3D5087] focus:ring-[#3D5087]/10'
  }`;

  const labelCls = `block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`;

  const cardCls = `rounded-2xl border p-6 ${isDark ? 'bg-[#0f1e31] border-slate-700/60' : 'bg-white border-gray-200'}`;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#080f1a]' : 'bg-gray-50'}`}>
      <BrandNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            Account Settings
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Manage your account, security, and preferences.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar nav */}
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
                        : isDark ? 'bg-[#3D5087]/20 text-[#7B9DD4]' : 'bg-[#3D5087]/8 text-[#3D5087]'
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

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-5">
            {loading ? (
              <div className={`${cardCls} flex items-center justify-center h-48`}>
                <svg className="w-6 h-6 animate-spin text-[#3D5087]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              </div>
            ) : (
              <>
                {/* ── Account Info ── */}
                {activeSection === 'account' && account && (
                  <div className={cardCls}>
                    <h2 className={`text-base font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Account Information</h2>
                    <p className={`text-xs mb-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Each field has its own Update button. Email and phone changes require OTP verification.</p>
                    <AccountInfoSection
                      account={account}
                      accentColor="#3D5087"
                      onUpdate={updates => setAccount(prev => prev ? { ...prev, ...updates } : prev)}
                    />
                  </div>
                )}

                {/* ── Security ── */}
                {activeSection === 'security' && (
                  <div className={cardCls}>
                    <h2 className={`text-base font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Change Password</h2>
                    <p className={`text-xs mb-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      {account?.signupMethod === 'google' ? 'Your account uses Google sign-in and does not have a separate password.' : 'Use a strong password you don\'t use elsewhere.'}
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
                          <button type="submit" disabled={savingPw}
                            className="flex items-center gap-2 bg-[#3D5087] hover:bg-[#2e3e6e] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-60 cursor-pointer">
                            {savingPw ? <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Updating…</> : 'Update password'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* ── Help & Support ── */}
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
                        className="inline-flex items-center gap-2 bg-[#3D5087] hover:bg-[#2e3e6e] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        Email Support
                      </a>
                    </div>
                  </div>
                )}

                {/* ── Legal ── */}
                {activeSection === 'legal' && (
                  <div className={cardCls}>
                    <h2 className={`text-base font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Legal</h2>
                    <p className={`text-xs mb-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Review our policies and agreements.</p>
                    <LegalSection />
                  </div>
                )}

                {/* ── Danger Zone ── */}
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
                          This schedules your account for permanent deletion in 30 days. All your campaigns, messages, and data will be erased. You can cancel within the 30-day window.
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
