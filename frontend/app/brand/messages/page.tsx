'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import BrandNav from '@/components/shared/BrandNav';
import OfferPanel, { Offer } from '@/components/shared/OfferPanel';

interface Message {
  _id: string;
  senderId: string;
  content: string;
  createdAt: string;
  blocked?: boolean;
}

interface Deal {
  _id: string;
  campaignId: { _id: string; title: string; niche: string[]; deliverables: string; budgetMin: number; budgetMax: number };
  influencerId: { _id: string; name: string };
  influencerProfile?: { niche: string[]; city: string; platforms: { name: string; followers: number }[] };
  agreedAmount: number;
  status: string;
  negotiationStatus: 'open' | 'agreed';
  offers: Offer[];
  lastMessage?: { content: string; senderId: string; createdAt: string } | null;
}

const BLOCKED_PATTERN =
  /(\+?\d[\d\s\-()‌]{7,}|[\w.-]+@[\w.-]+\.\w+|https?:\/\/|www\.|instagram|insta\.me|facebook|fb\.com|whatsapp|wa\.me|telegram|t\.me|snapchat)/i;

const FREEMIUM_MSG_LIMIT = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}
const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-green-600',
  'from-sky-500 to-blue-600',
  'from-teal-500 to-cyan-600',
];
function getAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function formatFollowers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
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
const CampaignIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);
const RupeeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12M6 8h12M12 21 6 8"/><path d="M6 13h3a4 4 0 1 0 0-5H6"/>
  </svg>
);

