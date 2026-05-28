'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AdminNav from '@/components/shared/AdminNav';

const ROLE_STYLES: Record<string, string> = {
  influencer: 'bg-[#EEF4F5] text-[#2A3E42]',
  brand:      'bg-[#EAEDF6] text-[#1B2444]',
  admin:      'bg-gray-100 text-gray-700',
};

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers]           = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [toast, setToast]           = useState('');
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);

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
  }, [roleFilter, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 20, page };
      if (roleFilter) params.role = roleFilter;
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

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    setPage(1);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleStatusUpdate = async (userId: string, status: string) => {
    try {
      await api.put(`/api/admin/users/${userId}/status`, { status });
      showToast(`User ${status} successfully.`);
      fetchUsers();
    } catch {
      showToast('Failed to update user status.');
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
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">User management</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
            All Users{total > 0 && <span className="text-gray-400 font-normal"> · {total}</span>}
          </h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 sm:max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E4751]/30 focus:border-[#3E4751] hover:border-gray-300 transition-all placeholder:text-gray-400 bg-white"
            />
          </div>
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 overflow-x-auto">
            {['', 'influencer', 'brand', 'admin'].map(role => (
              <button
                key={role}
                onClick={() => handleRoleFilter(role)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                  roleFilter === role
                    ? 'bg-[#EEF0F3] text-[#1A2028] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {role || 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['User', 'Role', 'Plan', 'Status', 'Joined', 'Actions'].map(h => (
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
                        <p className="text-sm text-gray-400">Loading users…</p>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center text-sm text-gray-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#EEF4F5] text-[#2A3E42] flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${ROLE_STYLES[u.role]}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${
                          u.plan === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${
                          u.status === 'active'    ? 'bg-green-100 text-green-700'
                          : u.status === 'suspended' ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5">
                        {u.role !== 'admin' && (
                          u.status !== 'suspended' ? (
                            <button
                              onClick={() => handleStatusUpdate(u._id, 'suspended')}
                              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-all cursor-pointer font-medium"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusUpdate(u._id, 'active')}
                              className="text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all cursor-pointer font-medium"
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

          {/* Mobile card list */}
          <div className="md:hidden">
            {loading ? (
              <div className="flex flex-col items-center gap-2 py-14">
                <div className="w-6 h-6 border-2 border-[#3E4751] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading users…</p>
              </div>
            ) : users.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-14">No users found.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {users.map((u, i) => (
                  <div key={i} className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#EEF4F5] text-[#2A3E42] flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                          {u.role !== 'admin' && (
                            u.status !== 'suspended' ? (
                              <button
                                onClick={() => handleStatusUpdate(u._id, 'suspended')}
                                className="flex-shrink-0 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-all cursor-pointer font-medium"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusUpdate(u._id, 'active')}
                                className="flex-shrink-0 text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all cursor-pointer font-medium"
                              >
                                Restore
                              </button>
                            )
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${ROLE_STYLES[u.role]}`}>
                            {u.role}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                            u.plan === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {u.plan}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                            u.status === 'active'    ? 'bg-green-100 text-green-700'
                            : u.status === 'suspended' ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                          }`}>
                            {u.status}
                          </span>
                          <span className="text-[11px] text-gray-400">
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
            <div className="flex items-center justify-between px-4 py-3.5 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500">
                Page <span className="font-semibold text-gray-700">{page}</span> of <span className="font-semibold text-gray-700">{pages}</span>
                <span className="ml-2 text-gray-400">· {total} users total</span>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-gray-600"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (pages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pages - 2) {
                    pageNum = pages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
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
                  className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-gray-600"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
