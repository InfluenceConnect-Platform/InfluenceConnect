'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useLiveData } from '@/lib/useLiveData';
import AdminNav from '@/components/shared/AdminNav';
import { useToast } from '@/components/shared/Toast';
import { useConfirm } from '@/components/shared/ConfirmModal';
import IdChip from '@/components/shared/IdChip';
import UserDetailDrawer from '@/components/shared/UserDetailDrawer';

type Verification = {
  brandProfileId: string;
  userId: string | null;
  name: string;
  email: string;
  customId: string;
  accountStatus: string;
  companyName: string;
  gstin: string;
  gstinStatus: 'pending' | 'verified' | 'rejected' | 'not_submitted';
  submittedAt: string | null;
  updatedAt: string | null;
};

type Counts = { pending: number; verified: number; rejected: number; total: number };

const STATUS_STYLES: Record<string, string> = {
  verified: 'bg-green-50 text-green-700 border border-green-100',
  pending:  'bg-amber-50 text-amber-700 border border-amber-100',
  rejected: 'bg-red-50 text-red-700 border border-red-100',
};

const STATUS_LABELS: Record<string, string> = {
  verified: 'Verified',
  pending:  'Pending',
  rejected: 'Rejected',
};

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function AdminGst() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [counts, setCounts] = useState<Counts>({ pending: 0, verified: 0, rejected: 0, total: 0 });
  const [rows, setRows] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'' | 'pending' | 'verified' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/admin/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin') { router.push('/admin/login'); return; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchData = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter) params.status = filter;
      const res = await api.get('/api/admin/gstin', { params });
      setCounts(res.data.counts);
      setRows(res.data.verifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useLiveData(() => { fetchData({ silent: true }); });

  const showToast = (msg: string) =>
    toast.show(msg, /fail|error|cannot|unable|wrong/.test(msg.toLowerCase()) ? 'error' : 'success');

  const handleDecision = async (v: Verification, status: 'verified' | 'rejected') => {
    if (status === 'rejected') {
      const ok = await confirm({
        title: 'Reject this GSTIN?',
        description: `${v.companyName || v.name}'s GSTIN will be marked invalid and their account will be suspended immediately. They'll be notified by email.`,
        confirmLabel: 'Reject & suspend',
        variant: 'danger',
      });
      if (!ok) return;
    } else {
      const ok = await confirm({
        title: 'Approve this GSTIN?',
        description: `Confirm that ${v.companyName || v.name}'s GSTIN (${v.gstin}) is valid. Their brand will be marked verified.`,
        confirmLabel: 'Approve',
        variant: 'info',
      });
      if (!ok) return;
    }
    setActingId(v.brandProfileId);
    try {
      await api.put(`/api/admin/gstin/${v.brandProfileId}/status`, { status });
      showToast(`GSTIN ${status === 'verified' ? 'approved' : 'rejected'} successfully.`);
      fetchData({ silent: true });
    } catch {
      showToast('Failed to update GSTIN status.');
    } finally {
      setActingId(null);
    }
  };

  const handleReopen = async (v: Verification) => {
    const ok = await confirm({
      title: 'Restore for resubmission?',
      description: `${v.companyName || v.name}'s account will be reactivated and they'll be emailed to submit a corrected GSTIN. Use this when a brand says they entered the wrong number.`,
      confirmLabel: 'Restore & request GSTIN',
      variant: 'info',
    });
    if (!ok) return;
    setActingId(v.brandProfileId);
    try {
      await api.put(`/api/admin/gstin/${v.brandProfileId}/reopen`);
      showToast('Account restored — brand asked to resubmit their GSTIN.');
      fetchData({ silent: true });
    } catch {
      showToast('Failed to restore the account.');
    } finally {
      setActingId(null);
    }
  };

  const STAT_CARDS = [
    { key: 'pending',  label: 'Awaiting review', value: counts.pending,  tone: 'amber'  as const, hint: 'Need your action' },
    { key: 'verified', label: 'Verified',        value: counts.verified, tone: 'green'  as const, hint: 'Approved brands' },
    { key: 'rejected', label: 'Rejected',        value: counts.rejected, tone: 'red'    as const, hint: 'Accounts suspended' },
    { key: 'total',    label: 'Total submitted',  value: counts.total,    tone: 'slate'  as const, hint: 'All-time' },
  ];

  const toneStyles: Record<string, { card: string; value: string; dot: string }> = {
    amber: { card: 'bg-amber-50/60 border-amber-200', value: 'text-amber-700', dot: 'bg-amber-500' },
    green: { card: 'bg-white border-gray-200/70',     value: 'text-green-700', dot: 'bg-green-500' },
    red:   { card: 'bg-white border-gray-200/70',     value: 'text-red-600',   dot: 'bg-red-500' },
    slate: { card: 'bg-white border-gray-200/70',     value: 'text-gray-900',  dot: 'bg-gray-400' },
  };

  // Search by brand/company name or Brand ID — filters the loaded rows client-side.
  const q = search.trim().toLowerCase();
  const visibleRows = q
    ? rows.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.companyName.toLowerCase().includes(q) ||
        v.customId.toLowerCase().includes(q)
      )
    : rows;

  const TABS = [
    { value: 'pending'  as const, label: 'Pending',  count: counts.pending },
    { value: 'verified' as const, label: 'Verified', count: counts.verified },
    { value: 'rejected' as const, label: 'Rejected', count: counts.rejected },
    { value: ''         as const, label: 'All',      count: counts.total },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F8FA] via-[#F4F6F9] to-[#EDF0F5]">
      <AdminNav />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-9">

        <div className="mb-6">
          <p className="text-[11px] font-semibold text-[#7FA8AD] uppercase tracking-[0.18em] mb-1.5">Compliance</p>
          <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">GST Verification</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manually review brand GSTINs. Approving marks the brand verified; rejecting suspends the account. Brands are emailed at every step.
          </p>
        </div>

        {/* Stat cards — click to filter the list below */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {STAT_CARDS.map(c => {
            const t = toneStyles[c.tone];
            const cardFilter = c.key === 'total' ? '' : (c.key as 'pending' | 'verified' | 'rejected');
            const isActive = filter === cardFilter;
            return (
              <button
                key={c.key}
                onClick={() => setFilter(cardFilter)}
                className={`text-left rounded-2xl border p-4 sm:p-5 shadow-[0_1px_3px_rgba(16,24,40,0.04)] transition-all cursor-pointer hover:shadow-md ${t.card} ${
                  isActive ? 'ring-2 ring-[#3E4751] ring-offset-1' : 'hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{c.label}</p>
                </div>
                <p className={`text-3xl font-bold tabular-nums ${t.value}`}>{c.value}</p>
                <p className="text-[11px] text-gray-400 mt-1">{isActive ? 'Showing below' : c.hint}</p>
              </button>
            );
          })}
        </div>

        {/* Pending banner */}
        {counts.pending > 0 && filter !== 'pending' && (
          <button
            onClick={() => setFilter('pending')}
            className="w-full mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-left hover:bg-amber-100/70 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 text-amber-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="text-sm font-semibold text-amber-800">
              {counts.pending} GSTIN{counts.pending > 1 ? 's' : ''} awaiting your review
            </span>
            <span className="ml-auto text-xs font-semibold text-amber-700">Review now →</span>
          </button>
        )}

        {/* Search + filter tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
          <div className="relative flex-1 lg:max-w-sm">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search by brand name or Brand ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E4751]/20 focus:border-[#3E4751] hover:border-gray-300 transition-all placeholder:text-gray-400 bg-white shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-0.5 overflow-x-auto shadow-sm w-fit">
            {TABS.map(t => (
              <button
                key={t.value || 'all'}
                onClick={() => setFilter(t.value)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  filter === t.value ? 'bg-[#3E4751] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t.label}
                <span className={`min-w-[18px] px-1 inline-flex items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
                  filter === t.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200/70 rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.04)] overflow-hidden">

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {['Brand', 'ID', 'GSTIN', 'Status', 'Submitted', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-7 h-7 border-2 border-[#3E4751] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-gray-400 font-medium">Loading verifications…</p>
                    </div>
                  </td></tr>
                ) : visibleRows.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-16 text-center">
                    <p className="text-sm font-medium text-gray-500">Nothing here</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {q ? 'No brands match your search.' : filter === 'pending' ? 'No GSTINs are waiting for review. ' : 'No records for this filter.'}
                    </p>
                  </td></tr>
                ) : (
                  visibleRows.map(v => (
                    <tr
                      key={v.brandProfileId}
                      onClick={() => v.userId && setSelectedUserId(v.userId)}
                      className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="min-w-0 flex items-center gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#3E4751]">{v.companyName || v.name}</p>
                            <p className="text-[11px] text-gray-400 truncate">{v.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {v.customId ? <IdChip id={v.customId} size="xs" tone="subtle" /> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] font-mono font-semibold text-gray-800 tracking-wide">{v.gstin || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[v.gstinStatus] || ''}`}>
                          {STATUS_LABELS[v.gstinStatus] || v.gstinStatus}
                        </span>
                        {v.gstinStatus === 'rejected' && v.accountStatus === 'suspended' && (
                          <span className="ml-1.5 text-[10px] text-red-500 font-medium">· suspended</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[11px] text-gray-400 whitespace-nowrap font-medium">{fmtDate(v.submittedAt)}</td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        {v.gstinStatus === 'pending' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDecision(v, 'verified')}
                              disabled={actingId === v.brandProfileId}
                              className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all cursor-pointer font-semibold disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDecision(v, 'rejected')}
                              disabled={actingId === v.brandProfileId}
                              className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer font-semibold disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : v.gstinStatus === 'rejected' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleReopen(v)}
                              disabled={actingId === v.brandProfileId}
                              className="text-xs px-3 py-1.5 bg-[#3E4751] text-white rounded-lg hover:bg-[#2c333b] transition-all cursor-pointer font-semibold disabled:opacity-50"
                            >
                              Restore to resubmit
                            </button>
                            <button
                              onClick={() => handleDecision(v, 'verified')}
                              disabled={actingId === v.brandProfileId}
                              className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all cursor-pointer font-semibold disabled:opacity-50"
                            >
                              Approve
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <div className="w-7 h-7 border-2 border-[#3E4751] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400 font-medium">Loading verifications…</p>
              </div>
            ) : visibleRows.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-medium text-gray-500">Nothing here</p>
                <p className="text-xs text-gray-400 mt-1">{q ? 'No brands match your search.' : filter === 'pending' ? 'No GSTINs waiting for review.' : 'No records for this filter.'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {visibleRows.map(v => (
                  <div
                    key={v.brandProfileId}
                    onClick={() => v.userId && setSelectedUserId(v.userId)}
                    className="px-4 py-4 cursor-pointer active:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{v.companyName || v.name}</p>
                        <p className="text-xs text-gray-400 truncate">{v.email}</p>
                      </div>
                      <span className={`flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[v.gstinStatus] || ''}`}>
                        {STATUS_LABELS[v.gstinStatus] || v.gstinStatus}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {v.customId && <IdChip id={v.customId} size="xs" tone="subtle" />}
                      <span className="text-[12px] font-mono font-semibold text-gray-700 tracking-wide">{v.gstin || '—'}</span>
                      <span className="text-[11px] text-gray-400 font-medium">{fmtDate(v.submittedAt)}</span>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                    {v.gstinStatus === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecision(v, 'verified')}
                          disabled={actingId === v.brandProfileId}
                          className="flex-1 text-xs px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all cursor-pointer font-semibold disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDecision(v, 'rejected')}
                          disabled={actingId === v.brandProfileId}
                          className="flex-1 text-xs px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer font-semibold disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : v.gstinStatus === 'rejected' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReopen(v)}
                          disabled={actingId === v.brandProfileId}
                          className="flex-1 text-xs px-3 py-2 bg-[#3E4751] text-white rounded-lg hover:bg-[#2c333b] transition-all cursor-pointer font-semibold disabled:opacity-50"
                        >
                          Restore to resubmit
                        </button>
                        <button
                          onClick={() => handleDecision(v, 'verified')}
                          disabled={actingId === v.brandProfileId}
                          className="flex-1 text-xs px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all cursor-pointer font-semibold disabled:opacity-50"
                        >
                          Approve
                        </button>
                      </div>
                    ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <UserDetailDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onChanged={() => fetchData({ silent: true })}
      />
    </div>
  );
}
