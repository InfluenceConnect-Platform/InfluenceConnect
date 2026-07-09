'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useLiveData } from '@/lib/useLiveData';
import { AdminShell, AdminHeader, TableSkeleton } from '@/components/shared/AdminUI';
import { useToast } from '@/components/shared/Toast';
import { useConfirm } from '@/components/shared/ConfirmModal';
import IdChip from '@/components/shared/IdChip';
import CampaignDetailDrawer from '@/components/shared/CampaignDetailDrawer';
import { NICHE_LABELS } from '@/lib/niches';

const STATUS_STYLES: Record<string, string> = {
  active:        'bg-green-50 text-green-700 border border-green-100',
  draft:         'bg-gray-100 text-gray-500 border border-gray-200',
  'in-progress': 'bg-amber-50 text-amber-700 border border-amber-100',
  completed:     'bg-blue-50 text-blue-700 border border-blue-100',
  closed:        'bg-red-50 text-red-600 border border-red-100',
  expired:       'bg-orange-50 text-orange-600 border border-orange-100',
};

const STATUS_LABELS: Record<string, string> = {
  active:        'Active',
  draft:         'Draft',
  'in-progress': 'In Progress',
  completed:     'Completed',
  closed:        'Closed',
  expired:       'Expired',
};

const STATUS_FILTERS = [
  { value: '',            label: 'All' },
  { value: 'active',      label: 'Active' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'draft',       label: 'Draft' },
  { value: 'completed',   label: 'Completed' },
  { value: 'expired',     label: 'Expired' },
  { value: 'closed',      label: 'Closed' },
];

