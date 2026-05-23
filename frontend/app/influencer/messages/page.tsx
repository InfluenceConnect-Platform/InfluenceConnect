'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import OfferPanel, { Offer } from '@/components/shared/OfferPanel';
import InfluencerNav from '@/components/shared/InfluencerNav';

interface Message {
  _id: string;
  senderId: string;
  content: string;
  createdAt: string;
  blocked?: boolean;
  blockReason?: string;
}

interface Deal {
  _id: string;
  campaignId: { title: string; niche: string[]; deliverables?: string; budgetMin: number; budgetMax: number };
  brandId: { _id: string; name: string };
  brandLogoUrl?: string;
  agreedAmount: number;
  status: string;
  negotiationStatus: 'open' | 'agreed';
  offers: Offer[];
  lastMessage?: { content: string; senderId: string; createdAt: string } | null;
  unreadCount?: number;
}

const BLOCKED_PATTERN =
  /(\+?\d[\d\s\-()‌]{7,}|[\w.-]+@[\w.-]+\.\w+|https?:\/\/|www\.|instagram|insta\.me|facebook|fb\.com|whatsapp|wa\.me|telegram|t\.me|snapchat)/i;

// ─── Icons ────────────────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const ChatBubbleIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const CheckDoubleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/><polyline points="17 3 10 10"/>
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const formatRelativeTime = (d: string) => {
  const now = Date.now();
  const then = new Date(d).getTime();
  const diff = now - then;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return formatTime(d);
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const getInitials = (name: string) =>
  name?.slice(0, 2).toUpperCase() || 'BR';

const AVATAR_COLORS = [
  'from-[#7FA8AD] to-[#5D8A8F]',
  'from-violet-400 to-violet-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-600',
  'from-emerald-400 to-teal-600',
];
const getAvatarColor = (name: string) =>
  AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// ─── Component ────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; plan: string } | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [search, setSearch] = useState('');
  const [showChat, setShowChat] = useState(false); // mobile: toggle list vs chat
  const [actionLoading, setActionLoading] = useState(false);

  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const activeIdRef = useRef<string | null>(null); // tracks which deal is active to discard stale responses
  const FREEMIUM_MSG_LIMIT = 10;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    setUser(JSON.parse(stored));
    api.get('/api/influencer/profile/me').then(r => setProfilePicUrl(r.data?.profile?.profilePicUrl || '')).catch(() => {});
    fetchDeals();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  // Depend only on the deal _id string, not the whole object.
  // fetchDealState spreads selectedDeal into a new reference every tick which would
  // otherwise reset the interval and fire a cascade of overlapping fetches.
  const selectedDealId = selectedDeal?._id ?? null;
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!selectedDealId) return;
    fetchMessages(selectedDealId);
    fetchDealState(selectedDealId);
    pollRef.current = setInterval(() => {
      fetchMessages(selectedDealId);
      fetchDealState(selectedDealId);
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedDealId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDeals = async () => {
    try {
      const res = await api.get('/api/influencer/deals');
      setDeals(res.data.deals || []);
    } catch (error) {
      console.error('Fetch deals error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (dealId: string) => {
    try {
      const response = await api.get(`/api/messages/${dealId}`);
      // Discard response if the user switched to a different deal while this was in-flight
      if (activeIdRef.current !== dealId) return;
      setMessages(response.data.messages || []);
    } catch { /* ignore */ }
  };

  const fetchDealState = async (dealId: string) => {
    try {
      const res = await api.get(`/api/deals/${dealId}`);
      if (activeIdRef.current !== dealId) return;
      const { status, offers, negotiationStatus, agreedAmount } = res.data;
      setSelectedDeal(prev =>
        prev && prev._id === dealId
          ? { ...prev, status, offers, negotiationStatus, agreedAmount }
          : prev
      );
      setDeals(prev =>
        prev.map(d =>
          d._id === dealId ? { ...d, status, offers, negotiationStatus, agreedAmount } : d
        )
      );
    } catch { /* ignore — don't disrupt chat if this fails */ }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedDeal) return;
    if (BLOCKED_PATTERN.test(newMessage)) {
      setBlocked(true);
      setTimeout(() => setBlocked(false), 4000);
      return;
    }
    if (!isPremium && messagesUsed >= FREEMIUM_MSG_LIMIT) return;
    if (dealClosed || chatLocked) return;

    setSending(true);
    try {
      await api.post(`/api/messages/${selectedDeal._id}`, { content: newMessage.trim() });
      setNewMessage('');
      setMessagesUsed(prev => prev + 1);
      fetchMessages(selectedDeal._id);
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectDeal = (deal: Deal) => {
    activeIdRef.current = deal._id;
    setMessages([]);
    setNewMessage('');
    setBlocked(false);
    setSelectedDeal(deal);
    setShowChat(true);
    // Clear unread count locally immediately (backend clears on getMessages fetch)
    setDeals(prev => prev.map(d => d._id === deal._id ? { ...d, unreadCount: 0 } : d));
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const goBackToList = () => {
    setShowChat(false);
  };

  const handleSubmitContent = async () => {
    if (!selectedDeal) return;
    if (!window.confirm('Mark your content as submitted? The brand will be notified to review.')) return;
    setActionLoading(true);
    try {
      await api.put(`/api/influencer/deals/${selectedDeal._id}/status`, { status: 'content-submitted' });
      setSelectedDeal(prev => prev ? { ...prev, status: 'content-submitted' } : prev);
      setDeals(prev => prev.map(d => d._id === selectedDeal._id ? { ...d, status: 'content-submitted' } : d));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e.response?.data?.error || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDeals = deals.filter(d =>
    d.brandId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.campaignId?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const isPremium = user?.plan === 'premium';
  const limitReached = !isPremium && messagesUsed >= FREEMIUM_MSG_LIMIT;
  const dealClosed = selectedDeal?.status === 'completed' || selectedDeal?.status === 'cancelled';
  const chatLocked = !dealClosed && selectedDeal?.negotiationStatus !== 'agreed';

  return (
    <div className="h-[100dvh] bg-[#F7F9FA] flex flex-col overflow-hidden">

      <InfluencerNav user={user} profilePicUrl={profilePicUrl} />

      {/* Main messaging layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Thread sidebar ── */}
        <aside className={`
          w-full lg:w-[320px] xl:w-[360px] flex-shrink-0 flex flex-col
          bg-white border-r border-gray-200
          ${showChat ? 'hidden lg:flex' : 'flex'}
        `}>

          {/* Sidebar header */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 bg-gradient-to-r from-teal-50/70 to-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#7FA8AD] to-[#5D8A8F]" />
                <h1 className="text-lg font-bold text-gray-900">Messages</h1>
              </div>
              {!isPremium && (
                <span className="text-[11px] font-semibold px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-sm">
                  {messagesUsed}/{FREEMIUM_MSG_LIMIT} used
                </span>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search conversations…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7FA8AD]/30 focus:border-[#7FA8AD] transition-all duration-150"
              />
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <div className="w-6 h-6 border-2 border-[#7FA8AD] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-400">Loading conversations…</p>
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] text-white flex items-center justify-center mx-auto mb-4 shadow-md">
                  <ChatBubbleIcon size={32} />
                </div>
                <p className="text-sm font-bold text-gray-800 mb-1">No conversations yet</p>
                <p className="text-xs text-gray-400 leading-relaxed max-w-[220px]">
                  {search
                    ? 'No conversations match your search.'
                    : 'Conversations appear here once a brand accepts your campaign application.'}
                </p>
                {!search && (
                  <Link href="/influencer/campaigns"
                    className="mt-5 text-xs font-semibold text-white bg-[#7FA8AD] hover:bg-[#5D8A8F] px-4 py-2 rounded-xl transition-all duration-150 cursor-pointer shadow-sm">
                    Browse campaigns →
                  </Link>
                )}
              </div>
            ) : (
              <ul className="py-1">
                {filteredDeals.map(deal => {
                  const isActive = selectedDeal?._id === deal._id;
                  const lastMsg = deal.lastMessage || null;
                  const initials = getInitials(deal.brandId?.name);
                  const avatarColor = getAvatarColor(deal.brandId?.name || '');
                  const hasUnread = (deal.unreadCount ?? 0) > 0;
                  const pendingOffers = deal.offers?.filter(o => o.status === 'pending') ?? [];
                  const latestPending = pendingOffers[pendingOffers.length - 1];
                  const hasPendingOffer = !!latestPending && latestPending.proposedBy !== user?.id;
                  const hasActivity = !isActive && (hasUnread || hasPendingOffer);
                  return (
                    <li key={deal._id}>
                      <button
                        onClick={() => selectDeal(deal)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-150 cursor-pointer border-b border-gray-50 ${
                          isActive
                            ? 'bg-gradient-to-r from-teal-50 to-cyan-50 border-l-[3px] border-l-[#7FA8AD]'
                            : hasActivity
                            ? 'bg-teal-50/40 hover:bg-teal-50/70 border-l-[3px] border-l-teal-300'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Avatar with unread ring */}
                        <div className="relative flex-shrink-0">
                          <div className={`w-11 h-11 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center ${!deal.brandLogoUrl ? `bg-gradient-to-br ${avatarColor}` : 'bg-gray-100'}`}>
                            {deal.brandLogoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={deal.brandLogoUrl} alt={deal.brandId?.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold text-sm">{initials}</span>
                            )}
                          </div>
                          {hasActivity && (
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#4CAF7D] border-2 border-white shadow-sm" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between mb-0.5">
                            <span className={`text-[13px] truncate ${
                              isActive ? 'font-bold text-[#2A3E42]' : hasActivity ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'
                            }`}>
                              {deal.brandId?.name}
                            </span>
                            {lastMsg && (
                              <span className={`text-[10px] ml-2 flex-shrink-0 ${hasActivity ? 'text-teal-600 font-semibold' : 'text-gray-400'}`}>
                                {formatRelativeTime(lastMsg.createdAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mb-0.5">{deal.campaignId?.title}</p>
                          {hasPendingOffer && !isActive ? (
                            <p className="text-[11px] text-amber-600 font-semibold truncate">💬 New offer — tap to respond</p>
                          ) : lastMsg ? (
                            <p className={`text-[11px] truncate ${hasUnread && !isActive ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>
                              {lastMsg.content}
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-300 italic">No messages yet</p>
                          )}
                        </div>

                        {/* Right side: unread badge or deal status pill */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {hasUnread && !isActive && (
                            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#4CAF7D] text-white text-[10px] font-bold flex items-center justify-center">
                              {(deal.unreadCount ?? 0) > 9 ? '9+' : deal.unreadCount}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white ${
                            deal.status === 'completed'
                              ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                              : deal.status === 'active'
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                              : 'bg-gradient-to-r from-amber-500 to-orange-500'
                          }`}>
                            {deal.status}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Freemium upgrade nudge */}
          {!isPremium && (
            <div className="border-t border-gray-100 p-3">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#1C4A52] via-[#27717E] to-[#5BA8B5] rounded-xl p-3 flex items-center gap-2.5">
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />
                <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center flex-shrink-0">
                  <LockIcon />
                </div>
                <div className="flex-1 min-w-0 relative">
                  <p className="text-[11px] font-bold text-white">Unlimited messages</p>
                  <p className="text-[10px] text-teal-200">Upgrade to Premium</p>
                </div>
                <Link href="/influencer/billing"
                  className="text-[11px] font-bold text-[#1C4A52] bg-white hover:bg-gray-50 px-2.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer flex-shrink-0 shadow-sm relative">
                  Upgrade
                </Link>
              </div>
            </div>
          )}
        </aside>

        {/* ── Chat area ── */}
        <section className={`
          flex-1 flex flex-col min-w-0
          ${showChat ? 'flex' : 'hidden lg:flex'}
        `}>

          {selectedDeal ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 bg-gradient-to-r from-teal-50/80 via-white to-white border-b border-gray-200 shadow-sm flex-shrink-0">
                {/* Back button (mobile only) */}
                <button
                  onClick={goBackToList}
                  className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all duration-150 cursor-pointer flex-shrink-0">
                  <ArrowLeftIcon />
                </button>

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center ${!selectedDeal.brandLogoUrl ? `bg-gradient-to-br ${getAvatarColor(selectedDeal.brandId?.name || '')}` : 'bg-gray-100'}`}>
                  {selectedDeal.brandLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedDeal.brandLogoUrl} alt={selectedDeal.brandId?.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">{getInitials(selectedDeal.brandId?.name)}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{selectedDeal.brandId?.name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-gray-400 truncate">{selectedDeal.campaignId?.title}</p>
                    {selectedDeal.negotiationStatus === 'agreed' ? (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60 flex-shrink-0">
                        ₹{selectedDeal.agreedAmount.toLocaleString()} agreed
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60 flex-shrink-0">
                        Negotiating…
                      </span>
                    )}
                  </div>
                </div>

                {/* Status + online indicator + action buttons */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {/* Deal action buttons */}
                  {selectedDeal.status === 'in-progress' && (
                    <button
                      onClick={handleSubmitContent}
                      disabled={actionLoading}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white transition-all duration-150 cursor-pointer disabled:opacity-60 shadow-sm"
                    >
                      {actionLoading ? 'Submitting…' : 'Mark As Done'}
                    </button>
                  )}
                  {selectedDeal.status === 'content-submitted' && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
                      Awaiting Brand Review
                    </span>
                  )}
                  {selectedDeal.status === 'completed' && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                      Deal Complete ✅
                    </span>
                  )}
                  {selectedDeal.status === 'cancelled' && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-100 text-red-700 border border-red-200">
                      Cancelled
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[11px] text-gray-400 hidden sm:block">Active deal</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full text-white ${
                    selectedDeal.status === 'completed'
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                      : selectedDeal.status === 'active'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}>
                    {selectedDeal.status}
                  </span>
                </div>
              </div>

              {/* Campaign brief strip */}
              <div className="flex items-center gap-3 px-4 sm:px-5 py-2 bg-teal-50/60 border-b border-teal-100/60 flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                <svg className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <span className="text-[11px] text-teal-700 font-semibold flex-shrink-0">Deliverables:</span>
                <span className="text-[11px] text-teal-600 flex-shrink-0">{selectedDeal.campaignId?.deliverables || '—'}</span>
                <span className="text-teal-300 flex-shrink-0">·</span>
                <svg className="w-3 h-3 text-teal-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3h12M6 8h12M12 21 6 8"/><path d="M6 13h3a4 4 0 1 0 0-5H6"/>
                </svg>
                <span className="text-[11px] text-teal-700 font-semibold flex-shrink-0">Budget:</span>
                <span className="text-[11px] text-teal-600 flex-shrink-0 font-medium">
                  {selectedDeal.negotiationStatus === 'agreed'
                    ? `₹${selectedDeal.agreedAmount?.toLocaleString('en-IN')} (agreed)`
                    : `₹${selectedDeal.campaignId?.budgetMin?.toLocaleString('en-IN')} – ₹${selectedDeal.campaignId?.budgetMax?.toLocaleString('en-IN')}`}
                </span>
              </div>

              {/* Offer negotiation panel */}
              {!dealClosed && (
                <OfferPanel
                  dealId={selectedDeal._id}
                  budgetMin={selectedDeal.campaignId?.budgetMin ?? 0}
                  budgetMax={selectedDeal.campaignId?.budgetMax ?? 0}
                  offers={selectedDeal.offers ?? []}
                  negotiationStatus={selectedDeal.negotiationStatus ?? 'open'}
                  agreedAmount={selectedDeal.agreedAmount}
                  currentUserId={user?.id ?? ''}
                  dealClosed={dealClosed}
                  onUpdated={patch => {
                    setSelectedDeal(prev => prev ? { ...prev, ...patch } : prev);
                    setDeals(prev => prev.map(d => d._id === selectedDeal._id ? { ...d, ...patch } : d));
                  }}
                />
              )}

              {/* Platform moderation notice */}
              <div className="flex items-center gap-2 px-4 sm:px-5 py-2 bg-gradient-to-r from-teal-50 to-cyan-50/50 border-b border-teal-200/40 flex-shrink-0">
                <span className="text-teal-600 flex-shrink-0"><ShieldIcon /></span>
                <p className="text-[11px] text-teal-700 font-medium">
                  Sharing phone numbers, emails, or social handles is automatically blocked to protect both parties.
                </p>
              </div>

              {/* Messages thread */}
              <div
                ref={threadRef}
                className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 flex flex-col gap-3"
                style={{ background: 'linear-gradient(180deg, #F7F9FA 0%, #FAFCFC 100%)' }}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] text-white flex items-center justify-center shadow-md">
                      <ChatBubbleIcon size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-1">Start the conversation</p>
                      <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
                        Introduce yourself and discuss campaign expectations with {selectedDeal.brandId?.name}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Date divider */}
                    <div className="flex items-center gap-3 my-1">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-[11px] text-gray-400 font-medium px-2 flex-shrink-0">Today</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {messages.map((msg, idx) => {
                      const isMine = msg.senderId?.toString() === user?.id?.toString();
                      const showAvatar = !isMine && (idx === 0 || messages[idx - 1]?.senderId !== msg.senderId);
                      const isLast = idx === messages.length - 1 || messages[idx + 1]?.senderId !== msg.senderId;

                      return (
                        <div key={msg._id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          {/* Their avatar */}
                          {!isMine && (
                            <div className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center ${showAvatar ? 'visible' : 'invisible'} ${!selectedDeal.brandLogoUrl ? `bg-gradient-to-br ${getAvatarColor(selectedDeal.brandId?.name || '')}` : 'bg-gray-100'}`}>
                              {selectedDeal.brandLogoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={selectedDeal.brandLogoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white text-[10px] font-bold">{getInitials(selectedDeal.brandId?.name)}</span>
                              )}
                            </div>
                          )}

                          <div className={`flex flex-col gap-0.5 max-w-[72%] sm:max-w-[60%] ${isMine ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                              isMine
                                ? `bg-gradient-to-br from-[#27717E] to-[#5BA8B5] text-white ${isLast ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl'}`
                                : `bg-white border border-gray-200 text-gray-800 ${isLast ? 'rounded-2xl rounded-bl-sm' : 'rounded-2xl'}`
                            }`}>
                              {msg.content}
                            </div>
                            {isLast && (
                              <div className={`flex items-center gap-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                                <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                                {isMine && (
                                  <span className="text-[#7FA8AD]"><CheckDoubleIcon /></span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* My avatar */}
                          {isMine && (
                            <div className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center ${showAvatar ? 'visible' : 'invisible'} bg-gradient-to-br from-[#FDE5DC] to-[#f5c4b0]`}>
                              {profilePicUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={profilePicUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[#9C4A33] text-[10px] font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Blocked alert */}
              {blocked && (
                <div className="mx-4 mb-2 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex-shrink-0">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <XIcon />
                  </div>
                  <div>
                    <strong className="block mb-0.5">Message blocked</strong>
                    <span className="text-xs text-red-600">Sharing contact info, social handles, or external links is not allowed on Influence Connect.</span>
                  </div>
                </div>
              )}

              {/* Limit reached banner */}
              {limitReached && (
                <div className="mx-4 mb-2 flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex-shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <LockIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-amber-800">Daily message limit reached</p>
                    <p className="text-xs text-amber-600">Upgrade to Premium for unlimited messaging.</p>
                  </div>
                  <Link href="/influencer/billing"
                    className="flex-shrink-0 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-xl transition-all duration-150 cursor-pointer">
                    Upgrade
                  </Link>
                </div>
              )}

              {/* Compose bar / closed-deal / chat-locked notice */}
              {dealClosed ? (
                <div className="px-4 sm:px-5 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
                    selectedDeal.status === 'completed'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    {selectedDeal.status === 'completed' ? (
                      <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                    )}
                    <p className={`text-sm font-medium ${selectedDeal.status === 'completed' ? 'text-emerald-700' : 'text-red-600'}`}>
                      {selectedDeal.status === 'completed'
                        ? 'This deal is complete. Messaging is closed — the chat history is preserved above.'
                        : 'This deal was cancelled. Messaging is disabled.'}
                    </p>
                  </div>
                </div>
              ) : chatLocked ? (
                <div className="px-4 sm:px-5 py-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-100 border border-gray-200">
                    <LockIcon />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500">Chat is locked</p>
                      <p className="text-[11px] text-gray-400">Agree on a price above to unlock messaging.</p>
                    </div>
                    <div className="flex-1 flex items-center px-3 py-2 bg-white border border-gray-200 rounded-xl opacity-50 cursor-not-allowed min-w-0">
                      <span className="text-xs text-gray-400 truncate">Type a message…</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-4 sm:px-5 py-3.5 bg-white border-t border-gray-200 flex-shrink-0">
                  <div className={`flex items-end gap-2.5 p-1 rounded-2xl border transition-all duration-150 ${
                    limitReached
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-white border-gray-200 focus-within:border-[#7FA8AD] focus-within:ring-2 focus-within:ring-[#7FA8AD]/20 shadow-sm'
                  }`}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={limitReached}
                      placeholder={limitReached ? 'Upgrade to Premium to keep messaging…' : 'Type a message… (Enter to send)'}
                      className="flex-1 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none disabled:text-gray-400 resize-none"
                    />
                    {newMessage.length > 200 && (
                      <span className={`text-[11px] font-medium self-center flex-shrink-0 ${newMessage.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
                        {500 - newMessage.length}
                      </span>
                    )}
                    <button
                      onClick={handleSend}
                      disabled={sending || !newMessage.trim() || limitReached}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                        newMessage.trim() && !limitReached
                          ? 'bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] hover:from-[#5D8A8F] hover:to-[#4A7A7F] text-white shadow-sm hover:shadow-md cursor-pointer'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {sending ? (
                        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      ) : (
                        <SendIcon />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* No conversation selected — desktop placeholder */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#1C4A52] via-[#27717E] to-[#5BA8B5] text-white flex items-center justify-center mb-5 shadow-lg">
                <ChatBubbleIcon size={40} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Your messages</h3>
              <p className="text-sm text-gray-400 max-w-[260px] leading-relaxed mb-6">
                Select a conversation from the sidebar to start chatting with a brand.
              </p>
              <div className="flex items-center gap-2 text-xs text-teal-700 bg-teal-50 px-4 py-2.5 rounded-xl border border-teal-200">
                <ShieldIcon />
                <span className="font-medium">End-to-end moderated for your safety</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
