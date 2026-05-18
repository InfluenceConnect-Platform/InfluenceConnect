'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

const NICHES = ['beauty', 'fashion', 'food', 'fitness', 'lifestyle', 'travel', 'tech', 'books'];
const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad'];
const PLATFORMS = ['instagram', 'youtube', 'facebook'];

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/influencer/dashboard' },
  { label: 'Campaigns', href: '/influencer/campaigns' },
  { label: 'Messages', href: '/influencer/messages' },
  { label: 'Earnings', href: '/influencer/earnings' },
  { label: 'Profile', href: '/influencer/profile', active: true },
  { label: 'Billing', href: '/influencer/billing' },
];

const UploadCloudIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);
const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const BarChartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const ImageIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const GridIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const ReelIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/>
  </svg>
);
const PhotoTabIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
);
const ProductIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const formatFollowers = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  desc?: string;
}
const SectionHeader = ({ icon, title, desc }: SectionHeaderProps) => (
  <div className="flex items-center gap-2.5 mb-5">
    <div className="w-7 h-7 rounded-lg bg-[#EEF4F5] text-[#7FA8AD] flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-gray-900 text-[15px]">{title}</h3>
      {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
    </div>
  </div>
);

export default function InfluencerProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'reels' | 'photos' | 'products'>('all');

  const [bio, setBio] = useState('');
  const [niche, setNiche] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [priceRangeMin, setPriceRangeMin] = useState('');
  const [priceRangeMax, setPriceRangeMax] = useState('');
  const [platforms, setPlatforms] = useState<any[]>([]);
  // Uploads buffered locally — only written to DB when "Save changes" is clicked
  const [pendingUploads, setPendingUploads] = useState<{
    cloudinaryUrl: string; thumbnailUrl: string; type: string; fileSize: number; duration: number;
  }[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    fetchProfile();
  }, []);

  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setIsEditing(true);
    }
  }, [searchParams]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const fetchProfile = async (portfolioOnlyUpdate = false) => {
    try {
      const response = await api.get('/api/influencer/profile/me');
      const p = response.data.profile;
      if (portfolioOnlyUpdate) {
        // Only refresh portfolio items — don't overwrite unsaved form edits
        setProfile((prev: typeof p | null) => prev ? { ...prev, portfolioItems: p.portfolioItems } : p);
      } else {
        setProfile(p);
        setBio(p.bio || '');
        setNiche(p.niche || []);
        setCity(p.city || '');
        setPriceRangeMin(p.priceRangeMin?.toString() || '');
        setPriceRangeMax(p.priceRangeMax?.toString() || '');
        setPlatforms(p.platforms || []);
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetFormToProfile = () => {
    if (!profile) return;
    setBio(profile.bio || '');
    setNiche(profile.niche || []);
    setCity(profile.city || '');
    setPriceRangeMin(profile.priceRangeMin?.toString() || '');
    setPriceRangeMax(profile.priceRangeMax?.toString() || '');
    setPlatforms(profile.platforms || []);
  };

  const handleCancelEdit = () => {
    resetFormToProfile();
    setPendingUploads([]);
    setIsEditing(false);
    setError('');
  };

  const toggleNiche = (n: string) =>
    setNiche(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);

  const updatePlatform = (index: number, field: string, value: string | number) => {
    const updated = [...platforms];
    updated[index] = { ...updated[index], [field]: value };
    setPlatforms(updated);
  };

  const addPlatform = (name: string) => {
    if (platforms.find(p => p.name === name)) return;
    setPlatforms(prev => [...prev, { name, followers: 0, avgLikes: 0, avgComments: 0, avgShares: 0 }]);
  };

  const removePlatform = (index: number) =>
    setPlatforms(prev => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put('/api/influencer/profile', {
        bio, niche, city,
        priceRangeMin: parseInt(priceRangeMin) || 0,
        priceRangeMax: parseInt(priceRangeMax) || 0,
        platforms,
      });
      // Now persist any buffered portfolio uploads
      for (const item of pendingUploads) {
        await api.post('/api/upload/portfolio', item);
      }
      setPendingUploads([]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await fetchProfile();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) { setError('Only images and videos are allowed.'); return; }
    if (isImage && file.size > 10 * 1024 * 1024) { setError('Image must be under 10 MB.'); return; }
    if (isVideo && file.size > 100 * 1024 * 1024) { setError('Video must be under 100 MB.'); return; }

    setUploading(true);
    setError('');
    try {
      const sigResponse = await api.get('/api/upload/signature');
      const { signature, timestamp, apiKey, cloudName, folder } = sigResponse.data;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', apiKey);
      formData.append('folder', folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${isVideo ? 'video' : 'image'}/upload`,
        { method: 'POST', body: formData }
      );
      const uploadData = await uploadResponse.json();
      if (uploadData.error) throw new Error(uploadData.error.message);

      // Buffer locally — will be written to DB only when "Save changes" is clicked
      setPendingUploads(prev => [...prev, {
        cloudinaryUrl: uploadData.secure_url,
        thumbnailUrl: isVideo ? uploadData.secure_url.replace('/upload/', '/upload/so_0/') : '',
        type: isVideo ? 'video' : 'image',
        fileSize: file.size,
        duration: uploadData.duration || 0,
      }]);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Merge saved + pending uploads for the content grid
  const allPortfolioItems: Array<{
    _id: string; type: string; cloudinaryUrl: string; thumbnailUrl: string;
    isVisible?: boolean; pending: boolean; fileSize?: number; duration?: number;
  }> = [
    ...(profile?.portfolioItems || []).map((i: { _id: string; type: string; cloudinaryUrl: string; thumbnailUrl: string; isVisible: boolean }) => ({ ...i, pending: false })),
    ...pendingUploads.map((i, idx) => ({ ...i, _id: `pending-${idx}`, isVisible: true, pending: true })),
  ];
  const filteredPortfolioItems = activeTab === 'all'
    ? allPortfolioItems
    : activeTab === 'reels'
      ? allPortfolioItems.filter(i => i.type === 'video')
      : activeTab === 'photos'
        ? allPortfolioItems.filter(i => i.type === 'image')
        : [];

  const totalFollowers = (profile?.platforms || []).reduce((acc: number, p: { followers?: number }) => acc + (p.followers || 0), 0);
  const engagingPlatforms = (profile?.platforms || []).filter((p: { followers?: number }) => (p.followers || 0) > 0);
  const avgEngagement = engagingPlatforms.length > 0
    ? (engagingPlatforms.reduce((acc: number, p: { followers?: number; avgLikes?: number; avgComments?: number }) =>
        acc + (((p.avgLikes || 0) + (p.avgComments || 0)) / (p.followers || 1) * 100), 0) / engagingPlatforms.length
      ).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#7FA8AD] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA]">

      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[60px] sticky top-0 z-20 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-4 lg:gap-8 min-w-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] flex items-center justify-center text-white font-bold text-sm shadow-sm">IC</div>
            <span className="font-bold text-gray-900 text-[15px] tracking-tight hidden sm:block">Influence Connect</span>
          </div>
          <div className="hidden lg:flex gap-0.5">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}
                className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                  item.active ? 'bg-[#EEF4F5] text-[#2A3E42]' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <span className="hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EEF4F5] text-[#2A3E42]">Freemium</span>
          <Link href="/influencer/dashboard"
            className="hidden sm:flex items-center text-xs text-gray-500 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-all duration-150 cursor-pointer">
            ← Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs text-red-500 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-150 cursor-pointer font-medium">
            Log out
          </button>
        </div>
      </nav>

      {/* Mobile tab bar */}
      <div className="lg:hidden sticky top-[60px] z-10 bg-white border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden px-3 gap-0.5 py-2">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                item.active ? 'bg-[#EEF4F5] text-[#2A3E42]' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8">

        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6 md:mb-7">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Your public profile</p>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {isEditing ? 'Edit profile' : 'Profile'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing ? 'Update your details below and save when ready.' : 'This is what brands see when they discover you.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saved && !isEditing && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                <CheckIcon />
                Saved
              </span>
            )}
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="text-sm text-gray-500 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-all duration-150 cursor-pointer font-medium">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 sm:flex-none bg-[#7FA8AD] hover:bg-[#5D8A8F] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer text-center">
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-[#7FA8AD] hover:bg-[#5D8A8F] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer">
                <PencilIcon />
                Edit profile
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2.5">
            <svg width="16" height="16" className="flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* ── Profile hero card ── */}
        {profile && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm mb-5 md:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#7FA8AD] to-[#3D5087] flex items-center justify-center text-white text-2xl font-bold shadow-md select-none">
                  {(profile?.userId?.name || 'I')[0].toUpperCase()}
                </div>
                <div className={`absolute -bottom-1 -right-1 rounded-full border-2 border-white shadow-sm ${(profile?.platforms?.length || 0) > 0 ? 'bg-green-500' : 'bg-gray-300'}`} style={{ width: 18, height: 18 }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight leading-tight">
                      {profile?.userId?.name || 'Influencer'}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">{profile?.userId?.email}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                    profile?.userId?.plan === 'premium'
                      ? 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200'
                      : 'bg-[#EEF4F5] text-[#2A3E42] border-[#7FA8AD]/30'
                  }`}>
                    {profile?.userId?.plan === 'premium' ? '★ Premium' : 'Freemium'}
                  </span>
                </div>

                {profile?.bio && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-2 max-w-lg">{profile.bio}</p>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {profile?.city && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                      <MapPinIcon />{profile.city}
                    </span>
                  )}
                  {(profile?.niche || []).slice(0, 3).map((n: string, idx: number) => {
                    const chipColors = ['bg-teal-100 text-teal-700','bg-violet-100 text-violet-700','bg-amber-100 text-amber-700'];
                    return (
                      <span key={n} className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${chipColors[idx % chipColors.length]}`}>{n}</span>
                    );
                  })}
                  {(profile?.niche?.length || 0) > 3 && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">+{profile.niche.length - 3}</span>
                  )}
                  {(profile?.priceRangeMin || profile?.priceRangeMax) && (
                    <span className="inline-flex items-center text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-semibold border border-emerald-200/60">
                      ₹{(profile.priceRangeMin || 0).toLocaleString()} – ₹{(profile.priceRangeMax || 0).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-5 pt-4 border-t border-gray-100">
              {[
                { value: String(profile?.portfolioItems?.length || 0), label: 'Posts', accent: 'text-gray-900' },
                { value: formatFollowers(totalFollowers), label: 'Followers', accent: 'text-[#5D8A8F]' },
                { value: String(profile?.platforms?.length || 0), label: 'Platforms', accent: 'text-gray-900' },
                { value: avgEngagement ? `${avgEngagement}%` : '—', label: 'Avg. Engagement', accent: 'text-emerald-600' },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center text-center px-2 py-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className={`text-xl font-bold tabular-nums ${stat.accent}`}>{stat.value}</span>
                  <span className="text-[11px] text-gray-400 font-medium mt-0.5 leading-tight">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] gap-5 md:gap-6">

          {/* Left column */}
          <div className="flex flex-col gap-5">

            {/* About you */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <SectionHeader icon={isEditing ? <PencilIcon /> : <UserIcon />} title="About you" desc={isEditing ? 'Introduce yourself to brands' : undefined} />

              {isEditing ? (
                <div className="flex flex-col gap-5">
                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Bio <span className="text-gray-400 font-normal">(required)</span>
                    </label>
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Tell brands about yourself, your content style, and what makes your audience unique…"
                      rows={4}
                      maxLength={500}
                      className="w-full px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7FA8AD]/30 focus:border-[#7FA8AD] resize-none transition-all duration-150 bg-white"
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs text-gray-400">Write naturally — brands read every word</p>
                      <span className={`text-xs tabular-nums font-medium ${bio.length > 450 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {bio.length}/500
                      </span>
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-2">
                      <MapPinIcon />
                      City
                    </label>
                    <div className="relative">
                      <select
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7FA8AD]/30 focus:border-[#7FA8AD] transition-all duration-150 bg-white appearance-none cursor-pointer pr-9 ${
                          !city ? 'text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        <option value="" className="text-gray-400">Select your city</option>
                        {CITIES.map(c => <option key={c} value={c} className="text-gray-900">{c}</option>)}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  {/* Niche */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Niche <span className="text-gray-400 font-normal">— pick all that apply</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {NICHES.map(n => (
                        <button key={n} type="button" onClick={() => toggleNiche(n)}
                          className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-150 border cursor-pointer ${
                            niche.includes(n)
                              ? 'bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] border-transparent text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-500 hover:border-[#7FA8AD]/50 hover:bg-teal-50/50 hover:text-[#2A3E42]'
                          }`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Rate range (₹)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">₹</span>
                        <input
                          type="number"
                          value={priceRangeMin}
                          onChange={e => setPriceRangeMin(e.target.value)}
                          placeholder="5,000"
                          className="w-full pl-7 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7FA8AD]/30 focus:border-[#7FA8AD] transition-all duration-150 bg-white"
                        />
                        <span className="absolute -top-2 left-3 text-[10px] text-gray-400 bg-white px-1 font-medium">Min</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">₹</span>
                        <input
                          type="number"
                          value={priceRangeMax}
                          onChange={e => setPriceRangeMax(e.target.value)}
                          placeholder="25,000"
                          className="w-full pl-7 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7FA8AD]/30 focus:border-[#7FA8AD] transition-all duration-150 bg-white"
                        />
                        <span className="absolute -top-2 left-3 text-[10px] text-gray-400 bg-white px-1 font-medium">Max</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex flex-col gap-5">
                  {/* Bio */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bio</p>
                    {profile?.bio ? (
                      <p className="text-sm text-gray-800 leading-relaxed">{profile.bio}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No bio added yet.</p>
                    )}
                  </div>

                  {/* City & Niche row */}
                  <div className="flex flex-wrap gap-4">
                    <div className="min-w-[120px]">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <MapPinIcon /> City
                      </p>
                      {profile?.city ? (
                        <span className="inline-block bg-[#EEF4F5] text-[#2A3E42] px-3 py-1 rounded-full text-xs font-semibold">
                          {profile.city}
                        </span>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Not set</p>
                      )}
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Niche</p>
                      {(profile?.niche?.length ?? 0) > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {profile.niche.map((n: string, idx: number) => {
                            const colors = ['bg-teal-100 text-teal-800 border-teal-200','bg-violet-100 text-violet-800 border-violet-200','bg-amber-100 text-amber-800 border-amber-200','bg-pink-100 text-pink-800 border-pink-200','bg-emerald-100 text-emerald-800 border-emerald-200','bg-indigo-100 text-indigo-800 border-indigo-200','bg-orange-100 text-orange-800 border-orange-200','bg-cyan-100 text-cyan-800 border-cyan-200'];
                            return (
                            <span key={n} className={`border px-3 py-1 rounded-full text-xs font-semibold capitalize ${colors[idx % colors.length]}`}>
                              {n}
                            </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No niches selected</p>
                      )}
                    </div>
                  </div>

                  {/* Rate range */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rate range</p>
                    {profile?.priceRangeMin || profile?.priceRangeMax ? (
                      <span className="inline-block bg-gray-50 border border-gray-200 text-gray-800 px-3 py-1.5 rounded-xl text-sm font-semibold">
                        ₹{(profile.priceRangeMin || 0).toLocaleString()} – ₹{(profile.priceRangeMax || 0).toLocaleString()}
                      </span>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Not set</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Platform stats */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <BarChartIcon />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[15px]">Social platform stats</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isEditing ? 'Add your audience metrics' : `${profile?.platforms?.length ?? 0} platform${(profile?.platforms?.length ?? 0) !== 1 ? 's' : ''} connected`}
                    </p>
                  </div>
                </div>
                {isEditing && (
                  <div className="flex flex-wrap items-center gap-2">
                    {PLATFORMS.filter(p => !platforms.find(x => x.name === p)).map(p => (
                      <button key={p} onClick={() => addPlatform(p)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-[#EEF4F5] hover:border-[#7FA8AD]/40 hover:text-[#2A3E42] capitalize transition-all duration-150 cursor-pointer font-medium">
                        <PlusIcon />
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isEditing ? (
                platforms.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF4F5] text-[#7FA8AD] flex items-center justify-center mx-auto mb-3">
                      <BarChartIcon />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">No platforms added yet</p>
                    <p className="text-xs text-gray-400">Use the buttons above to add Instagram, YouTube, or Facebook</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {platforms.map((platform, index) => (
                      <div key={platform.name} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm ${
                              platform.name === 'instagram' ? 'bg-gradient-to-br from-[#ee2a7b] to-[#6228d7]' :
                              platform.name === 'youtube' ? 'bg-gradient-to-br from-[#FF0000] to-[#CC0000]' :
                              'bg-gradient-to-br from-[#1877F2] to-[#0a5ed1]'
                            }`}>
                              {platform.name.slice(0, 2)}
                            </div>
                            <span className="text-sm font-bold capitalize text-gray-900">{platform.name}</span>
                          </div>
                          <button onClick={() => removePlatform(index)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors duration-150 cursor-pointer font-medium px-2 py-1 rounded-lg hover:bg-red-50">
                            <TrashIcon />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 p-4">
                          {[
                            { label: 'Followers', field: 'followers', placeholder: '10,000' },
                            { label: 'Avg likes', field: 'avgLikes', placeholder: '500' },
                            { label: 'Avg comments', field: 'avgComments', placeholder: '50' },
                            { label: 'Avg shares', field: 'avgShares', placeholder: '100' },
                          ].map(({ label, field, placeholder }) => (
                            <div key={field}>
                              <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                              <input
                                type="number"
                                value={platform[field] || ''}
                                onChange={e => updatePlatform(index, field, parseInt(e.target.value) || 0)}
                                placeholder={placeholder}
                                className="w-full px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7FA8AD]/30 focus:border-[#7FA8AD] transition-all duration-150 bg-white tabular-nums"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* View mode platforms */
                (profile?.platforms?.length ?? 0) === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 text-center">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF4F5] text-[#7FA8AD] flex items-center justify-center mx-auto mb-3">
                      <BarChartIcon />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">No platforms connected</p>
                    <p className="text-xs text-gray-400 mb-4">Click Edit profile to add your social stats</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {profile.platforms.map((platform: any) => {
                      const engagementRate = platform.followers > 0
                        ? (((platform.avgLikes || 0) + (platform.avgComments || 0)) / platform.followers * 100).toFixed(2)
                        : '0.00';
                      return (
                        <div key={platform.name}
                          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition-all duration-150">
                          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[11px] font-bold text-white uppercase shadow-sm flex-shrink-0 ${
                            platform.name === 'instagram' ? 'bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]' :
                            platform.name === 'youtube' ? 'bg-gradient-to-br from-[#FF0000] to-[#CC0000]' :
                            'bg-gradient-to-br from-[#1877F2] to-[#0a5ed1]'
                          }`}>
                            {platform.name.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-semibold capitalize text-gray-900">{platform.name}</p>
                              <span className={`text-sm font-bold tabular-nums ${
                                platform.name === 'instagram' ? 'text-pink-600' :
                                platform.name === 'youtube' ? 'text-red-600' : 'text-blue-600'
                              }`}>{engagementRate}%</span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-gray-400">{formatFollowers(platform.followers)} followers</p>
                              <p className="text-xs text-gray-400 hidden sm:block">engagement</p>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full bg-gradient-to-r ${
                                platform.name === 'instagram' ? 'from-[#ee2a7b] to-[#6228d7]' :
                                platform.name === 'youtube' ? 'from-[#FF0000] to-[#FF6B6B]' :
                                'from-[#1877F2] to-[#42A5F5]'
                              }`} style={{ width: `${Math.min((parseFloat(engagementRate) / 10) * 100, 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>

          </div>

          {/* Right column — Content with tabs */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

            {/* Section header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <ImageIcon />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">Content</h3>
                  <p className="text-xs text-gray-400">{allPortfolioItems.length} item{allPortfolioItems.length !== 1 ? 's' : ''} total</p>
                </div>
              </div>
              {isEditing && (
                <button
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-[#EEF4F5] text-[#2A3E42] border border-[#7FA8AD]/40 rounded-xl hover:bg-[#7FA8AD]/10 transition-all duration-150 cursor-pointer disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Uploading…
                    </>
                  ) : (
                    <><PlusIcon /> Add content</>
                  )}
                </button>
              )}
            </div>

            {/* Tab bar */}
            <div className="flex items-center px-2 border-b border-gray-100 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              {([
                {
                  id: 'all' as const,
                  label: 'All Posts',
                  count: allPortfolioItems.length,
                  icon: <GridIcon />,
                },
                {
                  id: 'reels' as const,
                  label: 'Reels',
                  count: allPortfolioItems.filter(i => i.type === 'video').length,
                  icon: <ReelIcon />,
                },
                {
                  id: 'photos' as const,
                  label: 'Photos',
                  count: allPortfolioItems.filter(i => i.type === 'image').length,
                  icon: <PhotoTabIcon />,
                },
                {
                  id: 'products' as const,
                  label: 'Products',
                  count: 0,
                  icon: <ProductIcon />,
                },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-3 text-[13px] font-semibold border-b-2 transition-all duration-150 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-[#7FA8AD] text-[#2A3E42]'
                      : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <span className={`transition-colors duration-150 ${activeTab === tab.id ? 'text-[#7FA8AD]' : 'text-gray-300'}`}>
                    {tab.icon}
                  </span>
                  {tab.label}
                  <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-all duration-150 ${
                    activeTab === tab.id ? 'bg-[#EEF4F5] text-[#5D8A8F]' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Content area */}
            <div className="p-5">

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                  e.target.value = '';
                }}
              />

              {/* Pending uploads banner */}
              {pendingUploads.length > 0 && (
                <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-[11px] text-amber-700 font-medium">
                    {pendingUploads.length} upload{pendingUploads.length > 1 ? 's' : ''} pending — click <strong>Save changes</strong> to publish.
                  </p>
                </div>
              )}

              {/* Upload drop zone (edit mode, only on relevant tabs) */}
              {isEditing && activeTab !== 'products' && allPortfolioItems.length === 0 && !uploading && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 hover:border-[#7FA8AD] hover:bg-[#EEF4F5]/30 rounded-xl p-8 text-center transition-all duration-200 mb-5 cursor-pointer group"
                >
                  <div className="text-gray-300 group-hover:text-[#7FA8AD] transition-colors duration-200 flex justify-center mb-3">
                    <UploadCloudIcon />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Tap to upload</p>
                  <p className="text-xs text-gray-400">Photos · Videos · Max 10 MB / 100 MB</p>
                </div>
              )}

              {/* Products tab — coming soon */}
              {activeTab === 'products' ? (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EEF4F5] to-teal-50 border border-[#7FA8AD]/20 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7FA8AD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Product showcase coming soon</p>
                  <p className="text-xs text-gray-400 max-w-[220px] mx-auto leading-relaxed">
                    Tag products from your posts so brands can see exactly what you promote.
                  </p>
                  <span className="mt-4 inline-block text-xs font-semibold px-3 py-1.5 bg-[#EEF4F5] text-[#5D8A8F] rounded-full border border-[#7FA8AD]/30">
                    Launching soon
                  </span>
                </div>
              ) : filteredPortfolioItems.length === 0 ? (
                /* Empty state per tab */
                <div className="py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#EEF4F5] flex items-center justify-center mx-auto mb-4">
                    {activeTab === 'reels' ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7FA8AD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="#7FA8AD" stroke="none"/>
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7FA8AD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1.5">
                    {activeTab === 'reels' ? 'No reels yet' : 'No photos yet'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isEditing
                      ? activeTab === 'reels' ? 'Upload a video to showcase your Reels.' : 'Upload photos to build your portfolio.'
                      : activeTab === 'reels' ? 'No video content uploaded yet.' : 'No photo content uploaded yet.'}
                  </p>
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
                    >
                      <PlusIcon /> Upload now
                    </button>
                  )}
                </div>
              ) : (
                /* Content grid */
                <div className="grid grid-cols-3 gap-2">
                  {filteredPortfolioItems.map((item, index) => (
                    <div
                      key={item._id}
                      className={`relative aspect-square rounded-xl overflow-hidden group border-2 transition-all duration-150 ${
                        item.pending
                          ? 'border-amber-400'
                          : (item.isVisible === false)
                            ? 'border-gray-200 opacity-60'
                            : 'border-transparent hover:border-[#7FA8AD]/40'
                      }`}
                    >
                      {item.type === 'image' ? (
                        <img
                          src={item.cloudinaryUrl}
                          alt={`Content ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt={`Reel ${index + 1}`} className="w-full h-full object-cover opacity-75" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
                          )}
                          {/* Play button */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-200 flex items-end justify-between p-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                          item.type === 'video'
                            ? 'bg-purple-600/90 text-white backdrop-blur-sm'
                            : 'bg-[#5D8A8F]/90 text-white backdrop-blur-sm'
                        }`}>
                          {item.type === 'video' ? 'REEL' : 'PHOTO'}
                        </span>
                        {item.pending ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-400 text-white">Unsaved</span>
                        ) : item.isVisible === false ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/50 text-white backdrop-blur-sm">Hidden</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Freemium notice */}
              <div className="mt-5 p-3.5 bg-[#EEF4F5] border border-[#7FA8AD]/30 rounded-xl text-xs text-[#2A3E42] leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="text-[#7FA8AD] mt-0.5 flex-shrink-0"><LockIcon /></span>
                  <p>
                    <strong>Upload freely.</strong> On freemium, brands see your 3 most recent items.{' '}
                    <Link href="/influencer/billing" className="text-[#5D8A8F] font-semibold hover:underline cursor-pointer">
                      Upgrade to show all →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
