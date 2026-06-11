'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useLiveData } from '@/lib/useLiveData';
import InfluencerNav from '@/components/shared/InfluencerNav';
import IdChip from '@/components/shared/IdChip';
import { useToast } from '@/components/shared/Toast';
import { useConfirm } from '@/components/shared/ConfirmModal';

const NICHES = ['beauty', 'fashion', 'food', 'fitness', 'lifestyle', 'travel', 'tech', 'books'];
const PLATFORMS = ['any', 'instagram', 'youtube', 'facebook'];
const SORT_OPTIONS = [
  { value: 'newest',      label: 'Newest first' },
  { value: 'budget_high', label: 'Budget: High → Low' },
  { value: 'budget_low',  label: 'Budget: Low → High' },
  { value: 'deadline',    label: 'Deadline soonest' },
];

interface Campaign {
  _id: string;
  customId?: string;
  title: string;
  description: string;
  niche: string[];
  deliverables: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  targetCity: string[];
  targetPlatforms: string[];
  minFollowers: number;
  maxFollowers: number;
  applicantCount: number;
  brandId: { name: string };
  brandLogoUrl?: string;
  brandWebsite?: string;
  brandCompanyName?: string;
  brandIndustry?: string;
  brandDescription?: string;
  brandGstinVerified?: boolean;
  match?: {
    score: number;
    niche: string;
    platform: string;
    followers: string;
    budget: string;
    reasons: string[];
  };
}

const NICHE_COLORS: Record<string, string> = {
  beauty:    'bg-pink-50 text-pink-700 border-pink-200',
  fashion:   'bg-[#FDE5DC] text-[#9C4A33] border-[#f5c4b0]',
  food:      'bg-orange-50 text-orange-700 border-orange-200',
  fitness:   'bg-[#FDF3DD] text-[#854F0B] border-amber-200',
  lifestyle: 'bg-purple-50 text-purple-700 border-purple-200',
  travel:    'bg-[#E8F5E0] text-[#3B6D11] border-green-200',
  tech:      'bg-[#E6F1FB] text-[#0C447C] border-blue-200',
  books:     'bg-[#F0ECFA] text-[#3C3489] border-violet-200',
};

