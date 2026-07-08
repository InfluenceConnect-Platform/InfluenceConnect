'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useLiveData } from '@/lib/useLiveData';
import OfferPanel, { Offer } from '@/components/shared/OfferPanel';
import PayoutPanel, { Payout } from '@/components/shared/PayoutPanel';
import CampaignBriefDrawer from '@/components/shared/CampaignBriefDrawer';
import InfluencerNav from '@/components/shared/InfluencerNav';
import { useTheme } from '@/lib/useTheme';
import { useToast } from '@/components/shared/Toast';
import { useConfirm } from '@/components/shared/ConfirmModal';
import { ChatAttachment, formatFileSize, downloadUrlFor } from '@/lib/chatAttachments';
import { cdnImg } from '@/lib/img';

interface Message {
  _id: string;
  senderId: string;
  content: string;
  actorContent?: string;
  attachments?: ChatAttachment[];
  createdAt: string;
  blocked?: boolean;
  blockReason?: string;
  system?: boolean;
}

interface Deal {
  _id: string;
  campaignId: { _id: string; title: string; niche: string[]; deliverables?: string; budgetMin: number; budgetMax: number };
  brandId: { _id: string; name: string };
  brandLogoUrl?: string;
  agreedAmount: number;
  status: string;
  negotiationStatus: 'open' | 'agreed';
  offers: Offer[];
  lastMessage?: { content: string; attachments?: ChatAttachment[]; senderId: string; createdAt: string } | null;
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
const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6 3 20 12 6 21 6 3"/>
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

const previewText = (msg?: { content: string; attachments?: ChatAttachment[] } | null) => {
  if (!msg) return '';
  if (msg.content) return msg.content;
  const atts = msg.attachments || [];
  if (!atts.length) return '';
  if (atts.length > 1) return `📎 ${atts.length} files`;
  const t = atts[0].type;
  return t === 'image' ? '📷 Photo' : t === 'video' ? '🎥 Video' : `📎 ${atts[0].fileName || 'File'}`;
};

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
function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark } = useTheme();
  const toast = useToast();
  const confirm = useConfirm();
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
  const [showChat, setShowChat] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [campaignDrawerOpen, setCampaignDrawerOpen] = useState(false);
  const [lightbox, setLightbox] = useState<ChatAttachment | null>(null);
  const [payout, setPayout] = useState<Payout | null>(null);
  // Distinguishes "haven't checked yet" from "confirmed no payout submitted" —
  // without this the composer would flash "locked" for a beat on every deal
  // switch while the payout status is still being fetched.
  const [payoutLoaded, setPayoutLoaded] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);

  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const autoPromptedRef = useRef<Set<string>>(new Set());
  const FREEMIUM_MSG_LIMIT = 10;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    if (JSON.parse(stored).role !== 'influencer') { router.push('/auth/login'); return; }
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
  }, [selectedDealId]);

  // Keep the conversation list fresh (new deals / latest message) without reload.
  useLiveData(() => { fetchDeals(); });

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
    } catch { /* ignore */ }
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
      await api.post(`/api/messages/${selectedDeal._id}`, {
        content: newMessage.trim(),
      });
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
    setPayout(null);
    setPayoutLoaded(false);
    setPayoutModalOpen(false);
    setSelectedDeal(deal);
    setShowChat(true);
    setDeals(prev => prev.map(d => d._id === deal._id ? { ...d, unreadCount: 0 } : d));
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Payout details are required once a price is agreed — surface the modal
  // once per deal selection until the creator has submitted something.
  const handlePayoutStatusChange = (dealId: string, next: Payout | null) => {
    setPayout(next);
    setPayoutLoaded(true);
    if (!next && !autoPromptedRef.current.has(dealId)) {
      autoPromptedRef.current.add(dealId);
      setPayoutModalOpen(true);
    }
  };

  const goBackToList = () => {
    setShowChat(false);
  };

  // Open a specific conversation when navigated with ?deal=<dealId> (e.g. from an accepted invitation).
  useEffect(() => {
    const dealParam = searchParams.get('deal');
    if (!dealParam || deals.length === 0 || selectedDeal) return;
    const match = deals.find(d => d._id === dealParam);
    if (match) selectDeal(match);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals, searchParams]);

  const handleSubmitContent = async () => {
    if (!selectedDeal) return;
    if (!(await confirm({
      title: 'Mark content as submitted?',
      description: 'The brand will be notified to review your content.',
      confirmLabel: 'Mark submitted',
      variant: 'info',
    }))) return;
    setActionLoading(true);
    try {
      await api.put(`/api/influencer/deals/${selectedDeal._id}/status`, { status: 'content-submitted' });
      setSelectedDeal(prev => prev ? { ...prev, status: 'content-submitted' } : prev);
      setDeals(prev => prev.map(d => d._id === selectedDeal._id ? { ...d, status: 'content-submitted' } : d));
      toast.success('Content marked as submitted.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to update status.');
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
  const negotiationPending = !dealClosed && selectedDeal?.negotiationStatus !== 'agreed';
  const payoutMissing = !dealClosed && selectedDeal?.negotiationStatus === 'agreed' && payoutLoaded && !payout;
  const chatLocked = negotiationPending || payoutMissing;

  // The brand's name/avatar opens the campaign brief only while the deal is
  // active — once it's completed or cancelled they stop being clickable.
  const canViewCampaign = !dealClosed && !!selectedDeal?.campaignId?._id;
  const openCampaignDrawer = () => { if (canViewCampaign) setCampaignDrawerOpen(true); };

  return (
    <div className={`h-[100dvh] flex flex-col overflow-hidden ${isDark ? 'bg-[#060D1A]' : 'bg-[#EDF3F4]'}`}>

      <InfluencerNav user={user} profilePicUrl={profilePicUrl} />

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className={`
          w-full lg:w-[320px] xl:w-[360px] flex-shrink-0 flex flex-col border-r
          ${isDark ? 'bg-[#0B1725] border-slate-700/60' : 'bg-white border-gray-200/80'}
          ${showChat ? 'hidden lg:flex' : 'flex'}
        `}>

          {/* Dark navy header */}
          <div className="px-4 pt-4 pb-3 flex-shrink-0"
            style={{ background: 'linear-gradient(145deg, #17353D 0%, #1C4A52 55%, #255E6A 100%)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <h1 className="text-[17px] font-bold text-white tracking-tight">Messages</h1>
                {filteredDeals.length > 0 && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white/70 bg-white/10 border border-white/10">
                    {filteredDeals.length}
                  </span>
                )}
              </div>
              {!isPremium && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 bg-white/10 text-amber-300">
                  {messagesUsed}/{FREEMIUM_MSG_LIMIT} used
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search conversations…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-[13px] text-white placeholder:text-white/35 bg-white/10 border border-white/10 rounded-xl focus:outline-none focus:bg-white/15 focus:border-white/25 transition-all duration-200"
              />
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col gap-1 p-2 pt-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-3 animate-pulse">
                    <div className={`w-12 h-12 rounded-2xl flex-shrink-0 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`} />
                    <div className="flex-1 space-y-2">
                      <div className={`h-3 rounded-full w-3/4 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`} />
                      <div className={`h-2.5 rounded-full w-1/2 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`} />
                      <div className={`h-2 rounded-full w-2/3 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] text-white flex items-center justify-center mb-4 shadow-lg shadow-teal-200/50">
                  <ChatBubbleIcon size={28} />
                </div>
                <p className="text-[14px] font-bold text-gray-800 mb-1.5">No conversations</p>
                <p className="text-[12px] text-gray-400 leading-relaxed max-w-[200px]">
                  {search
                    ? 'No matches found.'
                    : 'Conversations appear once a brand accepts your application.'}
                </p>
                {!search && (
                  <Link href="/influencer/campaigns"
                    className="mt-5 text-[12px] font-semibold text-white bg-gradient-to-r from-[#27717E] to-[#5BA8B5] hover:opacity-90 px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer shadow-md shadow-teal-200/30">
                    Browse campaigns →
                  </Link>
                )}
              </div>
            ) : (
              <ul>
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
                    <li key={deal._id} className={`border-b last:border-0 ${isDark ? 'border-slate-800/80' : 'border-gray-50'}`}>
                      <button
                        onClick={() => selectDeal(deal)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 cursor-pointer relative ${
                          isActive
                            ? isDark ? 'bg-gradient-to-r from-teal-900/30 to-cyan-900/20' : 'bg-gradient-to-r from-teal-50 to-cyan-50/40'
                            : hasActivity
                            ? isDark ? 'bg-teal-900/20 hover:bg-teal-900/30' : 'bg-teal-50/40 hover:bg-teal-50/70'
                            : isDark ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50/80'
                        }`}
                      >
                        {/* Active left bar */}
                        {isActive && (
                          <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-[#27717E]" />
                        )}

                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className={`w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center shadow-sm ${
                            !deal.brandLogoUrl ? `bg-gradient-to-br ${avatarColor}` : 'bg-gray-100'
                          }`}>
                            {deal.brandLogoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img loading="lazy" decoding="async" src={cdnImg(deal.brandLogoUrl)} alt={deal.brandId?.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold text-[13px]">{initials}</span>
                            )}
                          </div>
                          {hasActivity && (
                            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#4CAF7D] border-2 border-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-[13.5px] truncate leading-tight ${
                              isActive
                                ? isDark ? 'font-bold text-teal-300' : 'font-bold text-[#1C4A52]'
                                : hasActivity
                                ? isDark ? 'font-bold text-slate-200' : 'font-bold text-gray-900'
                                : isDark ? 'font-semibold text-slate-300' : 'font-semibold text-gray-700'
                            }`}>
                              {deal.brandId?.name}
                            </span>
                            {lastMsg && (
                              <span className={`text-[10.5px] ml-2 flex-shrink-0 font-medium ${
                                hasActivity ? isDark ? 'text-teal-400' : 'text-teal-600' : isDark ? 'text-slate-500' : 'text-gray-400'
                              }`}>
                                {formatRelativeTime(lastMsg.createdAt)}
                              </span>
                            )}
                          </div>
                          <p className={`text-[11.5px] truncate mb-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{deal.campaignId?.title}</p>
                          {hasPendingOffer && !isActive ? (
                            <p className="text-[11px] text-amber-600 font-semibold truncate">New offer — tap to respond</p>
                          ) : lastMsg ? (
                            <p className={`text-[11px] truncate ${hasUnread && !isActive ? isDark ? 'text-slate-200 font-semibold' : 'text-gray-700 font-semibold' : isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                              {previewText(lastMsg)}
                            </p>
                          ) : (
                            <p className={`text-[11px] italic ${isDark ? 'text-slate-600' : 'text-gray-300'}`}>No messages yet</p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          {hasUnread && !isActive && (
                            <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#27717E] text-white text-[10px] font-bold flex items-center justify-center">
                              {(deal.unreadCount ?? 0) > 9 ? '9+' : deal.unreadCount}
                            </span>
                          )}
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md text-white uppercase tracking-wide ${
                            deal.status === 'completed'
                              ? 'bg-emerald-500'
                              : deal.status === 'active'
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
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

          {/* Freemium upgrade */}
          {!isPremium && (
            <div className="border-t border-gray-100 p-3 flex-shrink-0">
              <div className="relative overflow-hidden rounded-2xl p-3.5 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, #1C4A52 0%, #27717E 60%, #5BA8B5 100%)' }}>
                <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5 pointer-events-none" />
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center flex-shrink-0 relative">
                  <LockIcon />
                </div>
                <div className="flex-1 min-w-0 relative">
                  <p className="text-[12px] font-bold text-white">Unlimited messages</p>
                  <p className="text-[11px] text-teal-200/80">Upgrade to Premium</p>
                </div>
                <Link href="/influencer/billing"
                  className="text-[11px] font-bold text-[#1C4A52] bg-white hover:bg-teal-50 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer flex-shrink-0 shadow-sm relative">
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
              <div className={`flex items-center gap-3 px-4 sm:px-5 py-3 border-b flex-shrink-0 ${isDark ? 'bg-[#0B1725] border-slate-700/60 shadow-[0_1px_4px_rgba(0,0,0,0.3)]' : 'bg-white border-gray-200/80 shadow-sm'}`}>
                <button
                  onClick={goBackToList}
                  className={`lg:hidden w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all duration-150 cursor-pointer flex-shrink-0 ${isDark ? 'text-slate-400 hover:bg-slate-800/60' : 'text-gray-500 hover:bg-gray-100'}`}>
                  <ArrowLeftIcon />
                </button>

                <div
                  onClick={canViewCampaign ? openCampaignDrawer : undefined}
                  role={canViewCampaign ? 'button' : undefined}
                  tabIndex={canViewCampaign ? 0 : undefined}
                  onKeyDown={canViewCampaign ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCampaignDrawer(); } } : undefined}
                  title={canViewCampaign ? 'View campaign brief' : undefined}
                  className={`w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center ${
                  !selectedDeal.brandLogoUrl
                    ? `bg-gradient-to-br ${getAvatarColor(selectedDeal.brandId?.name || '')}`
                    : 'bg-gray-100'
                } ${canViewCampaign ? 'cursor-pointer transition-all duration-150 hover:ring-2 hover:ring-teal-400/60 hover:brightness-95 active:scale-95' : ''}`}>
                  {selectedDeal.brandLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img loading="lazy" decoding="async" src={cdnImg(selectedDeal.brandLogoUrl)} alt={selectedDeal.brandId?.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">{getInitials(selectedDeal.brandId?.name)}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {canViewCampaign ? (
                    <button
                      type="button"
                      onClick={openCampaignDrawer}
                      title="View campaign brief"
                      className={`text-[15px] font-bold leading-tight text-left cursor-pointer hover:underline decoration-2 underline-offset-2 transition-colors ${isDark ? 'text-white hover:text-teal-300' : 'text-gray-900 hover:text-teal-600'}`}
                    >
                      {selectedDeal.brandId?.name}
                    </button>
                  ) : (
                    <p className={`text-[15px] font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedDeal.brandId?.name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className={`text-[11px] truncate ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{selectedDeal.campaignId?.title}</p>
                    {selectedDeal.negotiationStatus === 'agreed' ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60 flex-shrink-0">
                        ₹{selectedDeal.agreedAmount.toLocaleString()} agreed
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60 flex-shrink-0">
                        Negotiating…
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedDeal.status === 'in-progress' && (
                    <button
                      onClick={handleSubmitContent}
                      disabled={actionLoading}
                      className="text-[12px] font-bold px-3.5 py-1.5 rounded-xl bg-[#27717E] hover:bg-[#1C5A65] text-white transition-all duration-150 cursor-pointer disabled:opacity-60 shadow-sm active:scale-95"
                    >
                      {actionLoading ? 'Submitting…' : 'Mark Done'}
                    </button>
                  )}
                  {selectedDeal.status === 'content-submitted' && (
                    <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                      Awaiting Review
                    </span>
                  )}
                  {selectedDeal.status === 'completed' && (
                    <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Completed
                    </span>
                  )}
                  {selectedDeal.status === 'cancelled' && (
                    <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200">
                      Cancelled
                    </span>
                  )}
                </div>
              </div>

              {/* Campaign brief strip */}
              <div className={`flex items-center gap-2.5 px-4 sm:px-5 py-2 border-b flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden ${isDark ? 'bg-teal-900/20 border-teal-800/30' : 'bg-teal-50/70 border-teal-100/70'}`}>
                <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-teal-300' : 'text-teal-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <span className={`text-[11.5px] font-bold flex-shrink-0 ${isDark ? 'text-teal-200' : 'text-teal-900'}`}>Deliverables:</span>
                <span className={`text-[11.5px] font-medium flex-shrink-0 ${isDark ? 'text-teal-200' : 'text-teal-800'}`}>{selectedDeal.campaignId?.deliverables || '—'}</span>
                <span className={`flex-shrink-0 mx-1 ${isDark ? 'text-teal-600' : 'text-teal-400'}`}>·</span>
                <span className={`text-[11.5px] font-bold flex-shrink-0 ${isDark ? 'text-teal-200' : 'text-teal-900'}`}>Budget:</span>
                <span className={`text-[11.5px] flex-shrink-0 font-semibold ${isDark ? 'text-teal-200' : 'text-teal-800'}`}>
                  {selectedDeal.negotiationStatus === 'agreed'
                    ? `₹${selectedDeal.agreedAmount?.toLocaleString('en-IN')} (agreed)`
                    : `₹${selectedDeal.campaignId?.budgetMin?.toLocaleString('en-IN')} – ₹${selectedDeal.campaignId?.budgetMax?.toLocaleString('en-IN')}`}
                </span>
              </div>

              {/* Offer panel */}
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

              {/* Payout status strip — a single compact line instead of a
                  persistent panel, so the chat itself keeps most of the space.
                  Stays visible through completion so payout can still be tracked. */}
              {selectedDeal.negotiationStatus === 'agreed' && selectedDeal.status !== 'cancelled' && (
                <>
                  <div className={`flex items-center justify-between gap-3 px-4 sm:px-5 py-1.5 border-b flex-shrink-0 ${isDark ? 'bg-slate-900/40 border-slate-700/60' : 'bg-gray-50/70 border-gray-200/70'}`}>
                    <span className={`text-[11.5px] font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                      {!payoutLoaded ? '💳 Checking payout status…' : !payout ? '🔒 Payout details required' : payout.paid ? '✅ Payout marked paid' : '💳 Payout details submitted — awaiting payment'}
                    </span>
                    {payoutLoaded && (
                      <button
                        onClick={() => setPayoutModalOpen(true)}
                        className={`flex-shrink-0 text-[11.5px] font-bold px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer ${isDark ? 'text-teal-300 hover:bg-slate-800' : 'text-[#27717E] hover:bg-teal-50'}`}
                      >
                        {!payout ? 'Fill in details' : 'View'}
                      </button>
                    )}
                  </div>
                  <PayoutPanel
                    dealId={selectedDeal._id}
                    role="influencer"
                    open={payoutModalOpen}
                    onClose={() => setPayoutModalOpen(false)}
                    onStatusChange={p => handlePayoutStatusChange(selectedDeal._id, p)}
                  />
                </>
              )}

              {/* Moderation notice */}
              <div className={`flex items-center gap-2 px-4 sm:px-5 py-1.5 border-b flex-shrink-0 ${isDark ? 'bg-teal-900/15 border-teal-800/20' : 'bg-teal-50/50 border-teal-100/40'}`}>
                <span className={`flex-shrink-0 ${isDark ? 'text-teal-300' : 'text-teal-600'}`}><ShieldIcon /></span>
                <p className={`text-[11px] font-medium ${isDark ? 'text-teal-200' : 'text-teal-800'}`}>
                  Contact info, social handles & external links are automatically blocked to protect both parties.
                </p>
              </div>

              {/* Messages thread — dot-grid background */}
              <div
                ref={threadRef}
                className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 flex flex-col"
                style={isDark ? {
                  backgroundColor: '#060D1A',
                  backgroundImage: 'radial-gradient(circle, #1a2e40 1px, transparent 1px)',
                  backgroundSize: '22px 22px',
                } : {
                  backgroundColor: '#EDF3F4',
                  backgroundImage: 'radial-gradient(circle, #B0CACE 1px, transparent 1px)',
                  backgroundSize: '22px 22px',
                }}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#27717E] to-[#5BA8B5] text-white flex items-center justify-center shadow-xl shadow-teal-300/25">
                      <ChatBubbleIcon size={30} />
                    </div>
                    <div>
                      <p className={`text-[15px] font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>Start the conversation</p>
                      <p className={`text-[12px] max-w-[220px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-gray-400/90'}`}>
                        Introduce yourself and discuss campaign details with{' '}
                        <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{selectedDeal.brandId?.name}</span>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Date divider */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex-1 h-px ${isDark ? 'bg-slate-700/40' : 'bg-gray-300/40'}`} />
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${isDark ? 'text-slate-500 bg-slate-800/70' : 'text-gray-400/80 bg-white/70'}`}>
                        Today
                      </span>
                      <div className={`flex-1 h-px ${isDark ? 'bg-slate-700/40' : 'bg-gray-300/40'}`} />
                    </div>

                    {messages.map((msg, idx) => {
                      const isMine = msg.senderId?.toString() === user?.id?.toString();
                      // System notices (e.g. admin removed the campaign) sit centered.
                      // The acting party sees actorContent ("You did X") instead of
                      // the other party's phrasing ("X did Y"), when one is set.
                      if (msg.system) {
                        return (
                          <div key={msg._id} className="flex justify-center my-3">
                            <div className={`max-w-[85%] text-center text-[12px] font-medium px-3.5 py-2 rounded-xl border ${
                              isDark
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                : 'bg-amber-50 text-amber-700 border-amber-200/70'
                            }`}>
                              {isMine && msg.actorContent ? msg.actorContent : msg.content}
                            </div>
                          </div>
                        );
                      }
                      const prevMsg = idx > 0 ? messages[idx - 1] : null;
                      const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
                      const isFirst = !prevMsg || prevMsg.senderId !== msg.senderId;
                      const isLast = !nextMsg || nextMsg.senderId !== msg.senderId;

                      // Bubble shape: tighten corners for grouped messages
                      const bubbleShape = isMine
                        ? isFirst && isLast
                          ? 'rounded-2xl rounded-br-md'
                          : isFirst
                          ? 'rounded-2xl rounded-br-sm'
                          : isLast
                          ? 'rounded-2xl rounded-br-lg'
                          : 'rounded-2xl rounded-r-sm'
                        : isFirst && isLast
                        ? 'rounded-2xl rounded-bl-md'
                        : isFirst
                        ? 'rounded-2xl rounded-bl-sm'
                        : isLast
                        ? 'rounded-2xl rounded-bl-lg'
                        : 'rounded-2xl rounded-l-sm';

                      return (
                        <div
                          key={msg._id}
                          className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} ${isFirst ? 'mt-3' : 'mt-0.5'}`}
                        >
                          {/* Their avatar */}
                          {!isMine && (
                            <div className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center mb-0.5 ${
                              isLast ? 'opacity-100' : 'opacity-0'
                            } ${!selectedDeal.brandLogoUrl ? `bg-gradient-to-br ${getAvatarColor(selectedDeal.brandId?.name || '')}` : 'bg-gray-100'}`}>
                              {selectedDeal.brandLogoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img loading="lazy" decoding="async" src={cdnImg(selectedDeal.brandLogoUrl)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white text-[9px] font-bold">{getInitials(selectedDeal.brandId?.name)}</span>
                              )}
                            </div>
                          )}

                          <div className={`flex flex-col gap-1 max-w-[72%] sm:max-w-[62%] ${isMine ? 'items-end' : 'items-start'}`}>
                            {!!msg.attachments?.length && (
                              <div className="flex flex-col gap-1.5">
                                {msg.attachments.map((att, i) => (
                                  att.type === 'image' ? (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => setLightbox(att)}
                                      className={`block overflow-hidden ${bubbleShape} border cursor-pointer ${isDark ? 'border-slate-700/50' : 'border-gray-200/50'}`}
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img loading="lazy" decoding="async" src={cdnImg(att.url, 480)} alt={att.fileName || 'Photo'} className="max-w-[240px] max-h-[320px] object-cover" />
                                    </button>
                                  ) : att.type === 'video' ? (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => setLightbox(att)}
                                      className={`relative block overflow-hidden ${bubbleShape} border cursor-pointer ${isDark ? 'border-slate-700/50' : 'border-gray-200/50'}`}
                                    >
                                      {att.thumbnailUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img loading="lazy" decoding="async" src={cdnImg(att.thumbnailUrl, 480)} alt="" className="max-w-[240px] max-h-[320px] object-cover" />
                                      ) : (
                                        <div className="w-[200px] h-[140px] bg-black/70" />
                                      )}
                                      <span className="absolute inset-0 flex items-center justify-center text-white bg-black/25">
                                        <PlayIcon />
                                      </span>
                                    </button>
                                  ) : (
                                    <a
                                      key={i}
                                      href={downloadUrlFor(att)}
                                      download={att.fileName || true}
                                      className={`flex items-center gap-2.5 px-3.5 py-2.5 min-w-[180px] cursor-pointer ${bubbleShape} ${
                                        isMine
                                          ? 'bg-[#27717E] text-white'
                                          : isDark
                                          ? 'bg-[#1a2e45] text-slate-200 border border-slate-700/50'
                                          : 'bg-white text-gray-800 border border-gray-200/50'
                                      }`}
                                    >
                                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isMine ? 'bg-white/15' : isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                                        <FileIcon />
                                      </span>
                                      <span className="min-w-0 flex-1 text-left">
                                        <span className="block text-[12.5px] font-semibold truncate">{att.fileName || 'File'}</span>
                                        <span className={`block text-[10.5px] ${isMine ? 'text-white/70' : isDark ? 'text-slate-500' : 'text-gray-400'}`}>{formatFileSize(att.fileSize)}</span>
                                      </span>
                                      <span className={isMine ? 'text-white/80' : isDark ? 'text-slate-400' : 'text-gray-400'}><DownloadIcon /></span>
                                    </a>
                                  )
                                ))}
                              </div>
                            )}
                            {!!msg.content && (
                              <div className={`px-4 py-2.5 text-[13.5px] leading-relaxed select-text ${bubbleShape} ${
                                isMine
                                  ? 'bg-[#27717E] text-white shadow-md shadow-teal-900/10'
                                  : isDark
                                  ? 'bg-[#1a2e45] text-slate-200 border border-slate-700/50 shadow-sm'
                                  : 'bg-white text-gray-800 border border-gray-200/50 shadow-sm'
                              }`}>
                                {msg.content}
                              </div>
                            )}
                            {isLast && (
                              <div className={`flex items-center gap-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                                <span className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-gray-400/70'}`}>{formatTime(msg.createdAt)}</span>
                                {isMine && <span className="text-[#7FA8AD]"><CheckDoubleIcon /></span>}
                              </div>
                            )}
                          </div>

                          {/* My avatar */}
                          {isMine && (
                            <div className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center mb-0.5 ${
                              isLast ? 'opacity-100' : 'opacity-0'
                            } bg-gradient-to-br from-[#FDE5DC] to-[#f5c4b0]`}>
                              {profilePicUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img loading="lazy" decoding="async" src={cdnImg(profilePicUrl)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[#9C4A33] text-[9px] font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
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
                <div className="mx-4 mb-2 flex items-start gap-3 p-3.5 bg-red-50 border border-red-200/80 rounded-2xl flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-red-500">
                    <XIcon />
                  </div>
                  <div>
                    <strong className="block text-[13px] font-bold text-red-700 mb-0.5">Message blocked</strong>
                    <span className="text-[11.5px] text-red-500">Sharing contact info, social handles, or external links is not allowed.</span>
                  </div>
                </div>
              )}

              {/* Limit banner */}
              {limitReached && (
                <div className="mx-4 mb-2 flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <LockIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-amber-800">Message limit reached</p>
                    <p className="text-[11px] text-amber-600">Upgrade to Premium for unlimited messaging.</p>
                  </div>
                  <Link href="/influencer/billing"
                    className="flex-shrink-0 text-[12px] font-bold text-white bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95">
                    Upgrade
                  </Link>
                </div>
              )}

              {/* Compose / closed / locked */}
              {dealClosed ? (
                <div className={`px-4 sm:px-5 py-4 border-t flex-shrink-0 ${isDark ? 'bg-[#0B1725] border-slate-700/60' : 'bg-white border-gray-200/80'}`}>
                  <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl ${
                    selectedDeal.status === 'completed'
                      ? 'bg-emerald-50 border border-emerald-200/60'
                      : 'bg-red-50 border border-red-200/60'
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
                    <p className={`text-[13px] font-medium ${selectedDeal.status === 'completed' ? 'text-emerald-700' : 'text-red-600'}`}>
                      {selectedDeal.status === 'completed'
                        ? 'Deal complete — messaging closed. Chat history is preserved.'
                        : 'Deal cancelled — messaging disabled.'}
                    </p>
                  </div>
                </div>
              ) : chatLocked ? (
                <div className={`px-4 sm:px-5 py-4 border-t flex-shrink-0 ${isDark ? 'bg-[#0B1725] border-slate-700/60' : 'bg-white border-gray-200/80'}`}>
                  <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-gray-50 border-gray-200/60'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-slate-700/50 text-slate-500' : 'bg-gray-100 text-gray-400'}`}>
                      <LockIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12.5px] font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Chat locked</p>
                      <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        {payoutMissing ? 'Submit your payout details to unlock messaging.' : 'Agree on a price above to unlock messaging.'}
                      </p>
                    </div>
                    {payoutMissing ? (
                      <button
                        onClick={() => setPayoutModalOpen(true)}
                        className="flex-shrink-0 text-[12px] font-bold text-white px-3.5 py-2 rounded-xl transition-all duration-150 cursor-pointer shadow-sm bg-[#27717E] hover:bg-[#1C5A65]"
                      >
                        Fill in details
                      </button>
                    ) : (
                      <div className={`hidden sm:block px-3 py-2 border rounded-xl opacity-40 cursor-not-allowed w-[140px] flex-shrink-0 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                        <span className={`text-[12px] truncate block ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Type a message…</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`px-4 sm:px-5 py-3.5 border-t flex-shrink-0 ${isDark ? 'bg-[#0B1725] border-slate-700/60' : 'bg-white border-gray-200/80'}`}>
                  <div className={`flex items-center gap-2.5 px-2 py-2 rounded-2xl border transition-all duration-200 ${
                    limitReached
                      ? isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-gray-50 border-gray-200'
                      : isDark
                      ? 'bg-slate-800/40 border-slate-700 focus-within:border-[#27717E] focus-within:shadow-lg focus-within:shadow-teal-900/30 focus-within:ring-2 focus-within:ring-[#27717E]/20'
                      : 'bg-white border-gray-200 focus-within:border-[#27717E] focus-within:shadow-lg focus-within:shadow-teal-100/40 focus-within:ring-2 focus-within:ring-[#27717E]/10'
                  }`}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={limitReached}
                      placeholder={limitReached ? 'Upgrade to keep messaging…' : 'Message…'}
                      className={`flex-1 px-2 py-1.5 text-[13.5px] bg-transparent outline-none ${isDark ? 'text-slate-200 placeholder:text-slate-600 disabled:text-slate-600' : 'text-gray-900 placeholder:text-gray-400 disabled:text-gray-400'}`}
                    />
                    {newMessage.length > 200 && (
                      <span className={`text-[11px] font-semibold self-center flex-shrink-0 ${newMessage.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
                        {500 - newMessage.length}
                      </span>
                    )}
                    <button
                      onClick={handleSend}
                      disabled={sending || !newMessage.trim() || limitReached}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                        newMessage.trim() && !limitReached
                          ? 'bg-[#27717E] hover:bg-[#1C5A65] text-white shadow-sm hover:shadow-md active:scale-95 cursor-pointer'
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
            <div
              className="flex-1 flex flex-col items-center justify-center text-center px-6"
              style={isDark ? {
                backgroundColor: '#060D1A',
                backgroundImage: 'radial-gradient(circle, #1a2e40 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              } : {
                backgroundColor: '#EDF3F4',
                backgroundImage: 'radial-gradient(circle, #B0CACE 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
            >
              <div className={`backdrop-blur-sm rounded-3xl p-10 flex flex-col items-center shadow-xl border ${isDark ? 'bg-[#0E1B2E]/90 border-slate-700/50 shadow-slate-900/50' : 'bg-white/80 border-white/70 shadow-teal-100/30'}`}>
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#17353D] via-[#27717E] to-[#5BA8B5] text-white flex items-center justify-center mb-5 shadow-xl shadow-teal-400/20">
                  <ChatBubbleIcon size={38} />
                </div>
                <h3 className={`text-[17px] font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>Your messages</h3>
                <p className={`text-[13px] max-w-[250px] leading-relaxed mb-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  Select a conversation from the sidebar to start chatting with a brand.
                </p>
                <div className={`flex items-center gap-2 text-[11.5px] px-4 py-2.5 rounded-xl border ${isDark ? 'text-teal-300 bg-teal-900/20 border-teal-800/30' : 'text-teal-700 bg-teal-50 border-teal-200/50'}`}>
                  <ShieldIcon />
                  <span className="font-semibold">End-to-end moderated for your safety</span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <CampaignBriefDrawer
        open={campaignDrawerOpen}
        campaign={selectedDeal?.campaignId ?? null}
        brandName={selectedDeal?.brandId?.name}
        brandLogoUrl={selectedDeal?.brandLogoUrl}
        agreedAmount={selectedDeal?.agreedAmount}
        negotiationStatus={selectedDeal?.negotiationStatus}
        isDark={isDark}
        onClose={() => setCampaignDrawerOpen(false)}
      />

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <a
            href={downloadUrlFor(lightbox)}
            download={lightbox.fileName || true}
            onClick={e => e.stopPropagation()}
            title="Download"
            className="absolute top-4 right-16 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
          >
            <DownloadIcon />
          </a>
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
          >
            <XIcon />
          </button>
          {lightbox.type === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img decoding="async" src={cdnImg(lightbox.url, 1600)} alt="" className="max-w-full max-h-full rounded-lg object-contain" onClick={e => e.stopPropagation()} />
          ) : (
            <video src={lightbox.url} controls autoPlay className="max-w-full max-h-full rounded-lg" onClick={e => e.stopPropagation()} />
          )}
        </div>
      )}
    </div>
  );
}

// useSearchParams() must be wrapped in Suspense for production builds
export default function MessagesPageWrapper() {
  return (
    <Suspense fallback={null}>
      <MessagesPage />
    </Suspense>
  );
}
