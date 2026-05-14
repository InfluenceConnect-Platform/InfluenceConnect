'use client';

import { useState, useEffect, useRef } from 'react';
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

  const [bio, setBio] = useState('');
  const [niche, setNiche] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [priceRangeMin, setPriceRangeMin] = useState('');
  const [priceRangeMax, setPriceRangeMax] = useState('');
  const [platforms, setPlatforms] = useState<any[]>([]);

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

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/influencer/profile/me');
      const p = response.data.profile;
      setProfile(p);
      setBio(p.bio || '');
      setNiche(p.niche || []);
      setCity(p.city || '');
      setPriceRangeMin(p.priceRangeMin?.toString() || '');
      setPriceRangeMax(p.priceRangeMax?.toString() || '');
      setPlatforms(p.platforms || []);
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

      await api.post('/api/upload/portfolio', {
        cloudinaryUrl: uploadData.secure_url,
        thumbnailUrl: isVideo ? uploadData.secure_url.replace('/upload/', '/upload/so_0/') : '',
        type: isVideo ? 'video' : 'image',
        fileSize: file.size,
        duration: uploadData.duration || 0,
      });
      fetchProfile();
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

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

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 md:gap-6">

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
                              ? 'bg-[#EEF4F5] border-[#7FA8AD] text-[#2A3E42] shadow-sm'
                              : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                          }`}>
                          {niche.includes(n) && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#7FA8AD] mr-1.5 align-middle" />}
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
                          {profile.niche.map((n: string) => (
                            <span key={n} className="bg-[#EEF4F5] border border-[#7FA8AD]/40 text-[#2A3E42] px-3 py-1 rounded-full text-xs font-semibold capitalize">
                              {n}
                            </span>
                          ))}
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
                  <div className="w-7 h-7 rounded-lg bg-[#EEF4F5] text-[#7FA8AD] flex items-center justify-center flex-shrink-0">
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
                            <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold text-[#2A3E42] uppercase shadow-sm">
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
                          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[11px] font-bold text-[#2A3E42] uppercase shadow-sm flex-shrink-0">
                            {platform.name.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-semibold capitalize text-gray-900">{platform.name}</p>
                              <span className="text-sm font-bold text-[#5D8A8F] tabular-nums">{engagementRate}%</span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-gray-400">{formatFollowers(platform.followers)} followers</p>
                              <p className="text-xs text-gray-400 hidden sm:block">engagement</p>
                            </div>
                            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] rounded-full"
                                style={{ width: `${Math.min((parseFloat(engagementRate) / 10) * 100, 100)}%` }} />
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

          {/* Right column — Portfolio */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm h-fit lg:sticky lg:top-[76px]">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#EEF4F5] text-[#7FA8AD] flex items-center justify-center flex-shrink-0">
                  <ImageIcon />
                </div>
                <h3 className="font-semibold text-gray-900 text-[15px]">Portfolio</h3>
              </div>
              <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                {profile?.portfolioItems?.length || 0} items
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-5 ml-[37px]">
              Freemium shows your 3 most recent items to brands.
            </p>

            {/* Upload area — only in edit mode */}
            {isEditing && (
              <>
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 sm:p-7 text-center transition-all duration-200 mb-5 ${
                    uploading
                      ? 'border-[#7FA8AD]/40 bg-[#EEF4F5]/50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-[#7FA8AD] hover:bg-[#EEF4F5]/30 cursor-pointer group'
                  }`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="w-8 h-8 border-2 border-[#7FA8AD] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-semibold text-[#5D8A8F]">Uploading…</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-gray-300 group-hover:text-[#7FA8AD] transition-colors duration-200 flex justify-center mb-3">
                        <UploadCloudIcon />
                      </div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Tap to upload</p>
                      <p className="text-xs text-gray-400">Photos · Videos · Max 10 MB / 100 MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </>
            )}

            {/* Portfolio grid */}
            {profile?.portfolioItems?.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mb-5">
                {profile.portfolioItems.map((item: any, index: number) => (
                  <div key={item._id}
                    className={`aspect-square rounded-xl overflow-hidden relative border-2 ${
                      item.isVisible ? 'border-[#7FA8AD]/50' : 'border-gray-200 opacity-55'
                    }`}>
                    {item.type === 'image' ? (
                      <img src={item.cloudinaryUrl} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                      </div>
                    )}
                    <div className={`absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0.5 rounded-md font-semibold backdrop-blur-sm ${
                      item.isVisible ? 'bg-white/90 text-[#5D8A8F]' : 'bg-white/80 text-gray-400'
                    }`}>
                      {item.isVisible ? 'Visible' : 'Hidden'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center mb-5">
                <p className="text-xs text-gray-400">
                  {isEditing ? 'No items yet — upload your first piece of work above.' : 'No portfolio items yet.'}
                </p>
              </div>
            )}

            {/* Freemium notice */}
            <div className="p-3.5 bg-[#EEF4F5] border border-[#7FA8AD]/30 rounded-xl text-xs text-[#2A3E42] leading-relaxed">
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
      </main>
    </div>
  );
}
