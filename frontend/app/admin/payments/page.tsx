'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useLiveData } from '@/lib/useLiveData';
import { AdminShell, AdminHeader, TableSkeleton } from '@/components/shared/AdminUI';
import IdChip from '@/components/shared/IdChip';
import PaymentDetailDrawer, { type PaymentRow } from '@/components/shared/PaymentDetailDrawer';

const DEAL_STATUS_STYLES: Record<string, string> = {
  'in-progress':       'bg-blue-50 text-blue-700 border border-blue-100',
  'content-submitted': 'bg-violet-50 text-violet-700 border border-violet-100',
  'completed':         'bg-green-50 text-green-700 border border-green-100',
  'cancelled':          'bg-gray-50 text-gray-500 border border-gray-200',
};

const PAYOUT_STATUS_STYLES: Record<string, string> = {
  paid:          'bg-green-50 text-green-700 border border-green-100',
  submitted:     'bg-amber-50 text-amber-700 border border-amber-100',
  not_submitted: 'bg-gray-50 text-gray-500 border border-gray-200',
};

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  paid: 'Paid', submitted: 'Awaiting payment', not_submitted: 'Not submitted',
};

const DEAL_STATUS_FILTERS = [
  { value: '',                  label: 'All statuses' },
  { value: 'in-progress',       label: 'In Progress' },
  { value: 'content-submitted', label: 'Content Submitted' },
  { value: 'completed',         label: 'Completed' },
  { value: 'cancelled',         label: 'Cancelled' },
];

const PAYOUT_STATUS_FILTERS = [
  { value: '',              label: 'All payouts' },
  { value: 'not_submitted', label: 'Not submitted' },
  { value: 'submitted',     label: 'Awaiting payment' },
  { value: 'paid',          label: 'Paid' },
];

const inr = (n: number) => '₹' + (Number.isFinite(n) ? n : 0).toLocaleString('en-IN');

export default function AdminPayments() {
  const router = useRouter();
  const [payments, setPayments]         = useState<PaymentRow[]>([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [payoutFilter, setPayoutFilter] = useState('');
  const [search, setSearch]             = useState('');
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [pages, setPages]               = useState(1);
  const [selected, setSelected]         = useState<PaymentRow | null>(null);

  const PAGE_SIZE = 20;

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/admin/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin') { router.push('/admin/login'); return; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchPayments(), 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, payoutFilter, search, page]);

  const fetchPayments = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      if (payoutFilter) params.paidStatus = payoutFilter;
      if (search.trim()) params.search = search.trim();
      const response = await api.get('/api/admin/payments', { params });
      setPayments(response.data.payments);
      setTotal(response.data.pagination.total);
      setPages(response.data.pagination.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useLiveData(() => { fetchPayments({ silent: true }); });

  return (
    <AdminShell>

      <AdminHeader
        eyebrow="Money across the platform"
        title="Payments"
        count={total}
        subtitle="Every deal's payout status, transaction reference and receipt, in one consolidated view."
      />

      {/* Search + filters */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5 anim-fade-up anim-delay-1">
        <div className="relative flex-1 lg:max-w-sm">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search by deal ID, campaign, brand or influencer…"
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
          {DEAL_STATUS_FILTERS.map(f => (
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
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-0.5 overflow-x-auto w-fit max-w-full shadow-sm">
          {PAYOUT_STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setPayoutFilter(f.value); setPage(1); }}
              className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                payoutFilter === f.value
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
                {['Deal', 'Campaign', 'Brand', 'Influencer', 'Amount', 'Deal status', 'Payout'].map(h => (
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
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#7FA8AD]/10 border border-[#7FA8AD]/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#5D8A8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-500">No payments found</p>
                    <p className="text-xs text-gray-400 mt-1">Try a different search or filter</p>
                  </td>
                </tr>
              ) : (
                payments.map((p, i) => (
                  <tr key={i} onClick={() => setSelected(p)} className="hover:bg-gray-50/60 transition-colors cursor-pointer">
                    <td className="px-5 py-4">
                      {p.customId ? <IdChip id={p.customId} size="xs" tone="subtle" /> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4 max-w-[200px]">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.campaignTitle}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700 font-medium whitespace-nowrap">{p.brandName}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700 font-medium whitespace-nowrap">{p.influencerName}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-800 whitespace-nowrap">
                      {inr(p.agreedAmount)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${DEAL_STATUS_STYLES[p.dealStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                        {p.dealStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${PAYOUT_STATUS_STYLES[p.payoutStatus]}`}>
                        {PAYOUT_STATUS_LABELS[p.payoutStatus]}
                      </span>
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
          ) : payments.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-gray-500">No payments found</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search or filter</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {payments.map((p, i) => (
                <div key={i} onClick={() => setSelected(p)} className="px-4 py-4 cursor-pointer active:bg-gray-50">
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.campaignTitle}</p>
                      {p.customId && <div className="mt-1.5"><IdChip id={p.customId} size="xs" tone="subtle" /></div>}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${DEAL_STATUS_STYLES[p.dealStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                        {p.dealStatus}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PAYOUT_STATUS_STYLES[p.payoutStatus]}`}>
                        {PAYOUT_STATUS_LABELS[p.payoutStatus]}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>Brand: <span className="font-semibold text-gray-700">{p.brandName}</span></span>
                    <span>Influencer: <span className="font-semibold text-gray-700">{p.influencerName}</span></span>
                    <span>Amount: <span className="font-semibold text-gray-700">{inr(p.agreedAmount)}</span></span>
                  </div>
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

      <PaymentDetailDrawer payment={selected} onClose={() => setSelected(null)} />
    </AdminShell>
  );
}