const STATUS_CONFIG: Record<string, { cls: string; dot: string; label: string }> = {
  applied:     { cls: 'bg-blue-50 text-blue-700 border border-blue-200',   dot: 'bg-blue-400',   label: 'Applied' },
  shortlisted: { cls: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-400',  label: 'Shortlisted' },
  accepted:    { cls: 'bg-green-50 text-green-700 border border-green-200', dot: 'bg-green-500',  label: 'Accepted' },
  rejected:    { cls: 'bg-red-50 text-red-600 border border-red-200',       dot: 'bg-red-400',    label: 'Rejected' },
  'on-hold':   { cls: 'bg-gray-50 text-gray-500 border border-gray-200',    dot: 'bg-gray-400',   label: 'Under Review' },
};

const BRAND_GRADS = [
  'from-violet-500 to-purple-600',
  'from-teal-500 to-cyan-600',
  'from-amber-500 to-orange-500',
  'from-indigo-500 to-blue-600',
  'from-pink-500 to-rose-500',
  'from-emerald-500 to-green-600',
];

// Brand logos for campaign target platforms (simple-icons paths, viewBox 0 0 24 24).
const PLATFORM_ICONS: Record<string, { bg: string; label: string; path: string }> = {
  instagram: {
    bg: 'bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5]',
    label: 'Instagram',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z',
  },
  youtube: {
    bg: 'bg-[#FF0000]',
    label: 'YouTube',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
  facebook: {
    bg: 'bg-[#1877F2]',
    label: 'Facebook',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
};

const formatFollowers = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
};

// Visual tone for the relevance match badge, by score.
const matchTone = (score: number) =>
  score >= 85
    ? { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50', label: 'Great match' }
    : score >= 70
    ? { cls: 'bg-teal-50 text-[#2A6E76] border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800/50', label: 'Good match' }
    : { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50', label: 'Fair match' };

const daysUntil = (dateStr: string) => Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function InfluencerCampaigns() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [user, setUser] = useState<any>(null);
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);

  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState('any');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const [applicationsUsed, setApplicationsUsed] = useState(0);
  const [expandedNiches, setExpandedNiches] = useState<Set<string>>(new Set());
  const [expandedDesc, setExpandedDesc] = useState<Set<string>>(new Set());

  const toggleNicheExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNiches(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const toggleDescExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDesc(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const FREEMIUM_LIMIT = 5;
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    setUser(JSON.parse(stored));
    api.get('/api/influencer/profile/me').then(r => setProfilePicUrl(r.data?.profile?.profilePicUrl || '')).catch(() => {});
    fetchCampaigns();
    fetchMyApplications();
    fetchInvitedCampaigns();
  }, []);

  useEffect(() => {
    if (!loading) fetchCampaigns();
  }, [selectedNiches, selectedPlatform]);

  useLiveData(() => { fetchCampaigns(); fetchMyApplications(); fetchInvitedCampaigns(); });

  const fetchCampaigns = async () => {
    try {
      const params: Record<string, string> = {};
      if (selectedNiches.length > 0) params.niche = selectedNiches.join(',');
      if (selectedPlatform !== 'any') params.platform = selectedPlatform;
      const response = await api.get('/api/campaigns', { params });
      setCampaigns(response.data.campaigns);
    } catch (error) {
      console.error('Fetch campaigns error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const response = await api.get('/api/campaigns/my-applications');
      const ids = response.data.applications.map((a: any) => a.campaignId._id);
      setAppliedIds(ids);
      const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
      setApplicationsUsed(
        response.data.applications.filter((a: any) => new Date(a.createdAt) >= thisMonth).length
      );
    } catch {}
  };

  // Campaigns this influencer has an open (non-declined) brand invitation to —
  // they can't apply to these, they respond from the Invitations page instead.
  const fetchInvitedCampaigns = async () => {
    try {
      const response = await api.get('/api/invitations/influencer');
      const ids = (response.data.invitations || [])
        .filter((inv: any) => inv.status !== 'rejected')
        .map((inv: any) => inv.campaignId?._id || inv.campaignId)
        .filter(Boolean);
      setInvitedIds(ids);
    } catch {}
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    toast.show(msg, type);
  };

  const handleApply = async (campaignId: string) => {
    const isPremium = user?.plan === 'premium';
    if (!isPremium && applicationsUsed >= FREEMIUM_LIMIT) {
      showToast('You have used all 5 free applications this month. Upgrade to Premium.', 'error');
      return;
    }
    setApplying(campaignId);
    try {
      await api.post(`/api/campaigns/${campaignId}/apply`, { message: '', proposedRate: 0 });
      setAppliedIds(prev => [...prev, campaignId]);
      setApplicationsUsed(prev => prev + 1);
      showToast('Application submitted! The brand will review within 48 hours.');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to apply.';
      showToast(msg, 'error');
    } finally {
      setApplying(null);
    }
  };

  const toggleNiche = (niche: string) =>
    setSelectedNiches(prev => prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche]);

  const clearAllFilters = () => {
    setSelectedNiches([]);
    setSelectedPlatform('any');
    setSearch('');
  };

  const activeFilterCount = selectedNiches.length + (selectedPlatform !== 'any' ? 1 : 0) + (search ? 1 : 0);

  const sortedCampaigns = [...campaigns]
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.brandId?.name?.toLowerCase().includes(q) ||
        c.brandCompanyName?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'budget_high') return b.budgetMax - a.budgetMax;
      if (sortBy === 'budget_low') return a.budgetMin - b.budgetMin;
      if (sortBy === 'deadline') return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return 0;
    });

  const isPremium = user?.plan === 'premium';

  return (
    <div className="min-h-screen bg-[#F7F9FA]">


      <InfluencerNav user={user} profilePicUrl={profilePicUrl} />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* ── Hero ── */}
        <section className="relative bg-gradient-to-br from-[#0d2d33] via-[#1C4A52] to-[#2d7a88] rounded-2xl px-6 sm:px-10 py-7 sm:py-9 mb-6 overflow-hidden shadow-lg">
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" preserveAspectRatio="none">
            <defs>
              <pattern id="camp-dots" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="white"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#camp-dots)"/>
          </svg>

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-teal-300/80 text-xs font-semibold uppercase tracking-widest mb-2">
                Browse opportunities
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-3">
                Campaigns for You
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/15 text-white px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                  {loading ? '…' : sortedCampaigns.length} campaign{sortedCampaigns.length !== 1 ? 's' : ''} available
                </span>
                {appliedIds.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/15 text-white px-3 py-1.5 rounded-full backdrop-blur-sm">
                    <svg className="w-3 h-3 text-teal-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {appliedIds.length} applied
                  </span>
                )}
                {isPremium && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-amber-400/20 to-yellow-400/20 border border-amber-400/30 text-amber-300 px-3 py-1.5 rounded-full">
                    ★ Unlimited applications
                  </span>
                )}
              </div>
            </div>

            {/* Sort selector */}
            <div className="relative self-start sm:self-auto flex-shrink-0">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="pl-8 pr-8 py-2.5 text-xs font-semibold border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30 appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="text-gray-900 bg-white">{o.label}</option>)}
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
        </section>

        {/* ── Freemium cap ── */}
        {!isPremium && (
          <div className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl px-5 py-4 mb-6 border shadow-sm ${
            applicationsUsed >= FREEMIUM_LIMIT
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40'
              : 'bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-200 dark:border-teal-800/40'
          }`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm text-white ${
                applicationsUsed >= FREEMIUM_LIMIT
                  ? 'bg-gradient-to-br from-red-400 to-rose-500'
                  : 'bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F]'
              }`}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold mb-1 ${applicationsUsed >= FREEMIUM_LIMIT ? 'text-red-800 dark:text-red-300' : 'text-[#2A3E42] dark:text-slate-100'}`}>
                  {applicationsUsed >= FREEMIUM_LIMIT
                    ? 'Monthly limit reached — upgrade to keep applying'
                    : `${applicationsUsed} of ${FREEMIUM_LIMIT} free applications used this month`}
                </p>
                <div className="flex items-center gap-2.5 max-w-[200px]">
                  <div className="flex-1 h-1.5 bg-black/10 dark:bg-white/15 rounded-full overflow-hidden ring-1 ring-inset ring-black/5 dark:ring-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        applicationsUsed >= FREEMIUM_LIMIT ? 'bg-red-500' : 'bg-[#5D8A8F] dark:bg-[#7FA8AD]'
                      }`}
                      style={{ width: `${Math.min((applicationsUsed / FREEMIUM_LIMIT) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-medium flex-shrink-0">{Math.max(0, FREEMIUM_LIMIT - applicationsUsed)} left</span>
                </div>
              </div>
            </div>
            <Link href="/influencer/billing"
              className="flex-shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5 text-xs bg-[#7FA8AD] hover:bg-[#5D8A8F] text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9z"/>
              </svg>
              Upgrade — unlimited
            </Link>
          </div>
        )}

        {/* ── Search + Filters ── */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search campaigns or brands…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7FA8AD]/30 focus:border-[#7FA8AD] transition-all shadow-sm"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(v => !v)}
              className={`lg:hidden relative flex items-center gap-1.5 px-3.5 py-2.5 border rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer ${
                showFilters || activeFilterCount > 0
                  ? 'border-[#7FA8AD] bg-[#EEF4F5] text-[#2A3E42]'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#7FA8AD] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className={`${showFilters ? 'flex' : 'hidden'} lg:flex flex-wrap items-center gap-2`}>
            {NICHES.map(niche => (
              <button key={niche} onClick={() => toggleNiche(niche)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all duration-150 cursor-pointer ${
                  selectedNiches.includes(niche)
                    ? 'bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] border-transparent text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-[#7FA8AD]/50 hover:bg-teal-50/50 hover:text-[#2A3E42]'
                }`}>
                {niche}
              </button>
            ))}
            <div className="relative">
              <select
                value={selectedPlatform}
                onChange={e => setSelectedPlatform(e.target.value)}
                className={`pl-3 pr-7 py-1.5 text-xs border rounded-full focus:outline-none focus:ring-2 focus:ring-[#7FA8AD]/30 capitalize font-semibold appearance-none cursor-pointer transition-all duration-150 ${
                  selectedPlatform !== 'any'
                    ? 'border-[#7FA8AD] bg-[#EEF4F5] text-[#2A3E42]'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                {PLATFORMS.map(p => <option key={p} value={p}>{p === 'any' ? 'All platforms' : p}</option>)}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-red-500 bg-white border border-gray-200 hover:border-red-200 rounded-full transition-all cursor-pointer">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* ── Campaign grid ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-[#7FA8AD] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Finding the best campaigns for you…</p>
          </div>
        ) : sortedCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF4F5] text-[#7FA8AD] flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <h3 className="font-bold text-gray-800 text-[15px] mb-1.5">No campaigns found</h3>
            <p className="text-sm text-gray-400 max-w-[260px] mb-5 leading-relaxed">
              Try adjusting your filters or clearing your search to see more opportunities.
            </p>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters}
                className="text-sm bg-[#7FA8AD] hover:bg-[#5D8A8F] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm cursor-pointer">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 items-start">
            {sortedCampaigns.map(campaign => {
              const alreadyApplied = appliedIds.includes(campaign._id);
              const isInvited      = !alreadyApplied && invitedIds.includes(campaign._id);
              const isApplying     = applying === campaign._id;
              const days           = daysUntil(campaign.deadline);
              const deadlinePassed = days < 0;
              const urgency        = !deadlinePassed && days <= 3;
              const soonish        = !deadlinePassed && days <= 7 && days > 3;
              // Prefer the registered company name over the account holder's personal name.
              const brandName      = campaign.brandCompanyName || campaign.brandId?.name || 'Brand';
              const brandGrad      = BRAND_GRADS[(brandName.charCodeAt(0) || 0) % BRAND_GRADS.length];

              return (
                <div
                  key={campaign._id}
                  className={`rounded-2xl border shadow-sm flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                    alreadyApplied ? 'bg-gradient-to-br from-white to-green-50/40 dark:from-[#0f1e31] dark:to-emerald-900/10 border-green-200 dark:border-emerald-800/40' :
                    urgency        ? 'bg-gradient-to-br from-white to-red-50/40 dark:from-[#0f1e31] dark:to-red-900/10 border-red-200 dark:border-red-800/40' :
                    'bg-white dark:bg-[#0f1e31] border-gray-200 dark:border-slate-700/60 hover:border-[#7FA8AD]/50 dark:hover:border-[#7FA8AD]/40'
                  }`}
                >
                  {/* Accent strip */}
                  <div className={`h-1 w-full rounded-t-2xl ${
                    alreadyApplied ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                    urgency        ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                    soonish        ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                    'bg-gradient-to-r from-[#7FA8AD] via-[#5BA8B5] to-[#9fc5c9]'
                  }`} />

                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    {/* Brand row */}
                    <div className="flex items-start gap-3 mb-3.5 p-3 rounded-xl bg-gray-50/70 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50">
                      <div className={`w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center ${!campaign.brandLogoUrl ? `bg-gradient-to-br ${brandGrad}` : 'bg-gray-100 dark:bg-slate-700'}`}>
                        {campaign.brandLogoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={campaign.brandLogoUrl} alt={brandName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[11px] font-bold text-white">{brandName.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[13px] font-bold text-gray-900 dark:text-slate-100 truncate">{brandName}</p>
                          {campaign.brandGstinVerified && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              GST Verified
                            </span>
                          )}
                          {alreadyApplied && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Applied
                            </span>
                          )}
                          {isInvited && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full flex-shrink-0">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
                              Invited
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {campaign.brandIndustry && campaign.brandIndustry !== 'other' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EEF4F5] text-[#2A3E42] border border-[#7FA8AD]/30 capitalize">
                              {campaign.brandIndustry}
                            </span>
                          )}
                          {campaign.brandWebsite ? (
                            <a
                              href={campaign.brandWebsite.startsWith('http') ? campaign.brandWebsite : `https://${campaign.brandWebsite}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 text-[11px] text-[#3D5087] dark:text-[#7FA8AD] hover:text-[#2B3B68] dark:hover:text-[#9DC4C9] font-medium hover:underline transition-colors"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                              </svg>
                              {campaign.brandWebsite.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            </a>
                          ) : null}
                          {(campaign.targetPlatforms ?? []).map((plat: string) => {
                            const meta = PLATFORM_ICONS[plat];
                            if (!meta) return null;
                            return (
                              <span
                                key={plat}
                                title={meta.label}
                                aria-label={meta.label}
                                className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-md text-white shadow-sm ${meta.bg}`}
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                  <path d={meta.path} />
                                </svg>
                              </span>
                            );
                          })}
                        </div>
                        {campaign.brandDescription && (
                          <div className="mt-1.5">
                            <p className={`text-[11px] text-gray-400 dark:text-slate-500 leading-relaxed ${expandedDesc.has(campaign._id) ? '' : 'line-clamp-2'}`}>
                              {campaign.brandDescription}
                            </p>
                            {campaign.brandDescription.length > 100 && (
                              <button
                                onClick={e => toggleDescExpand(campaign._id, e)}
                                className="text-[10px] font-semibold text-[#5D8A8F] dark:text-teal-400 hover:underline mt-0.5 cursor-pointer"
                              >
                                {expandedDesc.has(campaign._id) ? 'View less ↑' : 'View more ↓'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title + match badge */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-[15px] font-bold text-gray-900 dark:text-slate-100 leading-snug">
                        {campaign.title}
                      </h3>
                      {campaign.match && (() => {
                        const tone = matchTone(campaign.match.score);
                        return (
                          <span
                            title={campaign.match.reasons.length ? `Why this matches you — ${campaign.match.reasons.join(' · ')}` : tone.label}
                            className={`flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tone.cls}`}
                          >
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6L5.7 21l2.3-7.4-6-4.6h7.6z" />
                            </svg>
                            {campaign.match.score}% match
                          </span>
                        );
                      })()}
                    </div>
                    {campaign.customId && (
                      <div className="mb-1.5">
                        <IdChip id={campaign.customId} size="xs" tone="subtle" />
                      </div>
                    )}
                    <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-4 flex-1 line-clamp-2">
                      {campaign.description}
                    </p>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/10 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3">
                        <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold uppercase tracking-wider mb-0.5">Budget</p>
                        <p className="text-[13px] font-bold text-emerald-900 dark:text-emerald-300 leading-tight">
                          ₹{campaign.budgetMin.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-emerald-600/60 dark:text-emerald-400/50">– ₹{campaign.budgetMax.toLocaleString()}</p>
                      </div>
                      <div className={`rounded-xl p-3 border ${
                        deadlinePassed ? 'bg-gray-50 dark:bg-slate-800/40 border-gray-100 dark:border-slate-700/40' :
                        urgency        ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/40' :
                        soonish        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/40' :
                        'bg-[#EEF4F5] dark:bg-[#0d2d33]/60 border-[#7FA8AD]/20 dark:border-[#7FA8AD]/20'
                      }`}>
                        <div className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${
                          deadlinePassed ? 'text-gray-400' : urgency ? 'text-red-600' : soonish ? 'text-amber-600' : 'text-[#5D8A8F]'
                        }`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          Deadline
                        </div>
                        <p className={`text-[13px] font-bold leading-tight ${
                          deadlinePassed ? 'text-gray-400' : urgency ? 'text-red-600' : soonish ? 'text-amber-600' : 'text-[#2A3E42]'
                        }`}>
                          {deadlinePassed ? 'Closed' : days === 0 ? 'Today!' : `${days}d left`}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500">{formatDate(campaign.deadline)}</p>
                      </div>
                    </div>

                    {/* Deliverables + min followers */}
                    <div className="flex flex-col gap-1.5 mb-4">
                      <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-slate-400">
                        <span className="text-gray-300 dark:text-slate-600 mt-0.5 flex-shrink-0">▸</span>
                        <span className="leading-relaxed"><strong className="text-gray-600 dark:text-slate-300">Deliverables:</strong> {campaign.deliverables}</span>
                      </div>
                      {campaign.minFollowers > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                          <svg className="text-gray-300 dark:text-slate-600 flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                          <span>Min. <strong className="text-gray-600 dark:text-slate-300">{formatFollowers(campaign.minFollowers)}</strong> followers required</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                        <svg className="text-gray-300 dark:text-slate-600 flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span><strong className="text-gray-600 dark:text-slate-300">{campaign.applicantCount}</strong> {campaign.applicantCount === 1 ? 'applicant' : 'applicants'} so far</span>
                      </div>
                    </div>

                    {/* Niche tags + CTA */}
                    <div className="flex items-end justify-between gap-3 pt-3 border-t border-gray-100 dark:border-slate-700/50">
                      <div className="flex gap-1 flex-wrap">
                        {(expandedNiches.has(campaign._id) ? campaign.niche : campaign.niche.slice(0, 2)).map((n: string) => (
                          <span key={n} className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize border ${NICHE_COLORS[n] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {n}
                          </span>
                        ))}
                        {campaign.niche.length > 2 && (
                          <button
                            onClick={e => toggleNicheExpand(campaign._id, e)}
                            className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-gray-100 dark:bg-slate-700/60 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-600 hover:bg-[#EEF4F5] dark:hover:bg-slate-600/60 hover:text-[#2A3E42] dark:hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            {expandedNiches.has(campaign._id) ? '↑ less' : `+${campaign.niche.length - 2}`}
                          </button>
                        )}
                        {campaign.targetCity.length > 0 && campaign.targetCity[0] !== 'all' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700/60 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-600">
                            {campaign.targetCity[0]}{campaign.targetCity.length > 1 ? ` +${campaign.targetCity.length - 1}` : ''}
                          </span>
                        )}
                      </div>

                      {alreadyApplied ? (
                        <button disabled className="flex-shrink-0 text-xs px-4 py-2 bg-green-50 dark:bg-emerald-900/30 text-green-600 dark:text-emerald-400 border border-green-200 dark:border-emerald-800/50 rounded-xl cursor-not-allowed font-semibold">
                          Applied ✓
                        </button>
                      ) : isInvited ? (
                        <Link href="/influencer/invitations" title="You've been invited — respond from your Invitations"
                          className="flex-shrink-0 text-xs px-4 py-2 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50 rounded-xl font-semibold text-center hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors">
                          Invited ✓
                        </Link>
                      ) : deadlinePassed ? (
                        <button disabled className="flex-shrink-0 text-xs px-4 py-2 bg-gray-100 dark:bg-slate-700/50 text-gray-400 dark:text-slate-500 rounded-xl cursor-not-allowed font-semibold">
                          Closed
                        </button>
                      ) : !isPremium && applicationsUsed >= FREEMIUM_LIMIT ? (
                        <Link href="/influencer/billing"
                          className="flex-shrink-0 text-xs px-4 py-2 bg-[#7FA8AD] hover:bg-[#5D8A8F] text-white rounded-xl font-bold transition-all duration-150 cursor-pointer text-center shadow-sm">
                          Upgrade
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleApply(campaign._id)}
                          disabled={isApplying}
                          className="flex-shrink-0 text-xs px-4 py-2 bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] hover:from-[#5D8A8F] hover:to-[#4A7A7F] text-white rounded-xl font-bold transition-all duration-150 disabled:opacity-60 cursor-pointer shadow-sm hover:shadow-md">
                          {isApplying ? (
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                              Applying…
                            </span>
                          ) : 'Apply now'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── My Applications ── */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-[#7FA8AD] to-[#5D8A8F]" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">My Applications</h2>
                <p className="text-xs text-gray-400 mt-0.5">Track your submitted campaign applications</p>
              </div>
            </div>
          </div>
          <MyApplications />
        </section>

      </main>
    </div>
  );
}

function MyApplications() {
  const toast = useToast();
  const confirm = useConfirm();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const loadApplications = () => {
    api.get('/api/campaigns/my-applications')
      .then(r => setApplications(r.data.applications))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadApplications(); }, []);

  useLiveData(() => { loadApplications(); });

  const handleWithdraw = async (applicationId: string) => {
    if (!(await confirm({
      title: 'Withdraw this application?',
      description: 'Your application will be removed from this campaign.',
      confirmLabel: 'Withdraw',
      variant: 'danger',
    }))) return;
    setWithdrawingId(applicationId);
    try {
      await api.delete(`/api/influencer/applications/${applicationId}`);
      setApplications(prev => prev.filter(a => a._id !== applicationId));
      toast.success('Application withdrawn.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to withdraw.');
    } finally {
      setWithdrawingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200/80 rounded-2xl p-8 flex items-center justify-center gap-3 shadow-sm">
        <div className="w-5 h-5 border-2 border-[#7FA8AD] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading applications…</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-[#EEF4F5] text-[#7FA8AD] flex items-center justify-center mx-auto mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        </div>
        <p className="text-sm font-bold text-gray-700 mb-1">No applications yet</p>
        <p className="text-xs text-gray-400">Browse campaigns above and hit <strong>Apply now</strong> to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              {['Campaign', 'Application ID', 'Brand', 'Budget', 'Applied on', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map((app, i) => {
              const cfg = STATUS_CONFIG[app.status] || { cls: 'bg-gray-100 text-gray-600 border border-gray-200', dot: 'bg-gray-400', label: app.status };
              return (
                <tr key={i} className="border-b border-gray-50 hover:bg-[#EEF4F5]/30 transition-colors">
                  <td className="px-5 py-4 text-sm font-bold text-gray-900 max-w-[200px] truncate">
                    {app.campaignId?.title || 'Campaign'}
                  </td>
                  <td className="px-5 py-4">
                    {app.customId ? <IdChip id={app.customId} size="xs" tone="subtle" /> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500 font-medium">
                    {app.campaignId?.brandId?.name || app.brandId?.name || '—'}
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-gray-800 tabular-nums">
                    ₹{app.campaignId?.budgetMin?.toLocaleString()} – ₹{app.campaignId?.budgetMax?.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400 font-medium">
                    {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold ${cfg.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {app.status === 'applied' && (
                      <button
                        onClick={() => handleWithdraw(app._id)}
                        disabled={withdrawingId === app._id}
                        className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {withdrawingId === app._id ? 'Withdrawing…' : 'Withdraw'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {applications.map((app, i) => {
          const cfg = STATUS_CONFIG[app.status] || { cls: 'bg-gray-100 text-gray-600 border border-gray-200', dot: 'bg-gray-400', label: app.status };
          return (
            <div key={i} className="px-4 py-4 hover:bg-gray-50/60 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{app.campaignId?.title || 'Campaign'}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">{app.campaignId?.brandId?.name || app.brandId?.name || '—'}</p>
                  {app.customId && <div className="mt-1.5"><IdChip id={app.customId} size="xs" tone="subtle" /></div>}
                </div>
                <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${cfg.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="font-bold text-gray-700 tabular-nums">
                  ₹{app.campaignId?.budgetMin?.toLocaleString()} – ₹{app.campaignId?.budgetMax?.toLocaleString()}
                </span>
                <span>·</span>
                <span>{new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
              {app.status === 'applied' && (
                <div className="mt-2.5">
                  <button
                    onClick={() => handleWithdraw(app._id)}
                    disabled={withdrawingId === app._id}
                    className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {withdrawingId === app._id ? 'Withdrawing…' : 'Withdraw'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
