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
import { cdnImg } from '@/lib/img';

const ROLE_STYLES: Record<string, string> = {
  influencer: 'bg-teal-50 text-teal-700 border border-teal-100',
  brand:      'bg-blue-50 text-blue-700 border border-blue-100',
  admin:      'bg-gray-100 text-gray-600 border border-gray-200',
};

export default function AdminUsers() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  // Seed role/plan filters from the URL so deep links like
  // /admin/users?plan=premium (e.g. from the subscriptions breakdown) land
  // pre-filtered. Guarded for SSR, matching the discover page pattern.
  const initialParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const [users, setUsers]           = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState(initialParams?.get('role') || '');
  const [planFilter, setPlanFilter] = useState(initialParams?.get('plan') || '');
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/admin/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin') { router.push('/admin/login'); return; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, planFilter, page]);

  const fetchUsers = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 20, page };
      if (roleFilter) params.role = roleFilter;
      if (planFilter) params.plan = planFilter;
      if (search)     params.search = search;
      const response = await api.get('/api/admin/users', { params });
      setUsers(response.data.users);
      setTotal(response.data.pagination.total);
      setPages(response.data.pagination.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useLiveData(() => { fetchUsers({ silent: true }); });

  const handleSearch = () => { setPage(1); fetchUsers(); };
  const handleRoleFilter = (role: string) => { setRoleFilter(role); setPage(1); };
  const handlePlanFilter = (plan: string) => { setPlanFilter(plan); setPage(1); };

  const showToast = (msg: string) => {
    toast.show(msg, /fail|error|cannot|unable|wrong/.test(msg.toLowerCase()) ? 'error' : 'success');
  };

  const handleStatusUpdate = async (userId: string, status: string, name?: string) => {
    if (status === 'suspended') {
      const ok = await confirm({
        title: 'Suspend this account?',
        description: `${name || 'This user'} will be signed out immediately and blocked from accessing the platform until restored.`,
        confirmLabel: 'Suspend',
        variant: 'danger',
      });
      if (!ok) return;
    }
    try {
      await api.put(`/api/admin/users/${userId}/status`, { status });
      showToast(`User ${status === 'suspended' ? 'suspended' : 'restored'} successfully.`);
      fetchUsers();
    } catch {
      showToast('Failed to update user status.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F8FA] via-[#F4F6F9] to-[#EDF0F5]">

      <AdminNav />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-9">

        <div className="mb-7">
          <p className="text-[11px] font-semibold text-[#7FA8AD] uppercase tracking-[0.18em] mb-1.5">User management</p>
          <div className="flex items-center gap-3">
            <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">All Users</h1>
            {total > 0 && (
              <span className="text-sm font-semibold text-gray-500 bg-gray-100 border border-gray-200/70 px-2.5 py-0.5 rounded-full tabular-nums">
                {total}
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 sm:max-w-xs">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, email or user ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E4751]/20 focus:border-[#3E4751] hover:border-gray-300 transition-all placeholder:text-gray-400 bg-white shadow-sm"
            />
          </div>
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-0.5 overflow-x-auto shadow-sm">
            {[
              { value: '',           label: 'All roles' },
              { value: 'influencer', label: 'Creators' },
              { value: 'brand',      label: 'Brands' },
              { value: 'admin',      label: 'Admins' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => handleRoleFilter(f.value)}
                className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  roleFilter === f.value
                    ? 'bg-[#3E4751] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-0.5 overflow-x-auto shadow-sm">
            {[
              { value: '',         label: 'All plans' },
              { value: 'premium',  label: 'Premium' },
              { value: 'freemium', label: 'Freemium' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => handlePlanFilter(f.value)}
                className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  planFilter === f.value
                    ? f.value === 'premium'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-[#3E4751] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {f.label}
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
                  {['User', 'ID', 'Role', 'Plan', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-2 border-[#3E4751] border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-400 font-medium">Loading users…</p>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <p className="text-sm font-medium text-gray-500">No users found</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
                    </td>
                  </tr>
                ) : (
                  users.map((u, i) => (
                    <tr key={i} onClick={() => setSelectedId(u._id)} className="hover:bg-gray-50/60 transition-colors group cursor-pointer">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img loading="lazy" decoding="async" src={cdnImg(u.avatarUrl)} alt={u.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 shadow-sm" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3E4751] to-[#5A6472] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 shadow-sm">
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                            <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.customId ? <IdChip id={u.customId} size="xs" tone="subtle" /> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${ROLE_STYLES[u.role]}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                          u.plan === 'premium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-gray-50 text-gray-500 border border-gray-200'
                        }`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                          u.status === 'active'     ? 'bg-green-50 text-green-700 border border-green-100'
                          : u.status === 'suspended' ? 'bg-red-50 text-red-700 border border-red-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[11px] text-gray-400 whitespace-nowrap font-medium">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5">
                        {u.role !== 'admin' && (
                          u.status !== 'suspended' ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(u._id, 'suspended', u.name); }}
                              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-500 transition-all cursor-pointer font-semibold"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(u._id, 'active'); }}
                              className="text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-100 transition-all cursor-pointer font-semibold"
                            >
                              Restore
                            </button>
                          )
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
                <p className="text-sm text-gray-400 font-medium">Loading users…</p>
              </div>
            ) : users.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-medium text-gray-500">No users found</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {users.map((u, i) => (
                  <div key={i} onClick={() => setSelectedId(u._id)} className="px-4 py-4 cursor-pointer active:bg-gray-50">
                    <div className="flex items-start gap-3">
                      {u.avatarUrl ? (
                        <img loading="lazy" decoding="async" src={cdnImg(u.avatarUrl)} alt={u.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3E4751] to-[#5A6472] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                          {u.role !== 'admin' && (
                            u.status !== 'suspended' ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(u._id, 'suspended', u.name); }}
                                className="flex-shrink-0 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all cursor-pointer font-semibold"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(u._id, 'active'); }}
                                className="flex-shrink-0 text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-100 transition-all cursor-pointer font-semibold"
                              >
                                Restore
                              </button>
                            )
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {u.customId && <IdChip id={u.customId} size="xs" tone="subtle" />}
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${ROLE_STYLES[u.role]}`}>
                            {u.role}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                            u.plan === 'premium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-gray-50 text-gray-500 border border-gray-200'
                          }`}>
                            {u.plan}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                            u.status === 'active'     ? 'bg-green-50 text-green-700 border border-green-100'
                            : u.status === 'suspended' ? 'bg-red-50 text-red-700 border border-red-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {u.status}
                          </span>
                          <span className="text-[11px] text-gray-400 font-medium">
                            {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                      className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
      </main>

      <UserDetailDrawer
        userId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={() => fetchUsers({ silent: true })}
      />
    </div>
  );
}
