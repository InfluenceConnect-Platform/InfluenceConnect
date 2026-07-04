'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useLiveData } from '@/lib/useLiveData';
import BrandNav from '@/components/shared/BrandNav';
import IdChip from '@/components/shared/IdChip';
import OfferPanel, { Offer } from '@/components/shared/OfferPanel';
import PayoutPanel, { Payout } from '@/components/shared/PayoutPanel';
import { useTheme } from '@/lib/useTheme';
import { useToast } from '@/components/shared/Toast';
import { useConfirm } from '@/components/shared/ConfirmModal';
import { ChatAttachment, validateChatFile, uploadChatAttachment, formatFileSize, downloadUrlFor, MAX_ATTACHMENTS_PER_MESSAGE } from '@/lib/chatAttachments';

interface Message {
  _id: string;
  senderId: string;
  content: string;
  actorContent?: string;
  attachments?: ChatAttachment[];
  createdAt: string;
  blocked?: boolean;
  system?: boolean;
}

interface Deal {
  _id: string;
  customId?: string;
  campaignId: { _id: string; title: string; niche: string[]; deliverables: string; budgetMin: number; budgetMax: number };
  influencerId: { _id: string; name: string };
  influencerProfile?: { niche: string[]; city: string; platforms: { name: string; followers: number }[]; profilePicUrl?: string; slug?: string };
  agreedAmount: number;
  status: string;
  negotiationStatus: 'open' | 'agreed';
  offers: Offer[];
  lastMessage?: { content: string; attachments?: ChatAttachment[]; senderId: string; createdAt: string } | null;
  unreadCount?: number;
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
function previewText(msg?: { content: string; attachments?: ChatAttachment[] } | null) {
  if (!msg) return '';
  if (msg.content) return msg.content;
  const atts = msg.attachments || [];
  if (!atts.length) return '';
  if (atts.length > 1) return `📎 ${atts.length} files`;
  const t = atts[0].type;
  return t === 'image' ? '📷 Photo' : t === 'video' ? '🎥 Video' : `📎 ${atts[0].fileName || 'File'}`;
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
const PaperclipIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
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

function BrandMessages() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Initialize to null so server and first client render match (avoids hydration
  // mismatch); the effect below hydrates it from localStorage after mount.
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
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState('');
  const [lightbox, setLightbox] = useState<ChatAttachment | null>(null);
  const [payout, setPayout] = useState<Payout | null>(null);
  // Distinguishes "haven't checked yet" from "confirmed no payout submitted" —
  // without this the composer would flash "locked" for a beat on every deal
  // switch while the payout status is still being fetched.
  const [payoutLoaded, setPayoutLoaded] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);

  const handlePayoutStatusChange = (next: Payout | null) => {
    setPayout(next);
    setPayoutLoaded(true);
  };

  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeIdRef = useRef<string | null>(null);

  const { isDark } = useTheme();
  const toast = useToast();
  const confirm = useConfirm();
  const isPremium = user?.plan === 'premium';
  const limitHit = !isPremium && messagesUsed >= FREEMIUM_MSG_LIMIT;
  const dealClosed = selectedDeal?.status === 'completed' || selectedDeal?.status === 'cancelled';
  const negotiationPending = !dealClosed && selectedDeal?.negotiationStatus !== 'agreed';
  const payoutMissing = !dealClosed && selectedDeal?.negotiationStatus === 'agreed' && payoutLoaded && !payout;
  const chatLocked = negotiationPending || payoutMissing;

  // The brand can open the influencer's profile only while the deal is active —
  // once it's completed or cancelled the name/avatar stop being clickable.
  const canVisitProfile = !dealClosed && !!selectedDeal?.influencerProfile?.slug;

  const handleVisitProfile = async () => {
    const slug = selectedDeal?.influencerProfile?.slug;
    if (!canVisitProfile || !slug) return;
    if (!(await confirm({
      title: `Visit ${selectedDeal?.influencerId?.name || 'this creator'}'s profile?`,
      description: 'Their full creator profile will open in a new tab.',
      confirmLabel: 'Visit profile',
      variant: 'info',
    }))) return;
    window.open(`/brand/creator/${slug}`, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    if (JSON.parse(stored).role !== 'brand') { router.push('/auth/login'); return; }
    if (!user) setUser(JSON.parse(stored));
    fetchDeals();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [router]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
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
  }, [selectedDealId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the conversation list fresh (new deals / latest message) without reload.
  useLiveData(() => { fetchDeals(); });

  const fetchDeals = async () => {
    try {
      const res = await api.get('/api/brand/deals');
      const loaded: Deal[] = res.data.deals || [];
      setDeals(loaded);
    } catch (err) {
      console.error('Fetch deals error:', err);
    } finally {
      setLoading(false);
    }
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

  const fetchMessages = useCallback(async (dealId: string) => {
    try {
      const res = await api.get(`/api/messages/${dealId}`);
      if (activeIdRef.current !== dealId) return;
      const msgs: Message[] = res.data.messages || [];
      setMessages(msgs);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const usedToday = msgs.filter(m =>
        m.senderId?.toString() === user?.id?.toString() && new Date(m.createdAt) >= today
      ).length;
      setMessagesUsed(usedToday);
    } catch { /* ignore */ }
  }, [user?.id]);

  const selectDeal = (deal: Deal) => {
    activeIdRef.current = deal._id;
    setMessages([]);
    setNewMessage('');
    setBlocked(false);
    setPendingAttachments([]);
    setAttachmentError('');
    setPayout(null);
    setPayoutLoaded(false);
    setPayoutModalOpen(false);
    setSelectedDeal(deal);
    setShowChat(true);
    setDeals(prev => prev.map(d => d._id === deal._id ? { ...d, unreadCount: 0 } : d));
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Open a specific conversation when navigated with ?deal=<dealId> (exact) or
  // ?influencerId=<id> (fallback) — e.g. from an accepted invitation's "Message" button.
  useEffect(() => {
    if (deals.length === 0 || selectedDeal) return;
    const dealParam = searchParams.get('deal');
    const influencerParam = searchParams.get('influencerId');
    if (!dealParam && !influencerParam) return;
    const match = dealParam
      ? deals.find(d => d._id === dealParam)
      : deals.find(d => d.influencerId?._id === influencerParam);
    if (match) selectDeal(match);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals, searchParams]);

  const goBackToList = () => {
    setShowChat(false);
    setSelectedDeal(null);
  };

  const handleMarkComplete = async () => {
    if (!selectedDeal) return;
    if (!(await confirm({
      title: 'Mark deal as complete?',
      description: 'This marks the collaboration as finished and cannot be undone.',
      confirmLabel: 'Mark complete',
      variant: 'info',
    }))) return;
    setActionLoading(true);
    try {
      await api.put(`/api/brand/deals/${selectedDeal._id}/status`, { status: 'completed' });
      setSelectedDeal(prev => prev ? { ...prev, status: 'completed' } : prev);
      setDeals(prev => prev.map(d => d._id === selectedDeal._id ? { ...d, status: 'completed' } : d));
      toast.success('Deal marked as complete.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to update.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelDeal = async () => {
    if (!selectedDeal) return;
    if (!(await confirm({
      title: 'Cancel this deal?',
      description: 'The campaign will be reopened for new applications.',
      confirmLabel: 'Cancel deal',
      cancelLabel: 'Keep deal',
      variant: 'danger',
    }))) return;
    setActionLoading(true);
    try {
      await api.put(`/api/brand/deals/${selectedDeal._id}/status`, { status: 'cancelled' });
      setSelectedDeal(prev => prev ? { ...prev, status: 'cancelled' } : prev);
      setDeals(prev => prev.map(d => d._id === selectedDeal._id ? { ...d, status: 'cancelled' } : d));
      toast.success('Deal cancelled.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to cancel.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && pendingAttachments.length === 0) || !selectedDeal || limitHit || dealClosed || chatLocked || uploadingAttachments) return;
    if (BLOCKED_PATTERN.test(newMessage)) {
      setBlocked(true);
      setTimeout(() => setBlocked(false), 4000);
      return;
    }
    setSending(true);
    const attachmentsToSend = pendingAttachments;
    const optimistic: Message = {
      _id: `tmp-${Date.now()}`,
      senderId: user?.id || '',
      content: newMessage.trim(),
      attachments: attachmentsToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setNewMessage('');
    setPendingAttachments([]);
    try {
      const res = await api.post(`/api/messages/${selectedDeal._id}`, { content: optimistic.content, attachments: attachmentsToSend });
      setMessages(prev => prev.map(m => m._id === optimistic._id ? res.data.message : m));
      setMessagesUsed(prev => prev + 1);
      if (!isPremium && messagesUsed + 1 >= FREEMIUM_MSG_LIMIT) setLimitReached(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      setPendingAttachments(attachmentsToSend);
      if (e.response?.data?.error === 'daily_message_limit') setLimitReached(true);
      else if (e.response?.data?.error === 'message_blocked') setBlocked(true);
    } finally {
      setSending(false);
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedDeal) return;
    if (pendingAttachments.length + files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      setAttachmentError(`You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`);
      return;
    }
    setAttachmentError('');
    setUploadingAttachments(true);
    try {
      for (const file of Array.from(files)) {
        const validationError = validateChatFile(file);
        if (validationError) { setAttachmentError(validationError); continue; }
        try {
          const uploaded = await uploadChatAttachment(file, selectedDeal._id);
          setPendingAttachments(prev => [...prev, uploaded]);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : `Failed to upload "${file.name}".`;
          setAttachmentError(message);
        }
      }
    } finally {
      setUploadingAttachments(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
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
    if (status === 'completed') return 'bg-emerald-500';
    if (status === 'content-submitted') return 'bg-blue-500';
    if (status === 'cancelled') return 'bg-red-500';
    return 'bg-amber-500';
  };

  const dealStatusLabel = (status: string) => {
    if (status === 'in-progress') return 'Active';
    if (status === 'content-submitted') return 'Review';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#060D1A]' : 'bg-[#ECEEF6]'}`}>
      <BrandNav user={user} />

      <div className="flex flex-1 min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 60px)' }}>

        {/* ── Sidebar ── */}
        <aside className={`
          w-full lg:w-[320px] xl:w-[360px] flex-shrink-0 flex flex-col border-r
          ${isDark ? 'bg-[#0B1725] border-slate-700/60' : 'bg-white border-gray-200/80'}
          ${showChat ? 'hidden lg:flex' : 'flex'}
        `}>

          {/* Dark navy header */}
          <div className="px-4 pt-4 pb-3 flex-shrink-0"
            style={{ background: 'linear-gradient(145deg, #161F3F 0%, #2B3B68 55%, #394E86 100%)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <h1 className="text-[17px] font-bold text-white tracking-tight">Messages</h1>
                {filteredDeals.length > 0 && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white/70 bg-white/10 border border-white/10">
                    {filteredDeals.length}
                  </span>
                )}
              </div>
              {!isPremium && messagesUsed > 0 && (
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
                placeholder="Search creator or campaign…"
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3D5087] to-[#2B3B68] text-white flex items-center justify-center mb-4 shadow-lg shadow-indigo-200/50">
                  <ChatBubbleIcon size={28} />
                </div>
                <p className={`text-[14px] font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>No conversations</p>
                <p className={`text-[12px] leading-relaxed max-w-[200px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  {search
                    ? 'No matches found.'
                    : 'Accept an influencer application to start a conversation.'}
                </p>
                {!search && (
                  <Link href="/brand/campaigns"
                    className="mt-5 text-[12px] font-semibold text-white bg-gradient-to-r from-[#3D5087] to-[#2B3B68] hover:opacity-90 px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer shadow-md shadow-indigo-200/30">
                    View campaigns →
                  </Link>
                )}
              </div>
            ) : (
              <ul>
                {filteredDeals.map(deal => {
                  const isActive = selectedDeal?._id === deal._id;
                  const initials = getInitials(deal.influencerId?.name);
                  const color = getAvatarColor(deal.influencerId?.name || '');
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
                            ? isDark ? 'bg-gradient-to-r from-indigo-900/30 to-blue-900/20' : 'bg-gradient-to-r from-indigo-50 to-blue-50/40'
                            : hasActivity
                            ? isDark ? 'bg-indigo-900/20 hover:bg-indigo-900/30' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
                            : isDark ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50/80'
                        }`}
                      >
                        {/* Active left bar */}
                        {isActive && (
                          <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-[#3D5087]" />
                        )}

                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className={`w-12 h-12 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center ${
                            !deal.influencerProfile?.profilePicUrl ? `bg-gradient-to-br ${color}` : 'bg-gray-100'
                          }`}>
                            {deal.influencerProfile?.profilePicUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={deal.influencerProfile.profilePicUrl} alt={deal.influencerId?.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold text-[13px]">{initials}</span>
                            )}
                          </div>
                          {hasActivity && (
                            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#818CF8] border-2 border-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-[13.5px] truncate leading-tight ${
                              isActive
                                ? isDark ? 'font-bold text-indigo-300' : 'font-bold text-[#2B3B68]'
                                : hasActivity
                                ? isDark ? 'font-bold text-slate-200' : 'font-bold text-gray-900'
                                : isDark ? 'font-semibold text-slate-300' : 'font-semibold text-gray-700'
                            }`}>
                              {deal.influencerId?.name}
                            </span>
                            {deal.lastMessage && (
                              <span className={`text-[10.5px] ml-2 flex-shrink-0 font-medium ${
                                hasActivity ? isDark ? 'text-indigo-400' : 'text-indigo-600' : isDark ? 'text-slate-500' : 'text-gray-400'
                              }`}>
                                {formatRelativeTime(deal.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <p className={`text-[11.5px] truncate mb-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{deal.campaignId?.title}</p>
                          {hasPendingOffer && !isActive ? (
                            <p className="text-[11px] text-amber-600 font-semibold truncate">New offer — tap to respond</p>
                          ) : deal.lastMessage ? (
                            <p className={`text-[11px] truncate ${hasUnread && !isActive ? isDark ? 'text-slate-200 font-semibold' : 'text-gray-700 font-semibold' : isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                              {previewText(deal.lastMessage)}
                            </p>
                          ) : (
                            <p className={`text-[11px] italic ${isDark ? 'text-slate-600' : 'text-gray-300'}`}>No messages yet — say hi!</p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          {hasUnread && !isActive && (
                            <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#3D5087] text-white text-[10px] font-bold flex items-center justify-center">
                              {(deal.unreadCount ?? 0) > 9 ? '9+' : deal.unreadCount}
                            </span>
                          )}
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md text-white uppercase tracking-wide ${dealStatusColor(deal.status)}`}>
                            {dealStatusLabel(deal.status)}
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
            <div className={`border-t p-3 flex-shrink-0 ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
              <div className="relative overflow-hidden rounded-2xl p-3.5 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, #2B3B68 0%, #3D5087 60%, #4a5fa0 100%)' }}>
                <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5 pointer-events-none" />
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center flex-shrink-0 relative">
                  <LockIcon />
                </div>
                <div className="flex-1 min-w-0 relative">
                  <p className="text-[12px] font-bold text-white">Unlimited messages</p>
                  <p className="text-[11px] text-indigo-200/80">Upgrade to Premium</p>
                </div>
                <Link href="/brand/billing"
                  className="text-[11px] font-bold text-[#2B3B68] bg-white hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer flex-shrink-0 shadow-sm relative">
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
                  onClick={canVisitProfile ? handleVisitProfile : undefined}
                  role={canVisitProfile ? 'button' : undefined}
                  tabIndex={canVisitProfile ? 0 : undefined}
                  onKeyDown={canVisitProfile ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleVisitProfile(); } } : undefined}
                  title={canVisitProfile ? `Visit ${selectedDeal.influencerId?.name}'s profile` : undefined}
                  className={`w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center ${
                  !selectedDeal.influencerProfile?.profilePicUrl
                    ? `bg-gradient-to-br ${getAvatarColor(selectedDeal.influencerId?.name || '')}`
                    : 'bg-gray-100'
                } ${canVisitProfile ? 'cursor-pointer transition-all duration-150 hover:ring-2 hover:ring-indigo-400/60 hover:brightness-95 active:scale-95' : ''}`}>
                  {selectedDeal.influencerProfile?.profilePicUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedDeal.influencerProfile.profilePicUrl} alt={selectedDeal.influencerId?.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">{getInitials(selectedDeal.influencerId?.name)}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {canVisitProfile ? (
                    <button
                      type="button"
                      onClick={handleVisitProfile}
                      title={`Visit ${selectedDeal.influencerId?.name}'s profile`}
                      className={`text-[15px] font-bold leading-tight text-left cursor-pointer hover:underline decoration-2 underline-offset-2 transition-colors ${isDark ? 'text-white hover:text-indigo-300' : 'text-gray-900 hover:text-indigo-600'}`}
                    >
                      {selectedDeal.influencerId?.name}
                    </button>
                  ) : (
                    <p className={`text-[15px] font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedDeal.influencerId?.name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className={`text-[11px] truncate ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{selectedDeal.campaignId?.title}</p>
                    {selectedDeal.customId && <IdChip id={selectedDeal.customId} size="xs" tone={isDark ? 'dark' : 'subtle'} />}
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
                  {selectedDeal.influencerProfile?.platforms?.[0] && (
                    <span className={`hidden sm:flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-medium ${isDark ? 'text-slate-400 bg-slate-800/60' : 'text-gray-500 bg-gray-100'}`}>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                      {formatFollowers(selectedDeal.influencerProfile.platforms[0].followers)}
                    </span>
                  )}
                  {selectedDeal.status === 'content-submitted' && (
                    payout?.paid ? (
                      <button
                        onClick={handleMarkComplete}
                        disabled={actionLoading}
                        className="text-[12px] font-bold px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-150 cursor-pointer disabled:opacity-60 shadow-sm active:scale-95"
                      >
                        {actionLoading ? 'Updating…' : 'Mark Complete'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setPayoutModalOpen(true)}
                        className="text-[12px] font-bold px-3.5 py-1.5 rounded-xl bg-[#3D5087] hover:bg-[#2B3B68] text-white transition-all duration-150 cursor-pointer shadow-sm active:scale-95"
                      >
                        Pay to complete
                      </button>
                    )
                  )}
                  {selectedDeal.status === 'in-progress' && (
                    <button
                      onClick={handleCancelDeal}
                      disabled={actionLoading}
                      className="text-[12px] font-semibold px-3.5 py-1.5 rounded-xl border border-red-300 text-red-500 hover:bg-red-50 transition-all duration-150 cursor-pointer disabled:opacity-60 active:scale-95"
                    >
                      {actionLoading ? 'Cancelling…' : 'Cancel Deal'}
                    </button>
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
              <div className={`flex items-center gap-2.5 px-4 sm:px-5 py-2 border-b flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden ${isDark ? 'bg-indigo-900/20 border-indigo-800/30' : 'bg-indigo-50/70 border-indigo-100/70'}`}>
                <span className={`flex-shrink-0 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}><CampaignIcon /></span>
                <span className={`text-[11.5px] font-bold flex-shrink-0 ${isDark ? 'text-indigo-200' : 'text-indigo-900'}`}>Deliverables:</span>
                <span className={`text-[11.5px] font-medium flex-shrink-0 ${isDark ? 'text-indigo-200' : 'text-indigo-800'}`}>{selectedDeal.campaignId?.deliverables || '—'}</span>
                <span className={`flex-shrink-0 mx-1 ${isDark ? 'text-indigo-600' : 'text-indigo-400'}`}>·</span>
                <span className={`flex-shrink-0 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}><RupeeIcon /></span>
                <span className={`text-[11.5px] font-bold flex-shrink-0 ${isDark ? 'text-indigo-200' : 'text-indigo-900'}`}>Price:</span>
                <span className={`text-[11.5px] flex-shrink-0 font-semibold ${isDark ? 'text-indigo-200' : 'text-indigo-800'}`}>
                  {selectedDeal.negotiationStatus === 'agreed'
                    ? `₹${selectedDeal.agreedAmount?.toLocaleString()} (agreed)`
                    : 'Negotiating…'}
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
                      {!payoutLoaded ? '💳 Checking payout status…' : !payout ? '💳 Waiting for creator to submit payout details' : payout.paid ? '✅ Payout marked paid' : '💳 Payout details submitted'}
                    </span>
                    {payoutLoaded && payout && (
                      <button
                        onClick={() => setPayoutModalOpen(true)}
                        className={`flex-shrink-0 text-[11.5px] font-bold px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer ${isDark ? 'text-indigo-300 hover:bg-slate-800' : 'text-[#3D5087] hover:bg-indigo-50'}`}
                      >
                        View
                      </button>
                    )}
                  </div>
                  <PayoutPanel
                    dealId={selectedDeal._id}
                    role="brand"
                    accentColor="#3D5087"
                    open={payoutModalOpen}
                    onClose={() => setPayoutModalOpen(false)}
                    onStatusChange={handlePayoutStatusChange}
                    canMarkPaid={selectedDeal.status === 'content-submitted'}
                  />
                </>
              )}

              {/* Moderation notice */}
              <div className={`flex items-center gap-2 px-4 sm:px-5 py-1.5 border-b flex-shrink-0 ${isDark ? 'bg-indigo-900/15 border-indigo-800/20' : 'bg-indigo-50/50 border-indigo-100/40'}`}>
                <span className={`flex-shrink-0 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}><ShieldIcon /></span>
                <p className={`text-[11px] font-medium ${isDark ? 'text-indigo-200' : 'text-indigo-800'}`}>
                  Contact info, social handles & external links are automatically blocked to protect both parties.
                </p>
              </div>

              {/* Messages thread — dot-grid background */}
              <div
                ref={threadRef}
                className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 flex flex-col"
                style={isDark ? {
                  backgroundColor: '#060D1A',
                  backgroundImage: 'radial-gradient(circle, #1a2040 1px, transparent 1px)',
                  backgroundSize: '22px 22px',
                } : {
                  backgroundColor: '#ECEEF6',
                  backgroundImage: 'radial-gradient(circle, #B4BBDA 1px, transparent 1px)',
                  backgroundSize: '22px 22px',
                }}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#3D5087] to-[#4a5fa0] text-white flex items-center justify-center shadow-xl shadow-indigo-300/25">
                      <ChatBubbleIcon size={30} />
                    </div>
                    <div>
                      <p className={`text-[15px] font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>Start the conversation</p>
                      <p className={`text-[12px] max-w-[220px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-gray-400/90'}`}>
                        Kick things off by sharing campaign details or a welcome message with{' '}
                        <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{selectedDeal.influencerId?.name}</span>.
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

                      const bubbleShape = isMine
                        ? isFirst && isLast ? 'rounded-2xl rounded-br-md'
                          : isFirst ? 'rounded-2xl rounded-br-sm'
                          : isLast ? 'rounded-2xl rounded-br-lg'
                          : 'rounded-2xl rounded-r-sm'
                        : isFirst && isLast ? 'rounded-2xl rounded-bl-md'
                          : isFirst ? 'rounded-2xl rounded-bl-sm'
                          : isLast ? 'rounded-2xl rounded-bl-lg'
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
                            } ${!selectedDeal.influencerProfile?.profilePicUrl ? `bg-gradient-to-br ${getAvatarColor(selectedDeal.influencerId?.name || '')}` : 'bg-gray-100'}`}>
                              {selectedDeal.influencerProfile?.profilePicUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={selectedDeal.influencerProfile.profilePicUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white text-[9px] font-bold">{getInitials(selectedDeal.influencerId?.name)}</span>
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
                                      <img src={att.url} alt={att.fileName || 'Photo'} className="max-w-[240px] max-h-[320px] object-cover" />
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
                                        <img src={att.thumbnailUrl} alt="" className="max-w-[240px] max-h-[320px] object-cover" />
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
                                          ? 'bg-[#3D5087] text-white'
                                          : isDark
                                          ? 'bg-[#1a2a45] text-slate-200 border border-slate-700/50'
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
                                  ? 'bg-[#3D5087] text-white shadow-md shadow-indigo-900/10'
                                  : isDark
                                  ? 'bg-[#1a2a45] text-slate-200 border border-slate-700/50 shadow-sm'
                                  : 'bg-white text-gray-800 border border-gray-200/50 shadow-sm'
                              }`}>
                                {msg.content}
                              </div>
                            )}
                            {isLast && (
                              <div className={`flex items-center gap-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                                <span className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-gray-400/70'}`}>{formatTime(msg.createdAt)}</span>
                                {isMine && <span className="text-[#6B7FC4]"><CheckDoubleIcon /></span>}
                              </div>
                            )}
                          </div>

                          {/* My avatar */}
                          {isMine && (
                            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mb-0.5 bg-gradient-to-br from-[#3D5087] to-[#2B3B68] text-white text-[9px] font-bold ${
                              isLast ? 'opacity-100' : 'opacity-0'
                            }`}>
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
              {limitHit && (
                <div className="mx-4 mb-2 flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <LockIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-amber-800">Message limit reached</p>
                    <p className="text-[11px] text-amber-600">Upgrade to Premium for unlimited messaging.</p>
                  </div>
                  <Link href="/brand/billing"
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
                        {payoutMissing ? 'Waiting for the creator to submit payout details.' : 'Agree on a price above to unlock messaging.'}
                      </p>
                    </div>
                    <div className={`hidden sm:block px-3 py-2 border rounded-xl opacity-40 cursor-not-allowed w-[140px] flex-shrink-0 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                      <span className={`text-[12px] truncate block ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Type a message…</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`px-4 sm:px-5 py-3.5 border-t flex-shrink-0 ${isDark ? 'bg-[#0B1725] border-slate-700/60' : 'bg-white border-gray-200/80'}`}>
                  {attachmentError && (
                    <div className="mb-2 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200/70">
                      <span className="text-[11.5px] text-red-600 font-medium">{attachmentError}</span>
                      <button onClick={() => setAttachmentError('')} className="text-red-400 hover:text-red-600 cursor-pointer flex-shrink-0"><XIcon /></button>
                    </div>
                  )}
                  {(pendingAttachments.length > 0 || uploadingAttachments) && (
                    <div className="mb-2 flex items-center gap-2 flex-wrap">
                      {pendingAttachments.map((att, i) => (
                        <div key={i} className={`relative flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                          {att.type === 'image' ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={att.url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          ) : att.type === 'video' ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={att.thumbnailUrl || att.url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-slate-700/60 text-slate-300' : 'bg-white text-gray-500'}`}><FileIcon /></span>
                          )}
                          <span className={`text-[11px] max-w-[100px] truncate ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{att.fileName}</span>
                          <button
                            onClick={() => removePendingAttachment(i)}
                            className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer ${isDark ? 'bg-slate-700 text-slate-400 hover:text-white' : 'bg-gray-200 text-gray-500 hover:text-gray-800'}`}
                          >
                            <XIcon />
                          </button>
                        </div>
                      ))}
                      {uploadingAttachments && (
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                          <span className="w-3.5 h-3.5 border-2 border-gray-400/40 border-t-gray-500 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`flex items-center gap-2.5 px-2 py-2 rounded-2xl border shadow-sm transition-all duration-200 ${
                    limitHit
                      ? isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-gray-50 border-gray-200'
                      : isDark
                      ? 'bg-slate-800/40 border-slate-700 focus-within:border-[#3D5087] focus-within:shadow-lg focus-within:shadow-indigo-900/30 focus-within:ring-2 focus-within:ring-[#3D5087]/20'
                      : 'bg-white border-gray-200 focus-within:border-[#3D5087] focus-within:shadow-lg focus-within:shadow-indigo-100/40 focus-within:ring-2 focus-within:ring-[#3D5087]/10'
                  }`}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      hidden
                      onChange={e => handleFilesSelected(e.target.files)}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={limitHit || uploadingAttachments}
                      title="Attach files"
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-200' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                    >
                      <PaperclipIcon />
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={limitHit}
                      placeholder={limitHit ? 'Upgrade to keep messaging…' : `Message ${selectedDeal.influencerId?.name}…`}
                      className={`flex-1 px-2 py-1.5 text-[13.5px] bg-transparent outline-none ${isDark ? 'text-slate-200 placeholder:text-slate-600 disabled:text-slate-600' : 'text-gray-900 placeholder:text-gray-400 disabled:text-gray-400'}`}
                    />
                    {newMessage.length > 200 && (
                      <span className={`text-[11px] font-semibold self-center flex-shrink-0 ${newMessage.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
                        {500 - newMessage.length}
                      </span>
                    )}
                    <button
                      onClick={handleSend}
                      disabled={sending || uploadingAttachments || (!newMessage.trim() && pendingAttachments.length === 0) || limitHit}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                        (newMessage.trim() || pendingAttachments.length > 0) && !limitHit && !uploadingAttachments
                          ? 'bg-[#3D5087] hover:bg-[#2B3B68] text-white shadow-sm hover:shadow-md active:scale-95 cursor-pointer'
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
            /* No deal selected */
            <div
              className="flex-1 flex flex-col items-center justify-center text-center px-6"
              style={isDark ? {
                backgroundColor: '#060D1A',
                backgroundImage: 'radial-gradient(circle, #1a2040 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              } : {
                backgroundColor: '#ECEEF6',
                backgroundImage: 'radial-gradient(circle, #B4BBDA 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
            >
              <div className={`backdrop-blur-sm rounded-3xl p-10 flex flex-col items-center shadow-xl border ${isDark ? 'bg-[#0E1B2E]/90 border-slate-700/50 shadow-slate-900/50' : 'bg-white/80 border-white/70 shadow-indigo-100/30'}`}>
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#161F3F] via-[#2B3B68] to-[#4a5fa0] text-white flex items-center justify-center mb-5 shadow-xl shadow-indigo-400/20">
                  <ChatBubbleIcon size={38} />
                </div>
                <h3 className={`text-[17px] font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>Deal conversations</h3>
                <p className={`text-[13px] max-w-[250px] leading-relaxed mb-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  Select a creator from the sidebar to view and continue your conversation.
                </p>
                <div className={`flex items-center gap-2 text-[11.5px] px-4 py-2.5 rounded-xl border ${isDark ? 'text-indigo-300 bg-indigo-900/20 border-indigo-800/30' : 'text-indigo-700 bg-indigo-50 border-indigo-200/50'}`}>
                  <ShieldIcon />
                  <span className="font-semibold">All messages are moderated for platform safety</span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

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
            <img src={lightbox.url} alt="" className="max-w-full max-h-full rounded-lg object-contain" onClick={e => e.stopPropagation()} />
          ) : (
            <video src={lightbox.url} controls autoPlay className="max-w-full max-h-full rounded-lg" onClick={e => e.stopPropagation()} />
          )}
        </div>
      )}
    </div>
  );
}

// useSearchParams() must be wrapped in Suspense for production builds
export default function BrandMessagesWrapper() {
  return (
    <Suspense fallback={null}>
      <BrandMessages />
    </Suspense>
  );
}
