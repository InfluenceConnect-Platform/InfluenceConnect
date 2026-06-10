'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useLiveData } from '@/lib/useLiveData';
import AdminNav from '@/components/shared/AdminNav';
import { useToast } from '@/components/shared/Toast';
import { useConfirm } from '@/components/shared/ConfirmModal';
import CampaignDetailDrawer from '@/components/shared/CampaignDetailDrawer';

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
  const [total, setTotal]               = useState(0);
  const [selectedId, setSelectedId]     = useState<string | null>(null);

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/admin/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin') { router.push('/admin/login'); return; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCampaigns();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchCampaigns = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const response = await api.get('/api/admin/campaigns', { params });
      setCampaigns(response.data.campaigns);
      setTotal(response.data.pagination.total);
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
    <div className="min-h-screen bg-[#F7F8FA]">

      <AdminNav />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-9">

        <div className="mb-7">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Platform campaigns</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Campaigns</h1>
            {total > 0 && (
              <span className="text-sm font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                {total}
              </span>
            )}
          </div>
        </div>

        {/* Status filter */}
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-0.5 overflow-x-auto w-fit mb-5 shadow-sm">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
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

        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {['Campaign', 'Brand', 'Budget', 'Applicants', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-2 border-[#3E4751] border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-400 font-medium">Loading campaigns…</p>
                      </div>
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <p className="text-sm font-medium text-gray-500">No campaigns found</p>
                      <p className="text-xs text-gray-400 mt-1">Try a different status filter</p>
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c, i) => (
                    <tr key={i} onClick={() => setSelectedId(c._id)} className="hover:bg-gray-50/60 transition-colors cursor-pointer">
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                        <p className="text-[11px] text-gray-400 capitalize truncate mt-0.5">{c.niche?.join(', ') || '—'}</p>
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
              <div className="flex flex-col items-center gap-3 py-16">
                <div className="w-7 h-7 border-2 border-[#3E4751] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400 font-medium">Loading campaigns…</p>
              </div>
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
                        <p className="text-xs text-gray-400 capitalize truncate mt-0.5">
                          {c.niche?.join(', ') || 'No niche'}
                        </p>
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
        </div>
      </main>

      <CampaignDetailDrawer
        campaignId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={() => fetchCampaigns({ silent: true })}
      />
    </div>
  );
}
