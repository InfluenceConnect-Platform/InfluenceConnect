'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useLiveData } from '@/lib/useLiveData';
import BrandNav from '@/components/shared/BrandNav';
import InvitationDetailDrawer from '@/components/shared/InvitationDetailDrawer';
import { cdnImg } from '@/lib/img';

const STATUS_CONFIG: Record<string, { cls: string; dot: string; label: string }> = {
  pending:  { cls: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-400', label: 'Pending' },
  accepted: { cls: 'bg-green-50 text-green-700 border border-green-200', dot: 'bg-green-500', label: 'Accepted' },
  rejected: { cls: 'bg-red-50 text-red-600 border border-red-200',       dot: 'bg-red-400',   label: 'Declined' },
};

const AVATAR_GRADS = [
  'from-violet-500 to-purple-600',
  'from-teal-500 to-cyan-600',
  'from-amber-500 to-orange-500',
  'from-indigo-500 to-blue-600',
  'from-pink-500 to-rose-500',
  'from-emerald-500 to-green-600',
];

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

interface Invitation {
  _id: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  respondedAt?: string | null;
  dealId?: string | null;
  influencerName?: string;
  influencerSlug?: string;
  influencerProfilePicUrl?: string;
  campaignId?: { _id: string; title: string; status?: string };
}

type Tab = 'all' | 'pending' | 'accepted' | 'rejected';
const TABS: Tab[] = ['all', 'pending', 'accepted', 'rejected'];

export default function BrandInvitations() {
  const router = useRouter();
  const [user] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [selectedInv, setSelectedInv] = useState<Invitation | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    if (JSON.parse(stored).role !== 'brand') { router.push('/auth/login'); return; }
    fetchInvitations();
    // Clear the brand-side "new response" badge once they view this page.
    api.put('/api/invitations/brand/seen').catch(() => {});
  }, []);

  useLiveData(() => { fetchInvitations(); });

  const fetchInvitations = async () => {
    try {
      const res = await api.get('/api/invitations/brand');
      setInvitations(res.data.invitations || []);
    } catch (error) {
      console.error('Fetch brand invitations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = invitations.filter(i => activeTab === 'all' ? true : i.status === activeTab);
  const countByStatus = (s: Tab) => s === 'all' ? invitations.length : invitations.filter(i => i.status === s).length;

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      <BrandNav user={user} />

      <main className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#03050f] via-[#3346d9] to-[#7c8aff] rounded-2xl px-6 sm:px-8 py-7 mb-5 shadow-lg">
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -left-8 w-44 h-44 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-blue-300/80 text-xs font-semibold uppercase tracking-widest mb-2">Outreach</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Sent Invitations</h1>
              <p className="text-blue-200/70 text-sm mt-1.5">
                Track the creators you invited. Accepted invitations open a deal in Messages.
              </p>
            </div>
            <Link
              href="/brand/campaigns"
              className="flex-shrink-0 self-start flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Invite more
            </Link>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#3D5087] text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-[#3D5087]/40'
              }`}
            >
              {tab}
              <span className={`text-[11px] font-bold px-1.5 rounded-full ${activeTab === tab ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                {countByStatus(tab)}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-gray-200/80 rounded-2xl p-4 animate-pulse flex gap-3">
                <div className="w-11 h-11 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2"><div className="h-3.5 bg-gray-100 rounded w-1/3" /><div className="h-3 bg-gray-100 rounded w-1/4" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border-2 border-dashed border-blue-100 rounded-2xl p-16 text-center bg-white/60">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3D5087] to-[#4a5fa0] text-white flex items-center justify-center mx-auto mb-4 shadow-md">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {activeTab === 'all' ? 'No invitations sent yet' : `No ${activeTab} invitations`}
            </p>
            <p className="text-xs text-gray-400 mb-4">Invite creators from a campaign to start proactive outreach.</p>
            <Link href="/brand/campaigns" className="text-xs bg-gradient-to-r from-[#3D5087] to-[#4a5fa0] text-white px-4 py-2 rounded-xl font-semibold cursor-pointer shadow-sm hover:shadow-md transition-all">
              Go to Campaigns →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(inv => {
              const status = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.pending;
              const name = inv.influencerName || 'Influencer';
              const grad = AVATAR_GRADS[(name.charCodeAt(0) || 0) % AVATAR_GRADS.length];
              return (
                <div
                  key={inv._id}
                  onClick={() => setSelectedInv(inv)}
                  className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#C7D2EC] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Influencer avatar */}
                    <div className={`w-11 h-11 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${grad} shadow-sm`}>
                      {inv.influencerProfilePicUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img loading="lazy" decoding="async" src={cdnImg(inv.influencerProfilePicUrl)} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold">{name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {inv.influencerSlug ? (
                          <Link href={`/brand/creator/${inv.influencerSlug}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-bold text-gray-900 truncate hover:text-[#3D5087] hover:underline">
                            {name}
                          </Link>
                        ) : (
                          <span className="font-bold text-gray-900 truncate">{name}</span>
                        )}
                        <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${status.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        for <span className="font-semibold text-gray-700">{inv.campaignId?.title || 'campaign'}</span>
                        <span className="text-gray-300"> · </span>
                        Sent {formatDate(inv.createdAt)}
                        {inv.respondedAt && <span> · Responded {formatDate(inv.respondedAt)}</span>}
                      </p>
                    </div>

                    {/* Accepted → jump into the conversation */}
                    {inv.status === 'accepted' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(inv.dealId ? `/brand/messages?deal=${inv.dealId}` : '/brand/messages'); }}
                        className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#3D5087] to-[#4a5fa0] hover:from-[#2B3B68] hover:to-[#3D5087] px-3.5 py-2 rounded-lg transition-all shadow-sm cursor-pointer"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Message
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <InvitationDetailDrawer
        invitation={selectedInv}
        onClose={() => setSelectedInv(null)}
      />
    </div>
  );
}
