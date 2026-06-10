'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useLiveData } from '@/lib/useLiveData';
import AdminNav from '@/components/shared/AdminNav';
import IdChip from '@/components/shared/IdChip';

// ── Action badge config — colours mirror the admin status-badge system ──
const ACTION_META: Record<string, { label: string; cls: string }> = {
  USER_SUSPENDED:   { label: 'User suspended',   cls: 'bg-red-50 text-red-700 border-red-100' },
  USER_RESTORED:    { label: 'User restored',    cls: 'bg-green-50 text-green-700 border-green-100' },
  USER_VIEWED:      { label: 'User viewed',      cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  GSTIN_APPROVED:   { label: 'GSTIN approved',   cls: 'bg-green-50 text-green-700 border-green-100' },
  GSTIN_REJECTED:   { label: 'GSTIN rejected',   cls: 'bg-red-50 text-red-700 border-red-100' },
  CAMPAIGN_REMOVED: { label: 'Campaign removed', cls: 'bg-orange-50 text-orange-600 border-orange-100' },
  CAMPAIGN_VIEWED:  { label: 'Campaign viewed',  cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  ADMIN_LOGIN:      { label: 'Admin login',      cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  SYSTEM_NOTE:      { label: 'System note',      cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const ACTION_OPTIONS = Object.keys(ACTION_META);
const TARGET_OPTIONS = ['user', 'campaign', 'gstin', 'system'];

const actionMeta = (a: string) => ACTION_META[a] || { label: a, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');

// Audit logs need precision — always full date + time, never relative.
function fmtTimestamp(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${date}, ${h}:${m} ${ampm}`;
}

interface Log {
  _id: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  details: string;
  metadata: Record<string, any>;
  ipAddress: string;
  createdAt: string;
}

export default function AdminLogs() {
  const router = useRouter();

  const [logs, setLogs]       = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [stats, setStats] = useState<any>(null);

  // Filters
  const [action, setAction]       = useState('');
  const [targetType, setTargetType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');

  const hasFilters = !!(action || targetType || startDate || endDate);

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/admin/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin') { router.push('/admin/login'); return; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildParams = useCallback(() => {
    const params: Record<string, string | number> = {};
    if (action)     params.action = action;
    if (targetType) params.targetType = targetType;
    if (startDate)  params.startDate = startDate;
    if (endDate)    params.endDate = endDate;
    return params;
  }, [action, targetType, startDate, endDate]);

  const fetchLogs = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const res = await api.get('/api/admin/logs', { params: { ...buildParams(), page, limit: 20 } });
      setLogs(res.data.logs);
      setTotal(res.data.pagination.total);
      setPages(res.data.pagination.pages);
    } catch (err) {
      console.error('Fetch logs error:', err);
    } finally {
      setLoading(false);
    }
  }, [buildParams, page]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/logs/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Fetch log stats error:', err);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => { setPage(1); }, [action, targetType, startDate, endDate]);

  useLiveData(() => { fetchLogs({ silent: true }); fetchStats(); });

  const clearFilters = () => {
    setAction(''); setTargetType(''); setStartDate(''); setEndDate('');
  };

  // ── CSV export — pulls every matching log across pages, then downloads ──
  const exportCsv = async () => {
    setExporting(true);
    try {
      const all: Log[] = [];
      let p = 1;
      // The API caps limit at 100; loop pages until we've collected everything.
      for (;;) {
        const res = await api.get('/api/admin/logs', { params: { ...buildParams(), page: p, limit: 100 } });
        all.push(...res.data.logs);
        if (p >= (res.data.pagination.pages || 1)) break;
        p += 1;
      }

      const headers = ['Timestamp', 'Admin', 'Action', 'Target Type', 'Target Name', 'Target ID', 'Details', 'IP Address', 'Metadata'];
      const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const rows = all.map(l => [
        fmtTimestamp(l.createdAt),
        l.adminName,
        actionMeta(l.action).label,
        cap(l.targetType),
        l.targetName,
        l.targetId,
        l.details,
        l.ipAddress,
        JSON.stringify(l.metadata || {}),
      ].map(esc).join(','));

      const csv = [headers.map(esc).join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export logs error:', err);
    } finally {
      setExporting(false);
    }
  };

  const STAT_CARDS = [
    { label: 'Actions today',       value: stats?.today ?? 0,  gradient: 'from-blue-500 to-blue-600' },
    { label: 'Actions this week',   value: stats?.week ?? 0,   gradient: 'from-violet-500 to-purple-600' },
    {
      label: 'Top action this week',
      value: stats?.mostCommonAction ? actionMeta(stats.mostCommonAction).label : '—',
      sub: stats?.mostCommonAction ? `${stats.mostCommonCount} time${stats.mostCommonCount !== 1 ? 's' : ''}` : '',
      gradient: 'from-amber-400 to-orange-500',
      small: true,
    },
    {
      label: 'Last action',
      value: stats?.lastActionAt ? fmtTimestamp(stats.lastActionAt) : '—',
      gradient: 'from-emerald-500 to-teal-600',
      small: true,
    },
  ];

  const selectCls = 'text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#3E4751]/20 focus:border-[#3E4751] hover:border-gray-300 transition-all cursor-pointer text-gray-700 font-medium';
  const dateCls = 'text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#3E4751]/20 focus:border-[#3E4751] hover:border-gray-300 transition-all text-gray-700 font-medium';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F8FA] via-[#F4F6F9] to-[#EDF0F5]">
      <AdminNav />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-9">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            <p className="text-[11px] font-semibold text-[#7FA8AD] uppercase tracking-[0.18em] mb-1.5">Audit trail</p>
            <div className="flex items-center gap-3">
              <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">Activity Log</h1>
              {total > 0 && (
                <span className="text-sm font-semibold text-gray-500 bg-gray-100 border border-gray-200/70 px-2.5 py-0.5 rounded-full tabular-nums">
                  {total}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={exportCsv}
            disabled={exporting || total === 0}
            className="flex items-center gap-1.5 text-xs font-semibold text-white px-3.5 py-2.5 rounded-xl bg-[#3E4751] hover:bg-[#2f363d] transition-all cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>

        {/* Stat chips */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STAT_CARDS.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider leading-tight pt-1">{s.label}</p>
                <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.gradient} flex-shrink-0`} />
              </div>
              <p className={`font-bold text-gray-900 leading-tight tracking-tight ${s.small ? 'text-[15px]' : 'text-[28px] tabular-nums'}`}>
                {s.value}
              </p>
              {s.sub && <p className="text-xs text-gray-400 mt-1">{s.sub}</p>}
            </div>
          ))}
        </section>

        {/* Filter bar */}
        <div className="bg-white border border-gray-200/70 rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.04)] p-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Action</label>
              <select value={action} onChange={e => setAction(e.target.value)} className={selectCls}>
                <option value="">All actions</option>
                {ACTION_OPTIONS.map(a => <option key={a} value={a}>{actionMeta(a).label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Target</label>
              <select value={targetType} onChange={e => setTargetType(e.target.value)} className={selectCls}>
                <option value="">All targets</option>
                {TARGET_OPTIONS.map(t => <option key={t} value={t}>{cap(t)}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">From</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={dateCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">To</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={dateCls} />
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-700 transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200/70 rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.04)] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <div className="w-7 h-7 border-2 border-[#3E4751] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Loading activity…</p>
            </div>
          ) : logs.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      {['Timestamp', 'Admin', 'Action', 'Target', 'ID', 'Details', ''].map((h, i) => (
                        <th key={i} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {logs.map(log => {
                      const meta = actionMeta(log.action);
                      const isOpen = expanded === log._id;
                      const hasMeta = log.metadata && Object.keys(log.metadata).length > 0;
                      return (
                        <FragmentRow key={log._id}>
                          <tr
                            onClick={() => setExpanded(isOpen ? null : log._id)}
                            className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                          >
                            <td className="px-5 py-3.5 text-[12px] text-gray-600 font-medium whitespace-nowrap tabular-nums">
                              {fmtTimestamp(log.createdAt)}
                            </td>
                            <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-900 whitespace-nowrap">
                              {log.adminName || '—'}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap ${meta.cls}`}>
                                {meta.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-[12px] text-gray-600 whitespace-nowrap">
                              <span className="text-gray-400">{cap(log.targetType)}</span>
                              {log.targetName ? <span className="text-gray-700 font-medium"> · {log.targetName}</span> : null}
                            </td>
                            <td className="px-5 py-3.5">
                              {log.targetId ? <IdChip id={log.targetId} size="xs" tone="subtle" /> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-5 py-3.5 text-[12px] text-gray-500 max-w-[320px]">
                              <span className="line-clamp-1">{log.details || '—'}</span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              {hasMeta && (
                                <svg className={`w-4 h-4 text-gray-300 inline transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="6 9 12 15 18 9"/>
                                </svg>
                              )}
                            </td>
                          </tr>
                          {isOpen && hasMeta && (
                            <tr className="bg-gray-50/60">
                              <td colSpan={7} className="px-5 py-4">
                                <MetadataView metadata={log.metadata} ip={log.ipAddress} />
                              </td>
                            </tr>
                          )}
                        </FragmentRow>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="lg:hidden divide-y divide-gray-50">
                {logs.map(log => {
                  const meta = actionMeta(log.action);
                  const isOpen = expanded === log._id;
                  const hasMeta = log.metadata && Object.keys(log.metadata).length > 0;
                  return (
                    <div key={log._id} className="px-4 py-3.5">
                      <div onClick={() => setExpanded(isOpen ? null : log._id)} className="cursor-pointer">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${meta.cls}`}>
                            {meta.label}
                          </span>
                          <span className="text-[11px] text-gray-400 font-medium tabular-nums">{fmtTimestamp(log.createdAt)}</span>
                        </div>
                        <p className="text-[13px] text-gray-700 leading-snug mb-1.5">{log.details || '—'}</p>
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-gray-400">
                          <span className="font-semibold text-gray-600">{log.adminName || '—'}</span>
                          <span>·</span>
                          <span>{cap(log.targetType)}{log.targetName ? ` · ${log.targetName}` : ''}</span>
                          {log.targetId && <IdChip id={log.targetId} size="xs" tone="subtle" />}
                        </div>
                      </div>
                      {isOpen && hasMeta && (
                        <div className="mt-3">
                          <MetadataView metadata={log.metadata} ip={log.ipAddress} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
                  <p className="text-xs text-gray-500">
                    Page <span className="font-semibold text-gray-700">{page}</span> of{' '}
                    <span className="font-semibold text-gray-700">{pages}</span>
                    <span className="text-gray-400 ml-1.5">· {total} total</span>
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-gray-600 shadow-sm"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(pages, p + 1))}
                      disabled={page === pages}
                      className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-gray-600 shadow-sm"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// React.Fragment with a key, so each log can render two <tr>s (row + metadata).
function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function MetadataView({ metadata, ip }: { metadata: Record<string, any>; ip?: string }) {
  const entries = Object.entries(metadata || {});
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7FA8AD] mb-2.5">Details</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 border-b border-gray-50 pb-1.5">
            <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{k}</span>
            <span className="text-[12px] font-semibold text-gray-800 text-right break-words">
              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
            </span>
          </div>
        ))}
        {ip && (
          <div className="flex items-baseline justify-between gap-3 border-b border-gray-50 pb-1.5">
            <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">ip address</span>
            <span className="text-[12px] font-semibold text-gray-800 font-mono">{ip}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-[#3E4751]/8 border border-[#3E4751]/10 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-[#3E4751]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
        </svg>
      </div>
      {hasFilters ? (
        <>
          <p className="text-sm font-semibold text-gray-700">No logs match your filters</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Try widening the date range or clearing filters.</p>
          <button
            onClick={onClear}
            className="text-xs font-semibold text-white px-4 py-2 rounded-xl bg-[#3E4751] hover:bg-[#2f363d] transition-all cursor-pointer shadow-sm"
          >
            Clear filters
          </button>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-gray-700">No admin actions recorded yet</p>
          <p className="text-xs text-gray-400 mt-1">Actions you take will appear here.</p>
        </>
      )}
    </div>
  );
}