export default function AdminCampaigns() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [campaigns, setCampaigns]       = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]             = useState('');
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [pages, setPages]               = useState(1);
  const [selectedId, setSelectedId]     = useState<string | null>(null);

  const PAGE_SIZE = 20;

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/admin/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin') { router.push('/admin/login'); return; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch on status change immediately; debounce free-text search so we
  // don't fire a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => fetchCampaigns(), 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search, page]);

  const fetchCampaigns = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const response = await api.get('/api/admin/campaigns', { params });
      setCampaigns(response.data.campaigns);
      setTotal(response.data.pagination.total);
      setPages(response.data.pagination.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useLiveData(() => { fetchCampaigns({ silent: true }); });

  const showToast = (msg: string) => {
    toast.show(msg, /fail|error|cannot|unable|wrong/.test(msg.toLowerCase()) ? 'error' : 'success');
  };

  const handleRemove = async (campaignId: string, title?: string) => {
    const ok = await confirm({
      title: 'Remove this campaign?',
      description: `"${title || 'This campaign'}" will be closed and hidden from creators, and any active collaborations will be cancelled. This cannot be undone.`,
      confirmLabel: 'Remove',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      const res = await api.put(`/api/admin/campaigns/${campaignId}/remove`);
      const cancelled = res.data?.dealsCancelled ?? 0;
      showToast(cancelled > 0
        ? `Campaign removed — ${cancelled} active deal${cancelled > 1 ? 's' : ''} cancelled.`
        : 'Campaign removed successfully.');
      fetchCampaigns();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to remove campaign.');
    }
  };

  const handleFlag = async (campaignId: string, title?: string, currentlyFlagged?: boolean) => {
    const next = !currentlyFlagged;
    if (next) {
      const ok = await confirm({
        title: 'Flag this campaign?',
        description: `"${title || 'This campaign'}" will be marked for review. It stays live for the brand and creators — flagging only highlights it for the admin team.`,
        confirmLabel: 'Flag',
        variant: 'warning',
      });
      if (!ok) return;
    }
    try {
      await api.put(`/api/admin/campaigns/${campaignId}/flag`, { flagged: next });
      showToast(next ? 'Campaign flagged for review.' : 'Campaign flag cleared.');
      fetchCampaigns();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to update campaign flag.');
    }
  };

  return (
    <AdminShell>

        <AdminHeader
          eyebrow="Platform campaigns"
          title="Campaigns"
          count={total}
          subtitle="Monitor every campaign on the platform — flag suspicious ones or remove violations."
        />

        {/* Search + status filter */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5 anim-fade-up anim-delay-1">
          <div className="relative flex-1 lg:max-w-sm">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search by campaign name, ID or brand…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E4751]/20 focus:border-[#3E4751] hover:border-gray-300 transition-all placeholder:text-gray-400 bg-white shadow-sm"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1); }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-0.5 overflow-x-auto w-fit max-w-full shadow-sm">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setPage(1); }}
                className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  statusFilter === f.value
                    ? 'bg-[#3E4751] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200/70 rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.04)] overflow-hidden anim-fade-up anim-delay-2">

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {['Campaign', 'ID', 'Brand', 'Budget', 'Applicants', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <TableSkeleton rows={8} />
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#7FA8AD]/10 border border-[#7FA8AD]/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#5D8A8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-500">No campaigns found</p>
                      <p className="text-xs text-gray-400 mt-1">Try a different search or filter</p>
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c, i) => (
                    <tr key={i} onClick={() => setSelectedId(c._id)} className="hover:bg-gray-50/60 transition-colors cursor-pointer">
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{c.niche?.map((n: string) => NICHE_LABELS[n] ?? n).join(', ') || '—'}</p>
                      </td>
                      <td className="px-5 py-4">
                        {c.customId ? <IdChip id={c.customId} size="xs" tone="subtle" /> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700 font-medium whitespace-nowrap">{c.brandId?.name ?? '—'}</p>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-800 whitespace-nowrap">
                        {c.budgetMin || c.budgetMax
                          ? `₹${(c.budgetMin || 0).toLocaleString('en-IN')} – ₹${(c.budgetMax || 0).toLocaleString('en-IN')}`
                          : <span className="text-gray-400 font-normal">Open</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          </svg>
                          <span className="text-sm font-semibold text-gray-700 tabular-nums">{c.applicantCount ?? 0}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLES[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[c.status] ?? c.status}
                          </span>
                          {c.flagged && (
                            <span className="text-[11px] px-2 py-1 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-100 inline-flex items-center gap-1">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                              </svg>
                              Flagged
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {c.status !== 'closed' && c.status !== 'completed' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleFlag(c._id, c.title, c.flagged); }}
                              className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-semibold ${
                                c.flagged
                                  ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200'
                                  : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'
                              }`}
                            >
                              {c.flagged ? 'Unflag' : 'Flag'}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemove(c._id, c.title); }}
                              className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100 transition-all cursor-pointer font-semibold"
                            >
                              Remove
                            </button>
                          </div>
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
              <TableSkeleton rows={6} />
            ) : campaigns.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-medium text-gray-500">No campaigns found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different status filter</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {campaigns.map((c, i) => (
                  <div key={i} onClick={() => setSelectedId(c._id)} className="px-4 py-4 cursor-pointer active:bg-gray-50">
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {c.niche?.map((n: string) => NICHE_LABELS[n] ?? n).join(', ') || 'No niche'}
                        </p>
                        {c.customId && <div className="mt-1.5"><IdChip id={c.customId} size="xs" tone="subtle" /></div>}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[c.status] ?? c.status}
                        </span>
                        {c.flagged && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                            Flagged
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                      <span>Brand: <span className="font-semibold text-gray-700">{c.brandId?.name ?? '—'}</span></span>
                      <span>
                        Budget:{' '}
                        <span className="font-semibold text-gray-700">
                          {c.budgetMin || c.budgetMax
                            ? `₹${(c.budgetMin || 0).toLocaleString('en-IN')} – ₹${(c.budgetMax || 0).toLocaleString('en-IN')}`
                            : 'Open'}
                        </span>
                      </span>
                      <span>Applicants: <span className="font-semibold text-gray-700">{c.applicantCount ?? 0}</span></span>
                    </div>
                    {c.status !== 'closed' && c.status !== 'completed' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleFlag(c._id, c.title, c.flagged); }}
                          className={`text-xs px-3.5 py-2 rounded-lg border transition-all cursor-pointer font-semibold ${
                            c.flagged
                              ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200'
                              : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'
                          }`}
                        >
                          {c.flagged ? 'Unflag' : 'Flag'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemove(c._id, c.title); }}
                          className="text-xs px-3.5 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100 transition-all cursor-pointer font-semibold"
                        >
                          Remove campaign
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && pages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500">
                Page <span className="font-semibold text-gray-700">{page}</span> of{' '}
                <span className="font-semibold text-gray-700">{pages}</span>
                <span className="text-gray-400 ml-1.5">· {total} total</span>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-gray-600 shadow-sm"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (pages <= 5) { pageNum = i + 1; }
                  else if (page <= 3) { pageNum = i + 1; }
                  else if (page >= pages - 2) { pageNum = pages - 4 + i; }
                  else { pageNum = page - 2 + i; }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      disabled={loading}
                      className={`hidden min-[420px]:inline-flex items-center justify-center w-8 h-8 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        pageNum === page
                          ? 'bg-[#3E4751] text-white shadow-sm'
                          : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages || loading}
                  className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-gray-600 shadow-sm"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      <CampaignDetailDrawer
        campaignId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={() => fetchCampaigns({ silent: true })}
      />
    </AdminShell>
  );
}
