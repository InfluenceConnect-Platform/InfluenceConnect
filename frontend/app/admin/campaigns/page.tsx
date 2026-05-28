'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AdminNav from '@/components/shared/AdminNav';

const STATUS_STYLES: Record<string, string> = {
  active:        'bg-green-50 text-green-700 border border-green-100',
  draft:         'bg-gray-100 text-gray-500 border border-gray-200',
  'in-progress': 'bg-amber-50 text-amber-700 border border-amber-100',
  completed:     'bg-blue-50 text-blue-700 border border-blue-100',
  closed:        'bg-red-50 text-red-600 border border-red-100',
};

const STATUS_LABELS: Record<string, string> = {
  active:        'Active',
  draft:         'Draft',
  'in-progress': 'In Progress',
  completed:     'Completed',
  closed:        'Closed',
};

const STATUS_FILTERS = [
  { value: '',           label: 'All' },
  { value: 'active',     label: 'Active' },
  { value: 'draft',      label: 'Draft' },
  { value: 'closed',     label: 'Closed' },
  { value: 'completed',  label: 'Completed' },
];

export default function AdminCampaigns() {
  const router = useRouter();
  const [campaigns, setCampaigns]       = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal]               = useState(0);

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

  const fetchCampaigns = async () => {
    setLoading(true);
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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleRemove = async (campaignId: string) => {
    try {
      await api.put(`/api/admin/campaigns/${campaignId}/remove`);
      showToast('Campaign removed successfully.');
      fetchCampaigns();
    } catch {
      showToast('Failed to remove campaign.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {toast && (
        <div className="fixed bottom-5 right-4 sm:right-6 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50 max-w-[calc(100vw-32px)] sm:max-w-sm flex items-center gap-2.5">
          <svg className="w-4 h-4 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast}
        </div>
      )}

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
                    <tr key={i} className="hover:bg-gray-50/60 transition-colors">
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
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLES[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[c.status] ?? c.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {c.status !== 'closed' && c.status !== 'completed' && (
                          <button
                            onClick={() => handleRemove(c._id)}
                            className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100 transition-all cursor-pointer font-semibold"
                          >
                            Remove
                          </button>
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
                  <div key={i} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                        <p className="text-xs text-gray-400 capitalize truncate mt-0.5">
                          {c.niche?.join(', ') || 'No niche'}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
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
                      <button
                        onClick={() => handleRemove(c._id)}
                        className="text-xs px-3.5 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100 transition-all cursor-pointer font-semibold"
                      >
                        Remove campaign
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
