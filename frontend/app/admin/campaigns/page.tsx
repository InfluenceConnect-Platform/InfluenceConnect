'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AdminNav from '@/components/shared/AdminNav';

const STATUS_STYLES: Record<string, string> = {
  active:        'bg-green-100 text-green-700',
  draft:         'bg-gray-100 text-gray-600',
  'in-progress': 'bg-amber-100 text-amber-700',
  completed:     'bg-blue-100 text-blue-700',
  closed:        'bg-red-100 text-red-600',
};

const STATUS_LABELS: Record<string, string> = {
  active:        'Active',
  draft:         'Draft',
  'in-progress': 'In Progress',
  completed:     'Completed',
  closed:        'Closed',
};

const STATUS_FILTERS = [
  { value: '',          label: 'All' },
  { value: 'active',    label: 'Active' },
  { value: 'draft',     label: 'Draft' },
  { value: 'closed',    label: 'Closed' },
  { value: 'completed', label: 'Completed' },
];

export default function AdminCampaigns() {
  const router = useRouter();
  const [campaigns, setCampaigns]     = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal]             = useState(0);

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
    <div className="min-h-screen bg-gray-50">

      {toast && (
        <div className="fixed bottom-5 right-4 sm:right-6 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50 max-w-[calc(100vw-32px)] sm:max-w-sm">
          {toast}
        </div>
      )}

      <AdminNav />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        <div className="mb-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">All platform campaigns</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
            Campaigns{total > 0 && <span className="text-gray-400 font-normal"> · {total}</span>}
          </h1>
        </div>

        {/* Status filter */}
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 overflow-x-auto w-fit mb-5">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                statusFilter === f.value
                  ? 'bg-[#EEF0F3] text-[#1A2028] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Campaign', 'Brand', 'Budget', 'Applicants', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-[#3E4751] border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-400">Loading campaigns…</p>
                      </div>
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center text-sm text-gray-400">
                      No campaigns found.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                        <p className="text-xs text-gray-400 capitalize truncate">{c.niche?.join(', ')}</p>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                        {c.brandId?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {c.budgetMin || c.budgetMax
                          ? `₹${(c.budgetMin || 0).toLocaleString('en-IN')} – ₹${(c.budgetMax || 0).toLocaleString('en-IN')}`
                          : 'Open'}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 tabular-nums">
                        {c.applicantCount ?? 0}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLES[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[c.status] ?? c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {c.status !== 'closed' && c.status !== 'completed' && (
                          <button
                            onClick={() => handleRemove(c._id)}
                            className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all cursor-pointer font-semibold"
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

          {/* Mobile card list */}
          <div className="md:hidden">
            {loading ? (
              <div className="flex flex-col items-center gap-2 py-14">
                <div className="w-6 h-6 border-2 border-[#3E4751] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading campaigns…</p>
              </div>
            ) : campaigns.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-14">No campaigns found.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {campaigns.map((c, i) => (
                  <div key={i} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                        <p className="text-xs text-gray-400 capitalize truncate">
                          {c.niche?.join(', ') || 'No niche'}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 text-[11px] px-2 py-1 rounded-full font-semibold ${STATUS_STYLES[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                      <span>Brand: <span className="font-medium text-gray-700">{c.brandId?.name ?? '—'}</span></span>
                      <span>
                        Budget:{' '}
                        <span className="font-medium text-gray-700">
                          {c.budgetMin || c.budgetMax
                            ? `₹${(c.budgetMin || 0).toLocaleString('en-IN')} – ₹${(c.budgetMax || 0).toLocaleString('en-IN')}`
                            : 'Open'}
                        </span>
                      </span>
                      <span>Applicants: <span className="font-medium text-gray-700">{c.applicantCount ?? 0}</span></span>
                    </div>
                    {c.status !== 'closed' && c.status !== 'completed' && (
                      <button
                        onClick={() => handleRemove(c._id)}
                        className="text-xs px-3.5 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all cursor-pointer font-semibold"
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
