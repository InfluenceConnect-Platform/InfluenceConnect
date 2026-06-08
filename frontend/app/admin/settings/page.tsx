'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/shared/AdminNav';
import AccountInfoSection from '@/components/shared/AccountInfoSection';
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

type Section = 'account' | 'security';

const ACCENT = '#3E4751';

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
];

export default function AdminSettings() {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string } | null>(null);
  const [activeSection, setActiveSection] = useState<Section>('account');

  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/admin/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin') { router.push('/admin/login'); return; }
    setUser(parsed);
    api.get('/api/auth/account').then(r => setAccount(r.data)).catch(() => {}).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#3E4751] focus:ring-[#3E4751]/10';
  const labelCls = 'block text-xs font-semibold mb-1.5 text-gray-500';
  const cardCls = 'rounded-2xl border p-6 bg-white border-gray-200';
  const accentBtn = 'flex items-center gap-2 bg-[#3E4751] hover:bg-[#2f363e] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-60 cursor-pointer';

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav user={user} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Admin Settings</h1>
          <p className="text-sm mt-1 text-gray-500">
            Manage the admin account&apos;s email and password. Keep these credentials private.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-52 flex-shrink-0">
            <nav className="rounded-2xl border overflow-hidden bg-white border-gray-200">
              {SECTIONS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all text-left cursor-pointer
                    ${i < SECTIONS.length - 1 ? 'border-b border-gray-100' : ''}
                    ${activeSection === s.id
                      ? 'bg-[#3E4751]/8 text-[#3E4751]'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
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
                <svg className="w-6 h-6 animate-spin text-[#3E4751]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              </div>
            ) : (
              <>
                {activeSection === 'account' && account && (
                  <div className={cardCls}>
                    <h2 className="text-base font-bold mb-1 text-gray-900">Account Information</h2>
                    <p className="text-xs mb-6 text-gray-400">Each field has its own Update button. Changing the email requires OTP verification.</p>
                    <AccountInfoSection
                      account={account}
                      accentColor={ACCENT}
                      showPlan={false}
                      onUpdate={updates => setAccount(prev => prev ? { ...prev, ...updates } : prev)}
                    />
                  </div>
                )}

                {activeSection === 'security' && (
                  <div className={cardCls}>
                    <h2 className="text-base font-bold mb-1 text-gray-900">Change Password</h2>
                    <p className="text-xs mb-6 text-gray-400">Use a strong password you don&apos;t use anywhere else.</p>

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
                        <div className={`text-xs px-3.5 py-2.5 rounded-xl ${pwMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                          {pwMsg.text}
                        </div>
                      )}

                      <div className="pt-1">
                        <button type="submit" disabled={savingPw} className={accentBtn}>
                          {savingPw ? <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Updating…</> : 'Update password'}
                        </button>
                      </div>
                    </form>
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