export default function BrandMessages() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; plan: string } | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [search, setSearch] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPremium = user?.plan === 'premium';
  const limitHit = !isPremium && messagesUsed >= FREEMIUM_MSG_LIMIT;
  const dealClosed = selectedDeal?.status === 'completed' || selectedDeal?.status === 'cancelled';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    setUser(JSON.parse(stored));
    fetchDeals();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [router]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (selectedDeal) {
      fetchMessages(selectedDeal._id);
      fetchDealState(selectedDeal._id);
      pollRef.current = setInterval(() => {
        fetchMessages(selectedDeal._id);
        fetchDealState(selectedDeal._id);
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedDeal]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDeals = async () => {
    try {
      const res = await api.get('/api/brand/deals');
      setDeals(res.data.deals || []);
    } catch (err) {
      console.error('Fetch deals error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDealState = async (dealId: string) => {
    try {
      const res = await api.get(`/api/deals/${dealId}`);
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

  const fetchMessages = useCallback(async (dealId: string) => {
    try {
      const res = await api.get(`/api/messages/${dealId}`);
      const msgs: Message[] = res.data.messages || [];
      setMessages(msgs);
      // Count today's messages sent by this brand
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const usedToday = msgs.filter(m =>
        m.senderId?.toString() === user?.id?.toString() && new Date(m.createdAt) >= today
      ).length;
      setMessagesUsed(usedToday);
    } catch { /* ignore */ }
  }, [user?.id]);

  const selectDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setShowChat(true);
    setMessages([]);
    setNewMessage('');
    setBlocked(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const goBackToList = () => {
    setShowChat(false);
    setSelectedDeal(null);
  };

  const handleMarkComplete = async () => {
    if (!selectedDeal) return;
    if (!window.confirm('Mark this deal as complete? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      await api.put(`/api/brand/deals/${selectedDeal._id}/status`, { status: 'completed' });
      setSelectedDeal(prev => prev ? { ...prev, status: 'completed' } : prev);
      setDeals(prev => prev.map(d => d._id === selectedDeal._id ? { ...d, status: 'completed' } : d));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e.response?.data?.error || 'Failed to update.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelDeal = async () => {
    if (!selectedDeal) return;
    if (!window.confirm('Cancel this deal? The campaign will be reopened for new applications.')) return;
    setActionLoading(true);
    try {
      await api.put(`/api/brand/deals/${selectedDeal._id}/status`, { status: 'cancelled' });
      setSelectedDeal(prev => prev ? { ...prev, status: 'cancelled' } : prev);
      setDeals(prev => prev.map(d => d._id === selectedDeal._id ? { ...d, status: 'cancelled' } : d));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e.response?.data?.error || 'Failed to cancel.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedDeal || limitHit || dealClosed) return;
    if (BLOCKED_PATTERN.test(newMessage)) {
      setBlocked(true);
      setTimeout(() => setBlocked(false), 4000);
      return;
    }
    setSending(true);
    const optimistic: Message = {
      _id: `tmp-${Date.now()}`,
      senderId: user?.id || '',
      content: newMessage.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setNewMessage('');
    try {
      const res = await api.post(`/api/messages/${selectedDeal._id}`, { content: optimistic.content });
      setMessages(prev => prev.map(m => m._id === optimistic._id ? res.data.message : m));
      setMessagesUsed(prev => prev + 1);
      if (!isPremium && messagesUsed + 1 >= FREEMIUM_MSG_LIMIT) setLimitReached(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      if (e.response?.data?.error === 'daily_message_limit') setLimitReached(true);
      else if (e.response?.data?.error === 'message_blocked') setBlocked(true);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const filteredDeals = deals.filter(d =>
    !search ||
    d.influencerId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.campaignId?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const dealStatusColor = (status: string) => {
    if (status === 'completed') return 'from-emerald-500 to-green-600';
    if (status === 'content-submitted') return 'from-blue-500 to-indigo-600';
    if (status === 'cancelled') return 'from-red-500 to-rose-600';
    return 'from-amber-500 to-orange-500';
  };

  const dealStatusLabel = (status: string) => {
    if (status === 'in-progress') return 'Active';
    if (status === 'content-submitted') return 'Review';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col">
      <BrandNav user={user} />

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 60px)' }}>

        {/* ── Thread sidebar ── */}
        <aside className={`
          w-full lg:w-[320px] xl:w-[360px] flex-shrink-0 flex flex-col
          bg-white border-r border-gray-200
          ${showChat ? 'hidden lg:flex' : 'flex'}
        `}>

          {/* Sidebar header */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50/60 to-white flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#3D5087] to-[#5D8A8F]" />
                <h1 className="text-lg font-bold text-gray-900">Messages</h1>
                {deals.length > 0 && (
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    {deals.length}
                  </span>
                )}
              </div>
              {!isPremium && messagesUsed > 0 && (
                <span className="text-[11px] font-semibold px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-sm">
                  {messagesUsed}/{FREEMIUM_MSG_LIMIT} used
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><SearchIcon /></div>
              <input
                type="text"
                placeholder="Search creator or campaign…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D5087]/20 focus:border-[#3D5087] transition-all duration-150"
              />
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <div className="w-6 h-6 border-2 border-[#3D5087] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-400">Loading conversations…</p>
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3D5087] to-[#5D8A8F] text-white flex items-center justify-center mx-auto mb-4 shadow-md">
                  <ChatBubbleIcon size={32} />
                </div>
                <p className="text-sm font-bold text-gray-800 mb-1">No conversations yet</p>
                <p className="text-xs text-gray-400 leading-relaxed max-w-[220px]">
                  {search
                    ? 'No conversations match your search.'
                    : 'Accept an influencer application to start a conversation.'}
                </p>
                {!search && (
                  <Link href="/brand/campaigns"
                    className="mt-5 text-xs font-semibold text-white bg-[#3D5087] hover:bg-[#2B3B68] px-4 py-2 rounded-xl transition-all duration-150 cursor-pointer shadow-sm">
                    View campaigns →
                  </Link>
                )}
              </div>
            ) : (
              <ul className="py-1">
                {filteredDeals.map(deal => {
                  const isActive = selectedDeal?._id === deal._id;
                  const initials = getInitials(deal.influencerId?.name);
                  const color = getAvatarColor(deal.influencerId?.name || '');
                  return (
                    <li key={deal._id}>
                      <button
                        onClick={() => selectDeal(deal)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-150 cursor-pointer border-b border-gray-50 ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-50 to-blue-50/50 border-l-[3px] border-l-[#3D5087]'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between mb-0.5">
                            <span className={`text-[13px] font-bold truncate ${isActive ? 'text-[#2B3B68]' : 'text-gray-900'}`}>
                              {deal.influencerId?.name}
                            </span>
                            {deal.lastMessage && (
                              <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">
                                {formatRelativeTime(deal.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mb-0.5">{deal.campaignId?.title}</p>
                          {deal.lastMessage ? (
                            <p className="text-[11px] text-gray-400 truncate">{deal.lastMessage.content}</p>
                          ) : (
                            <p className="text-[11px] text-gray-300 italic">No messages yet — say hi!</p>
                          )}
                        </div>
                        <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white bg-gradient-to-r ${dealStatusColor(deal.status)}`}>
                          {dealStatusLabel(deal.status)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Freemium nudge */}
          {!isPremium && (
            <div className="border-t border-gray-100 p-3 flex-shrink-0">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#2B3B68] via-[#3D5087] to-[#4a5fa0] rounded-xl p-3 flex items-center gap-2.5">
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />
                <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center flex-shrink-0"><LockIcon /></div>
                <div className="flex-1 min-w-0 relative">
                  <p className="text-[11px] font-bold text-white">Unlimited messages</p>
                  <p className="text-[10px] text-blue-200">Upgrade to Premium</p>
                </div>
                <Link href="/brand/billing"
                  className="text-[11px] font-bold text-[#2B3B68] bg-white hover:bg-gray-50 px-2.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer flex-shrink-0 shadow-sm relative">
                  Upgrade
                </Link>
              </div>
            </div>
          )}
        </aside>

        {/* ── Chat area ── */}
        <section className={`flex-1 flex flex-col min-w-0 ${showChat ? 'flex' : 'hidden lg:flex'}`}>
          {selectedDeal ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 sm:px-5 py-3 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
                <button onClick={goBackToList} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all cursor-pointer flex-shrink-0">
                  <ArrowLeftIcon />
                </button>

                {/* Influencer avatar */}
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${getAvatarColor(selectedDeal.influencerId?.name || '')} flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0`}>
                  {getInitials(selectedDeal.influencerId?.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{selectedDeal.influencerId?.name}</p>
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

                {/* Deal info pills + action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedDeal.influencerProfile?.platforms?.[0] && (
                    <span className="hidden sm:flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded-lg font-medium">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                      {formatFollowers(selectedDeal.influencerProfile.platforms[0].followers)}
                    </span>
                  )}
                  {/* Deal action buttons */}
                  {selectedDeal.status === 'content-submitted' && (
                    <button
                      onClick={handleMarkComplete}
                      disabled={actionLoading}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-150 cursor-pointer disabled:opacity-60 shadow-sm"
                    >
                      {actionLoading ? 'Updating…' : 'Mark Complete'}
                    </button>
                  )}
                  {selectedDeal.status === 'in-progress' && (
                    <button
                      onClick={handleCancelDeal}
                      disabled={actionLoading}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-red-300 text-red-500 hover:bg-red-50 transition-all duration-150 cursor-pointer disabled:opacity-60"
                    >
                      {actionLoading ? 'Cancelling…' : 'Cancel Deal'}
                    </button>
                  )}
                  {selectedDeal.status === 'completed' && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                      Completed ✅
                    </span>
                  )}
                  {selectedDeal.status === 'cancelled' && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-100 text-red-700 border border-red-200">
                      Cancelled
                    </span>
                  )}
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full text-white bg-gradient-to-r ${dealStatusColor(selectedDeal.status)}`}>
                    {dealStatusLabel(selectedDeal.status)}
                  </span>
                </div>
              </div>

              {/* Campaign brief strip */}
              <div className="flex items-center gap-3 px-4 sm:px-5 py-2 bg-indigo-50/60 border-b border-indigo-100/60 flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                <span className="text-indigo-500 flex-shrink-0"><CampaignIcon /></span>
                <span className="text-[11px] text-indigo-700 font-semibold flex-shrink-0">Deliverables:</span>
                <span className="text-[11px] text-indigo-600 flex-shrink-0">{selectedDeal.campaignId?.deliverables || '—'}</span>
                <span className="text-indigo-300 flex-shrink-0">·</span>
                <span className="text-indigo-500 flex-shrink-0"><RupeeIcon /></span>
                <span className="text-[11px] text-indigo-700 font-semibold flex-shrink-0">Price:</span>
                <span className="text-[11px] text-indigo-600 flex-shrink-0 font-medium">
                  {selectedDeal.negotiationStatus === 'agreed'
                    ? `₹${selectedDeal.agreedAmount?.toLocaleString()} (agreed)`
                    : 'Negotiating…'}
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

              {/* Moderation notice */}
              <div className="flex items-center gap-2 px-4 sm:px-5 py-2 bg-slate-50 border-b border-slate-200/40 flex-shrink-0">
                <span className="text-slate-500 flex-shrink-0"><ShieldIcon /></span>
                <p className="text-[11px] text-slate-600 font-medium">
                  Sharing phone numbers, emails, or social handles is automatically blocked to protect both parties.
                </p>
              </div>

              {/* Messages thread */}
              <div
                ref={threadRef}
                className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 flex flex-col gap-3"
                style={{ background: 'linear-gradient(180deg, #F4F6FB 0%, #F8F9FC 100%)' }}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3D5087] to-[#5D8A8F] text-white flex items-center justify-center shadow-md">
                      <ChatBubbleIcon size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-1">Start the conversation</p>
                      <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
                        Kick things off by sharing campaign details or a welcome message with {selectedDeal.influencerId?.name}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
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
                          {!isMine && (
                            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(selectedDeal.influencerId?.name || '')} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                              {getInitials(selectedDeal.influencerId?.name)}
                            </div>
                          )}

                          <div className={`flex flex-col gap-0.5 max-w-[72%] sm:max-w-[60%] ${isMine ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                              isMine
                                ? `bg-gradient-to-br from-[#2B3B68] to-[#3D5087] text-white ${isLast ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl'}`
                                : `bg-white border border-gray-200 text-gray-800 ${isLast ? 'rounded-2xl rounded-bl-sm' : 'rounded-2xl'}`
                            }`}>
                              {msg.content}
                            </div>
                            {isLast && (
                              <div className={`flex items-center gap-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                                <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                                {isMine && <span className="text-[#3D5087]"><CheckDoubleIcon /></span>}
                              </div>
                            )}
                          </div>

                          {isMine && (
                            <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-[#3D5087] to-[#2B3B68] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                              {user?.name?.charAt(0).toUpperCase()}
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
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5"><XIcon /></div>
                  <div>
                    <strong className="block mb-0.5">Message blocked</strong>
                    <span className="text-xs text-red-600">Sharing contact info, social handles, or external links is not allowed on Influence Connect.</span>
                  </div>
                </div>
              )}

              {/* Limit banner */}
              {limitHit && (
                <div className="mx-4 mb-2 flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex-shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0"><LockIcon /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-amber-800">Daily message limit reached</p>
                    <p className="text-xs text-amber-600">Upgrade to Premium for unlimited messaging.</p>
                  </div>
                  <Link href="/brand/billing" className="flex-shrink-0 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-xl transition-all cursor-pointer">Upgrade</Link>
                </div>
              )}

              {/* Compose bar / closed-deal notice */}
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
              ) : (
                <div className="px-4 sm:px-5 py-3.5 bg-white border-t border-gray-200 flex-shrink-0">
                  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl border transition-all duration-150 shadow-sm ${
                    limitHit ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 focus-within:border-[#3D5087] focus-within:ring-2 focus-within:ring-[#3D5087]/20'
                  }`}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={limitHit}
                      placeholder={limitHit ? 'Upgrade to Premium to keep messaging…' : `Message ${selectedDeal.influencerId?.name}…`}
                      className="flex-1 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none disabled:text-gray-400"
                    />
                    {newMessage.length > 200 && (
                      <span className={`text-[11px] font-medium flex-shrink-0 ${newMessage.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
                        {500 - newMessage.length}
                      </span>
                    )}
                    <button
                      onClick={handleSend}
                      disabled={sending || !newMessage.trim() || limitHit}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                        newMessage.trim() && !limitHit
                          ? 'bg-gradient-to-br from-[#3D5087] to-[#2B3B68] hover:from-[#2B3B68] hover:to-[#1e2d52] text-white shadow-sm hover:shadow-md cursor-pointer'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {sending
                        ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        : <SendIcon />}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* No deal selected — desktop placeholder */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#2B3B68] via-[#3D5087] to-[#4a5fa0] text-white flex items-center justify-center mb-5 shadow-lg">
                <ChatBubbleIcon size={40} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Deal conversations</h3>
              <p className="text-sm text-gray-400 max-w-[260px] leading-relaxed mb-6">
                Select a creator from the sidebar to view and continue your conversation.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200">
                <ShieldIcon />
                <span className="font-medium">All messages are moderated for platform safety</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
