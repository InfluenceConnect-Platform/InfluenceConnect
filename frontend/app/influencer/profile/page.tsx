'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import InfluencerNav from '@/components/shared/InfluencerNav';
import { useTheme } from '@/lib/useTheme';

const NICHES = ['beauty', 'fashion', 'food', 'fitness', 'lifestyle', 'travel', 'tech', 'books'];
const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad'];
const PLATFORMS = ['instagram', 'youtube', 'facebook'];

/* ─── brand-view style constants ───────────────────── */
const NICHE_CHIPS: Record<string, string> = {
  beauty:    'bg-pink-50 text-pink-700 border-pink-200',
  fashion:   'bg-purple-50 text-purple-700 border-purple-200',
  food:      'bg-orange-50 text-orange-700 border-orange-200',
  fitness:   'bg-amber-50 text-amber-700 border-amber-200',
  lifestyle: 'bg-violet-50 text-violet-700 border-violet-200',
  travel:    'bg-teal-50 text-teal-700 border-teal-200',
  tech:      'bg-blue-50 text-blue-700 border-blue-200',
  books:     'bg-indigo-50 text-indigo-700 border-indigo-200',
};
const LEVEL_BADGE: Record<string, string> = {
  elite:        'bg-amber-50 text-amber-700 border border-amber-200',
  professional: 'bg-violet-50 text-violet-700 border border-violet-200',
  growing:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  starter:      'bg-gray-100 text-gray-500 border border-gray-200',
};
const AVATAR_GRADS = [
  'from-[#5D8A8F] to-[#7FA8AD]',
  'from-violet-500 to-purple-600',
  'from-teal-500 to-cyan-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-green-600',
];
const PLATFORM_ACCENT: Record<string, { bar: string; label: string }> = {
  instagram: { bar: 'border-l-pink-400',  label: 'text-pink-600' },
  youtube:   { bar: 'border-l-red-400',   label: 'text-red-600'  },
  facebook:  { bar: 'border-l-blue-500',  label: 'text-blue-600' },
};
const formatNum = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};

/* ─── platform logos ───────────────────────────────── */
const InstagramLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <defs>
      <radialGradient id="ig-pf-grad" cx="30%" cy="110%" r="130%">
        <stop offset="0%" stopColor="#ffd676"/>
        <stop offset="25%" stopColor="#f46f30"/>
        <stop offset="50%" stopColor="#e1306c"/>
        <stop offset="75%" stopColor="#833ab4"/>
        <stop offset="100%" stopColor="#4a23a8"/>
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ig-pf-grad)"/>
    <rect x="6.5" y="6.5" width="11" height="11" rx="3.5" fill="none" stroke="white" strokeWidth="1.6"/>
    <circle cx="12" cy="12" r="3" fill="none" stroke="white" strokeWidth="1.6"/>
    <circle cx="17.2" cy="6.8" r="1.1" fill="white"/>
  </svg>
);
const YouTubeLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect width="24" height="24" rx="5" fill="#FF0000"/>
    <path d="M17.8 8.6c-.2-.7-.8-1.3-1.5-1.5C15 6.8 12 6.8 12 6.8s-3 0-4.3.3c-.7.2-1.3.8-1.5 1.5C6 9.9 6 12 6 12s0 2.1.2 3.4c.2.7.8 1.3 1.5 1.5C9 17.2 12 17.2 12 17.2s3 0 4.3-.3c.7-.2 1.3-.8 1.5-1.5.2-1.3.2-3.4.2-3.4s0-2.1-.2-3.4z" fill="white"/>
    <polygon points="10.5,9.5 10.5,14.5 14.5,12" fill="#FF0000"/>
  </svg>
);
const FacebookLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect width="24" height="24" rx="5" fill="#1877F2"/>
    <path d="M16 4h-2.5C11.6 4 10 5.6 10 7.7V10H7.5v3H10v7h3v-7h2.5l.5-3H13V7.7c0-.4.3-.7.7-.7H16V4z" fill="white"/>
  </svg>
);

/* ─── media modal ──────────────────────────────────── */
type MediaItem = { type: 'image' | 'video'; src: string; thumbnail?: string; label?: string };

function MediaModal({ items, startIndex, onClose }: { items: MediaItem[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const videoRef = useRef<HTMLVideoElement>(null);
  const current = items[idx];

  const prev = useCallback(() => setIdx(i => (i - 1 + items.length) % items.length), [items.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % items.length), [items.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.load();
    }
  }, [idx]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const single = items.length === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.92)' }} onClick={onClose}>
      <button onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
        aria-label="Close">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      {!single && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white text-xs font-semibold px-3 py-1 rounded-full">
          {idx + 1} / {items.length}
        </div>
      )}
      {!single && (
        <button onClick={e => { e.stopPropagation(); prev(); }}
          className="absolute left-3 sm:left-5 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
          aria-label="Previous">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
      )}
      <div className="relative flex items-center justify-center w-full h-full px-16 sm:px-20" onClick={e => e.stopPropagation()}>
        {current.type === 'video' ? (
          <video ref={videoRef} key={current.src} src={current.src} controls autoPlay playsInline
            className="max-w-full max-h-[88vh] w-auto h-auto rounded-xl shadow-2xl object-contain"
            style={{ maxWidth: 'min(680px, 90vw)' }} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={current.src} src={current.src} alt={current.label ?? 'media'}
            className="max-w-full max-h-[88vh] w-auto h-auto rounded-xl shadow-2xl object-contain"
            style={{ maxWidth: 'min(680px, 90vw)' }} />
        )}
      </div>
      {!single && (
        <button onClick={e => { e.stopPropagation(); next(); }}
          className="absolute right-3 sm:right-5 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
          aria-label="Next">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      )}
      {!single && items.length <= 20 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {items.map((_, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
              className={`rounded-full transition-all cursor-pointer ${i === idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'}`} />
          ))}
        </div>
      )}
    </div>
  );
}


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
  const { isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'reels' | 'photos' | 'products' | 'stories'>('all');

  // Brand-view-style portfolio tab (used in view mode)
  const [viewTab, setViewTab] = useState<'all' | 'reels' | 'photos' | 'products' | 'stories'>('all');

  // Media modal (view mode)
  const [modalItems,      setModalItems]      = useState<MediaItem[]>([]);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [modalOpen,       setModalOpen]       = useState(false);

  const openModal = (items: MediaItem[], startIndex = 0) => {
    setModalItems(items);
    setModalStartIndex(startIndex);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const [bio, setBio] = useState('');
  const [niche, setNiche] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [priceRangeMin, setPriceRangeMin] = useState('');
  const [priceRangeMax, setPriceRangeMax] = useState('');
  const [platforms, setPlatforms] = useState<any[]>([]);
  // Uploads buffered locally — only written to DB when "Save changes" is clicked
  const [pendingUploads, setPendingUploads] = useState<{
    cloudinaryUrl: string; thumbnailUrl: string; type: string; section: string; fileSize: number; duration: number;
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

  const handleDeleteItem = async (itemId: string, isPending: boolean) => {
    if (isPending) {
      // Remove from local pending buffer — no network call needed
      const pendingIdx = parseInt(itemId.replace('pending-', ''), 10);
      setPendingUploads(prev => prev.filter((_, i) => i !== pendingIdx));
      return;
    }
    try {
      await api.delete(`/api/upload/portfolio/${itemId}`);
      setProfile((prev: any) => prev
        ? { ...prev, portfolioItems: prev.portfolioItems.filter((i: any) => i._id !== itemId) }
        : prev
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete item.');
    }
  };

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
      const uploadSection =
        activeTab === 'products' ? 'products'
        : activeTab === 'stories' ? 'stories'
        : isVideo ? 'reels'
        : 'photos';
      setPendingUploads(prev => [...prev, {
        cloudinaryUrl: uploadData.secure_url,
        thumbnailUrl: isVideo ? uploadData.secure_url.replace('/upload/', '/upload/so_0/').replace(/\.[^/.]+$/, '.jpg') : '',
        type: isVideo ? 'video' : 'image',
        section: uploadSection,
        fileSize: file.size,
        duration: uploadData.duration || 0,
      }]);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCoverPhoto = async () => {
    setUploadingCover(true);
    try {
      await api.delete('/api/upload/cover-photo');
      setProfile((prev: any) => prev ? { ...prev, coverPhotoUrl: '' } : prev);
    } catch (err: any) {
      setError(err.message || 'Failed to remove cover photo.');
    } finally { setUploadingCover(false); }
  };

  const handleCoverPhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Cover photo must be an image.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Cover photo must be under 10 MB.'); return; }
    setUploadingCover(true); setError('');
    try {
      const sigRes = await api.get('/api/upload/signature?context=cover-photo');
      const { signature, timestamp, apiKey, cloudName, folder } = sigRes.data;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', apiKey);
      formData.append('folder', folder);
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
      const data = await uploadRes.json();
      if (data.error) throw new Error(data.error.message);
      await api.post('/api/upload/cover-photo', { coverPhotoUrl: data.secure_url });
      setProfile((prev: any) => prev ? { ...prev, coverPhotoUrl: data.secure_url } : prev);
    } catch (err: any) {
      setError(err.message || 'Cover photo upload failed.');
    } finally { setUploadingCover(false); }
  };

  const handleRemoveProfilePic = async () => {
    setUploadingPic(true);
    try {
      await api.delete('/api/upload/profile-picture');
      setProfile((prev: any) => prev ? { ...prev, profilePicUrl: '' } : prev);
    } catch (err: any) {
      setError(err.message || 'Failed to remove profile picture.');
    } finally { setUploadingPic(false); }
  };

  const handleProfilePicUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Profile picture must be an image.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Profile picture must be under 5 MB.'); return; }
    setUploadingPic(true); setError('');
    try {
      const sigRes = await api.get('/api/upload/signature?context=profile-pic');
      const { signature, timestamp, apiKey, cloudName, folder } = sigRes.data;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', apiKey);
      formData.append('folder', folder);
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
      const data = await uploadRes.json();
      if (data.error) throw new Error(data.error.message);
      await api.post('/api/upload/profile-picture', { profilePicUrl: data.secure_url });
      setProfile((prev: any) => prev ? { ...prev, profilePicUrl: data.secure_url } : prev);
    } catch (err: any) {
      setError(err.message || 'Profile picture upload failed.');
    } finally { setUploadingPic(false); }
  };

  const isPremiumUser = profile?.userId?.plan === 'premium';

  // Merge saved + pending uploads for the content grid
  const allPortfolioItems: Array<{
    _id: string; type: string; section?: string; cloudinaryUrl: string; thumbnailUrl: string;
    isVisible?: boolean; pending: boolean; fileSize?: number; duration?: number;
  }> = [
    ...(profile?.portfolioItems || []).map((i: { _id: string; type: string; section?: string; cloudinaryUrl: string; thumbnailUrl: string; isVisible: boolean }) => ({ ...i, pending: false })),
    ...pendingUploads.map((i, idx) => ({ ...i, _id: `pending-${idx}`, isVisible: true, pending: true })),
  ];
  const itemMatchesTab = (i: { type: string; section?: string }, tab: string): boolean => {
    if (i.section) return i.section === tab;
    // backwards compat for items saved before section field existed
    if (tab === 'reels') return i.type === 'video';
    if (tab === 'photos') return i.type === 'image';
    return false;
  };
  const filteredPortfolioItems = activeTab === 'all'
    ? allPortfolioItems
    : allPortfolioItems.filter(i => itemMatchesTab(i, activeTab));

  const totalFollowers = (profile?.platforms || []).reduce((acc: number, p: { followers?: number }) => acc + (p.followers || 0), 0);
  const engagingPlatforms = (profile?.platforms || []).filter((p: { followers?: number }) => (p.followers || 0) > 0);
  const avgEngagement = engagingPlatforms.length > 0
    ? (engagingPlatforms.reduce((acc: number, p: { followers?: number; avgLikes?: number; avgComments?: number }) =>
        acc + (((p.avgLikes || 0) + (p.avgComments || 0)) / (p.followers || 1) * 100), 0) / engagingPlatforms.length
      ).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#060D1A]' : 'bg-[#F7F9FA]'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#7FA8AD] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#060D1A]' : 'bg-[#F7F9FA]'}`}>

      <InfluencerNav user={null} profilePicUrl={profile?.profilePicUrl} />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8">

        {/* Page header */}
        <div className={`relative overflow-hidden mb-6 md:mb-7 rounded-2xl border shadow-sm ${isDark ? 'bg-[#0E1B2E] border-slate-700/60' : 'bg-white border-gray-200/80'}`}>
          {/* Decorative gradient layer */}
          <div className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${isDark ? 'from-[#1a2e32] via-[#0E1B2E] to-[#0d1f2e]' : 'from-[#EEF4F5] via-white to-[#F4FBFB]'}`} />
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#7FA8AD]/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full bg-[#5D8A8F]/10 blur-2xl pointer-events-none" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" preserveAspectRatio="none">
            <defs>
              <pattern id="hdr-dots" width="14" height="14" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1" fill="#2A3E42"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hdr-dots)"/>
          </svg>

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-5 sm:px-7 py-5 sm:py-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${isDark ? 'bg-slate-800/70 text-slate-300 border-slate-700/60' : 'bg-[#EEF4F5] text-[#2A3E42] border-[#7FA8AD]/30'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                  {isEditing ? 'Editing' : 'Live preview'}
                </span>
                <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  Brand-facing
                </span>
              </div>
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight leading-tight ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                {isEditing ? (
                  <>Edit your <span className="bg-gradient-to-r from-[#5D8A8F] to-[#7FA8AD] bg-clip-text text-transparent">profile</span></>
                ) : (
                  <>Your <span className="bg-gradient-to-r from-[#5D8A8F] to-[#7FA8AD] bg-clip-text text-transparent">creator</span> profile</>
                )}
              </h1>
              <p className={`text-sm mt-1.5 max-w-md leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {isEditing
                  ? 'Polish your bio, niches, and social stats — changes go live once you save.'
                  : 'This is exactly what brands see when they discover you. Make every detail count.'}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              {saved && !isEditing && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-700 font-semibold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 shadow-sm">
                  <CheckIcon />
                  Saved
                </span>
              )}
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className={`text-sm px-4 py-2.5 border rounded-xl transition-all duration-150 cursor-pointer font-semibold shadow-sm ${isDark ? 'text-slate-300 bg-slate-800/60 border-slate-700 hover:bg-slate-700/60 hover:text-slate-100' : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300'}`}>
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="group relative flex items-center gap-2 bg-gradient-to-r from-[#5D8A8F] to-[#7FA8AD] hover:from-[#4A7378] hover:to-[#6B9499] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
                    {saving ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        Saving…
                      </>
                    ) : (
                      <>
                        <CheckIcon />
                        Save changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <a
                    href={profile?.slug ? `/brand/creator/${profile.slug}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`hidden sm:flex items-center gap-1.5 text-sm px-3.5 py-2.5 border rounded-xl transition-all duration-150 cursor-pointer font-semibold shadow-sm ${isDark ? 'text-slate-300 bg-slate-800/60 border-slate-700 hover:bg-slate-700/60 hover:text-slate-100' : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300'}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Open public link
                  </a>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-[#5D8A8F] to-[#7FA8AD] hover:from-[#4A7378] hover:to-[#6B9499] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer overflow-hidden">
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-20%,rgba(255,255,255,0.35),transparent_60%)] pointer-events-none" />
                    <span className="relative flex items-center gap-2">
                      <PencilIcon />
                      Edit profile
                    </span>
                  </button>
                </>
              )}
            </div>
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

        {/* ═══════════════════════════════════════════════════════
            VIEW MODE — brand-creator-style profile
            ═══════════════════════════════════════════════════════ */}
        {!isEditing && profile && (() => {
          const name       = profile.userId?.name ?? 'Creator';
          const code       = name.charCodeAt(0) || 0;
          const avatarGrad = AVATAR_GRADS[code % AVATAR_GRADS.length];

          const primary = (profile.platforms ?? []).reduce(
            (mx: any, p: any) => p.followers > (mx?.followers ?? 0) ? p : mx, null as any
          );
          const totalFollowersV = (profile.platforms ?? []).reduce((s: number, p: any) => s + (p.followers ?? 0), 0);
          const avgEngV = profile.platforms?.length
            ? ((profile.platforms.reduce((s: number, p: any) => s + (p.engagementRate ?? 0), 0)) / profile.platforms.length).toFixed(1)
            : '0';

          const isPremium = profile?.userId?.plan === 'premium';
          // Always show all items to the owner — items beyond the free limit just get a
          // "hidden from brands" badge so the influencer knows which ones brands can't see.
          const visible  = profile.portfolioItems ?? [];
          const reels    = visible.filter((i: any) => i.section === 'reels'    || (!i.section && i.type === 'video'));
          const photos   = visible.filter((i: any) => i.section === 'photos'   || (!i.section && i.type === 'image'));
          const products = visible.filter((i: any) => i.section === 'products');
          const stories  = visible.filter((i: any) => i.section === 'stories');
          const tabMedia: Record<'all' | 'reels' | 'photos' | 'products' | 'stories', any[]> = { all: visible, reels, photos, products, stories };

          const sectionLabel: Record<string, string> = {
            reels: 'Reel', photos: 'Photo', products: 'Product', stories: 'Story',
          };

          const buildMediaItems = (list: any[]): MediaItem[] =>
            list.map(item => ({
              type:      item.type === 'video' ? 'video' : 'image',
              src:       item.cloudinaryUrl,
              thumbnail: item.thumbnailUrl || undefined,
              label:     sectionLabel[item.section] ?? (item.type === 'video' ? 'Reel' : 'Photo'),
            }));

          const TABS: { key: 'all' | 'reels' | 'photos' | 'products' | 'stories'; label: string; count: number }[] = [
            { key: 'all',      label: 'All',      count: visible.length   },
            { key: 'reels',    label: 'Reels',    count: reels.length     },
            { key: 'photos',   label: 'Photos',   count: photos.length    },
            { key: 'products', label: 'Products', count: products.length  },
            { key: 'stories',  label: 'Stories',  count: stories.length   },
          ];

          const card = 'bg-white rounded-2xl border border-gray-200/80 shadow-sm';

          return (
            <>
              {modalOpen && (
                <MediaModal items={modalItems} startIndex={modalStartIndex} onClose={closeModal} />
              )}

              <div className="max-w-3xl mx-auto space-y-4">

                {/* HERO */}
                <div className={`${card} overflow-hidden`}>
                  <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-[#1f3438] via-[#2A3E42] to-[#7FA8AD]">
                    {!profile.coverPhotoUrl && <>
                      <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
                      <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
                      <div className="absolute top-4 right-1/3 w-20 h-20 rounded-full bg-white/[0.03] pointer-events-none" />
                      <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" preserveAspectRatio="none">
                        <defs>
                          <pattern id="infl-diag" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                            <line x1="0" y1="0" x2="0" y2="20" stroke="white" strokeWidth="1"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#infl-diag)"/>
                      </svg>
                    </>}
                    {profile.coverPhotoUrl ? (
                      <div className="w-full h-full cursor-zoom-in"
                        onClick={() => openModal([{ type: 'image', src: profile.coverPhotoUrl, label: 'Cover Photo' }], 0)}
                        title="Click to view cover photo">
                        <img src={profile.coverPhotoUrl} alt="cover" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" />
                      </div>
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                  </div>

                  <div className="px-5 sm:px-7 pt-0 pb-6">
                    <div className="-mt-10 mb-4">
                      <div className={`relative z-10 w-[78px] h-[78px] sm:w-[88px] sm:h-[88px] rounded-full border-[3px] border-white ring-2 ring-[#5D8A8F]/20 shadow-lg overflow-hidden bg-gradient-to-br ${avatarGrad} flex items-center justify-center ${profile.profilePicUrl ? 'cursor-zoom-in' : ''}`}
                        onClick={() => {
                          if (profile.profilePicUrl)
                            openModal([{ type: 'image', src: profile.profilePicUrl, label: `${name}'s profile picture` }], 0);
                        }}
                        title={profile.profilePicUrl ? 'Click to view profile picture' : undefined}>
                        {profile.profilePicUrl
                          ? <img src={profile.profilePicUrl} alt={name} className="w-full h-full object-cover" />
                          : <span className="text-white font-bold text-3xl select-none">{name.charAt(0).toUpperCase()}</span>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 mb-1">
                      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{name}</h1>
                      {profile.level && (
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${LEVEL_BADGE[profile.level] ?? LEVEL_BADGE.starter}`}>
                          {profile.level}
                        </span>
                      )}
                    </div>
                    {profile.slug && <p className="text-sm text-gray-400 font-mono mb-3">@{profile.slug}</p>}

                    {(profile.niche ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {profile.niche.map((n: string) => (
                          <span key={n} className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full capitalize border ${NICHE_CHIPS[n] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {n}
                          </span>
                        ))}
                      </div>
                    )}

                    {profile.bio && (
                      <p className="text-[14px] text-gray-600 leading-relaxed mb-4 max-w-lg">{profile.bio}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[13px] text-gray-500 mb-5">
                      {profile.city && (
                        <span className="flex items-center gap-1.5 font-semibold bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                          <svg className="w-3 h-3 text-[#5D8A8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                          {profile.city}
                        </span>
                      )}
                      {(profile.platforms ?? []).map((p: any) => p.profileUrl && (
                        <a key={p.name} href={p.profileUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 font-semibold bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full hover:border-[#5D8A8F]/30 hover:bg-[#EEF4F5] transition-all">
                          {p.name === 'instagram' && <InstagramLogo size={13} />}
                          {p.name === 'youtube'   && <YouTubeLogo size={13} />}
                          {p.name === 'facebook'  && <FacebookLogo size={13} />}
                          <span className="capitalize text-[12px]">{p.name}</span>
                        </a>
                      ))}
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-4 border-t border-gray-100">
                      {[
                        { value: String(visible.length), label: 'Posts',
                          bg: 'bg-[#EEF4F5]', darkBg: 'dark:bg-[#0d2d33]', text: 'text-[#5D8A8F]',
                          icon: (<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>),
                        },
                        { value: formatNum(totalFollowersV), label: 'Followers',
                          bg: 'bg-violet-50', darkBg: 'dark:bg-violet-900/40', text: 'text-violet-600', darkText: 'dark:text-violet-400',
                          icon: (<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
                        },
                        { value: primary ? formatNum(primary.avgLikes ?? 0) : '—', label: 'Avg Likes',
                          bg: 'bg-rose-50', darkBg: 'dark:bg-rose-900/30', text: 'text-rose-500', darkText: 'dark:text-rose-400',
                          icon: (<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>),
                        },
                        { value: `${avgEngV}%`, label: 'Engagement',
                          bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/30', text: 'text-emerald-600', darkText: 'dark:text-emerald-400',
                          icon: (<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>),
                        },
                      ].map((s, i) => (
                        <div key={i} className={`relative ${s.bg} ${s.darkBg ?? ''} rounded-xl px-2 py-3 flex flex-col items-center gap-1 overflow-hidden`}>
                          <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-black/[0.04] pointer-events-none" />
                          <span className={`relative ${s.text} ${s.darkText ?? ''}`}>{s.icon}</span>
                          <p className="relative text-sm font-bold text-gray-900 dark:text-slate-100 tabular-nums leading-none">{s.value}</p>
                          <p className="relative text-[10px] text-gray-400 dark:text-slate-400 font-medium">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PLATFORM BREAKDOWN */}
                {(profile.platforms ?? []).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2.5 px-1">
                      <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#5D8A8F] to-[#7FA8AD]" />
                      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Platform Stats</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {profile.platforms.map((p: any) => {
                        const acc = PLATFORM_ACCENT[p.name] ?? { bar: 'border-l-gray-300', label: 'text-gray-500' };
                        return (
                          <div key={p.name} className={`${card} border-l-4 ${acc.bar} overflow-hidden`}>
                            <div className="relative flex items-center justify-between px-4 py-3 bg-gray-50/80 border-b border-gray-100 overflow-hidden">
                              <div className="relative flex items-center gap-2">
                                {p.name === 'instagram' && <InstagramLogo size={18} />}
                                {p.name === 'youtube'   && <YouTubeLogo size={18} />}
                                {p.name === 'facebook'  && <FacebookLogo size={18} />}
                                <span className={`text-sm font-bold capitalize ${acc.label}`}>{p.name}</span>
                              </div>
                              {p.profileUrl && (
                                <a href={p.profileUrl} target="_blank" rel="noopener noreferrer"
                                  className="relative flex items-center gap-1 text-[11px] font-semibold text-[#5D8A8F] hover:underline">
                                  Visit
                                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                                  </svg>
                                </a>
                              )}
                            </div>
                            <div className="relative px-4 py-4 grid grid-cols-2 gap-x-4 gap-y-3.5">
                              <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-gray-100/60 pointer-events-none" />
                              {[
                                { v: formatNum(p.followers ?? 0),   l: 'Followers'    },
                                { v: `${p.engagementRate ?? 0}%`,   l: 'Engagement'   },
                                { v: formatNum(p.avgLikes ?? 0),    l: 'Avg Likes'    },
                                { v: formatNum(p.avgComments ?? 0), l: 'Avg Comments' },
                              ].map((st, i) => (
                                <div key={i} className="relative">
                                  <p className="text-base font-bold text-gray-900 tabular-nums leading-tight">{st.v}</p>
                                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">{st.l}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* COLLAB DETAILS */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5 px-1">
                    <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#5D8A8F] to-[#7FA8AD]" />
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Collaboration Details</h2>
                  </div>

                  <div className={`relative ${card} p-5 mb-3 overflow-hidden`}>
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-emerald-50 pointer-events-none" />
                    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-emerald-100/60 pointer-events-none" />
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Collaboration Rate</p>
                          <p className={`text-xl font-bold mt-0.5 leading-tight ${profile.priceRangeMin > 0 ? 'text-gray-900' : 'text-gray-400 italic text-base'}`}>
                            {profile.priceRangeMin > 0
                              ? <>₹{profile.priceRangeMin.toLocaleString('en-IN')}<span className="text-gray-400 font-normal mx-1">–</span>₹{profile.priceRangeMax.toLocaleString('en-IN')}</>
                              : 'Not specified'}
                          </p>
                        </div>
                      </div>
                      {profile.priceRangeMin > 0 && (
                        <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">per post</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className={`relative ${card} p-5 overflow-hidden`}>
                      <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-[#EEF4F5] pointer-events-none" />
                      <div className="absolute -bottom-4 -right-4 w-14 h-14 rounded-full bg-[#C9DCDE]/60 pointer-events-none" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-[#EEF4F5] flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-[#5D8A8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                            </svg>
                          </div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Score</p>
                        </div>
                        <div className="flex items-end gap-1 mb-3">
                          <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{profile.credibilityScore ?? 0}</p>
                          <p className="text-sm text-gray-400 font-medium mb-0.5">/100</p>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#5D8A8F] to-[#7FA8AD] rounded-full transition-all duration-700"
                            style={{ width: `${profile.credibilityScore ?? 0}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className={`relative ${card} p-5 overflow-hidden`}>
                      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-amber-50 pointer-events-none" />
                      <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-amber-100/70 pointer-events-none" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          </div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Level</p>
                        </div>
                        <p className="text-xl font-bold text-gray-900 capitalize mb-1">{profile.level ?? 'Starter'}</p>
                        <p className="text-xs text-gray-400 font-medium">{profile.dealsCompleted ?? 0} deals done</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PORTFOLIO */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5 px-1">
                    <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#5D8A8F] to-[#7FA8AD]" />
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Portfolio</h2>
                  </div>
                  <div className={`${card} overflow-hidden`}>
                    <div className="flex bg-gray-50/60 border-b border-gray-100">
                      {TABS.map(tab => (
                        <button key={tab.key}
                          onClick={() => setViewTab(tab.key)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-bold transition-all cursor-pointer relative ${
                            viewTab === tab.key
                              ? 'text-[#5D8A8F] bg-white shadow-[inset_0_-2px_0_#5D8A8F]'
                              : 'text-gray-400 hover:text-gray-600 hover:bg-white/60'
                          }`}>
                          {tab.label}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${viewTab === tab.key ? 'bg-[#EEF4F5] text-[#5D8A8F]' : 'bg-gray-100 text-gray-400'}`}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {tabMedia[viewTab].length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                          <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-500">No content yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                          You haven&apos;t uploaded any {viewTab === 'all' ? 'posts' : viewTab} yet.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-px bg-gray-100">
                        {tabMedia[viewTab].map((item: any, i: number) => {
                          const mediaList = buildMediaItems(tabMedia[viewTab]);
                          const hiddenFromBrands = !isPremium && item.isVisible === false;
                          return (
                            <button key={item._id ?? i}
                              onClick={() => openModal(mediaList, i)}
                              className="relative aspect-square overflow-hidden bg-white group cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#5D8A8F]"
                              aria-label={item.type === 'video' ? 'Play reel' : 'View photo'}>
                              {item.type === 'video' ? (
                                <>
                                  {item.thumbnailUrl
                                    ? <img src={item.thumbnailUrl} alt="reel thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    : (
                                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-white/30" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                      </div>
                                    )
                                  }
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-full bg-black/50 group-hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                                      <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                    </div>
                                  </div>
                                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                    <span className="text-white text-[10px] font-semibold">Reel</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <img src={item.cloudinaryUrl} alt={`post-${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                                      </svg>
                                    </div>
                                  </div>
                                </>
                              )}
                              {item.isPinned && (
                                <div className="absolute top-2 left-2 bg-amber-400 rounded-md p-1">
                                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.707 10.708L16.293 9.294 13 12.587V2h-2v10.587L7.707 9.294 6.293 10.708 12 16.415z"/><path d="M18 20H6v2h12z"/>
                                  </svg>
                                </div>
                              )}
                              {/* "Hidden from brands" dim overlay for freemium overflow items */}
                              {hiddenFromBrands && (
                                <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-2 pointer-events-none">
                                  <span className="bg-amber-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                    Hidden from brands
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* CTA — edit your profile */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#2A3E42] via-[#5D8A8F] to-[#7FA8AD] sm:rounded-2xl px-6 py-6 shadow-lg">
                  <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
                  <div className="absolute -bottom-8 -left-6 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
                  <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-teal-100/80 text-[11px] font-semibold uppercase tracking-widest mb-1">Your public profile</p>
                      <p className="text-white text-lg font-bold tracking-tight">This is how brands see you</p>
                      <p className="text-teal-100/70 text-sm mt-0.5">Keep your bio, niche, and stats up to date to attract better collaborations.</p>
                    </div>
                    <button onClick={() => setIsEditing(true)}
                      className="flex-shrink-0 flex items-center gap-2 bg-white hover:bg-[#EEF4F5] text-[#2A3E42] px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer">
                      <PencilIcon />
                      Edit profile
                    </button>
                  </div>
                </div>

              </div>
            </>
          );
        })()}

        {/* ═══════════════════════════════════════════════════════
            EDIT MODE — existing form-based UI
            ═══════════════════════════════════════════════════════ */}
        {isEditing && (<>
        {/* ── Cover photo ── */}
        {profile && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-5 md:mb-6">
            <div className="relative group">
              <div className="h-36 sm:h-44 w-full overflow-hidden bg-gradient-to-r from-[#e0eafc] to-[#cfdef3]">
                {profile.coverPhotoUrl ? (
                  <img src={profile.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-sm text-gray-400 font-medium">No cover photo</p>
                  </div>
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-2 cursor-pointer transition-opacity"
                    onClick={() => coverPhotoInputRef.current?.click()}>
                    {uploadingCover ? (
                      <svg className="w-6 h-6 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                    ) : (
                      <>
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span className="text-white text-xs font-semibold">
                          {profile.coverPhotoUrl ? 'Change cover photo' : 'Upload cover photo'}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
              {isEditing && profile.coverPhotoUrl && (
                <button onClick={handleRemoveCoverPhoto} disabled={uploadingCover}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white text-xs px-2.5 py-1 rounded-lg font-medium transition-all disabled:opacity-50 cursor-pointer">
                  Remove
                </button>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-700">Cover Photo</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Displayed at the top of your public profile</p>
              </div>
              {isEditing && (
                <button onClick={() => coverPhotoInputRef.current?.click()} disabled={uploadingCover}
                  className="text-xs font-semibold text-[#5D8A8F] hover:text-[#5D8A8F] disabled:opacity-50 cursor-pointer transition-colors flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Upload
                </button>
              )}
            </div>
            <input ref={coverPhotoInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverPhotoUpload(f); e.target.value = ''; }} />
          </div>
        )}

        {/* ── Profile hero card ── */}
        {profile && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm mb-5 md:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className={`w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] flex items-center justify-center text-white text-2xl font-bold shadow-md select-none overflow-hidden ${isEditing ? 'cursor-pointer group/avatar' : ''}`}
                  onClick={() => { if (isEditing && !uploadingPic) profilePicInputRef.current?.click(); }}
                  title={isEditing ? (profile?.profilePicUrl ? 'Change profile picture' : 'Upload profile picture') : undefined}
                >
                  {profile?.profilePicUrl ? (
                    <img src={profile.profilePicUrl} alt={profile?.userId?.name || 'Profile'} className="w-full h-full object-cover" />
                  ) : (
                    (profile?.userId?.name || 'I')[0].toUpperCase()
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                      {uploadingPic ? (
                        <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                <div className={`absolute -bottom-1 -right-1 rounded-full border-2 border-white shadow-sm ${(profile?.platforms?.length || 0) > 0 ? 'bg-green-500' : 'bg-gray-300'}`} style={{ width: 18, height: 18 }} />
                {isEditing && profile?.profilePicUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveProfilePic}
                    disabled={uploadingPic}
                    className="absolute -top-2 -right-2 bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full w-6 h-6 flex items-center justify-center shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                    title="Remove profile picture"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
                <input ref={profilePicInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleProfilePicUpload(f); e.target.value = ''; }} />
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
                  count: allPortfolioItems.filter(i => itemMatchesTab(i, 'reels')).length,
                  icon: <ReelIcon />,
                },
                {
                  id: 'photos' as const,
                  label: 'Photos',
                  count: allPortfolioItems.filter(i => itemMatchesTab(i, 'photos')).length,
                  icon: <PhotoTabIcon />,
                },
                {
                  id: 'products' as const,
                  label: 'Products',
                  count: allPortfolioItems.filter(i => itemMatchesTab(i, 'products')).length,
                  icon: <ProductIcon />,
                },
                {
                  id: 'stories' as const,
                  label: 'Stories',
                  count: allPortfolioItems.filter(i => itemMatchesTab(i, 'stories')).length,
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>,
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

              {/* Upload drop zone (edit mode) — only shown when this section has no items at all */}
              {isEditing && allPortfolioItems.length === 0 && !uploading && (
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

              {filteredPortfolioItems.length === 0 && !uploading ? (
                /* Empty state per tab */
                <div className="py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#EEF4F5] flex items-center justify-center mx-auto mb-4">
                    {activeTab === 'reels' ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7FA8AD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="#7FA8AD" stroke="none"/>
                      </svg>
                    ) : activeTab === 'products' ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7FA8AD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                      </svg>
                    ) : activeTab === 'stories' ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7FA8AD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7FA8AD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1.5">
                    {activeTab === 'reels' ? 'No reels yet'
                      : activeTab === 'products' ? 'No products yet'
                      : activeTab === 'stories' ? 'No stories yet'
                      : activeTab === 'all' ? 'No content yet'
                      : 'No photos yet'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isEditing
                      ? activeTab === 'reels' ? 'Upload a video to showcase your Reels.'
                        : activeTab === 'products' ? 'Upload product photos for brands to browse.'
                        : activeTab === 'stories' ? 'Upload story screenshots or highlights.'
                        : 'Upload photos to build your portfolio.'
                      : activeTab === 'reels' ? 'No video content uploaded yet.'
                        : activeTab === 'products' ? 'No product content uploaded yet.'
                        : activeTab === 'stories' ? 'No stories uploaded yet.'
                        : 'No photo content uploaded yet.'}
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
                          : (!isPremiumUser && item.isVisible === false)
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
                            <img src={item.thumbnailUrl} alt={`Reel ${index + 1}`} className="w-full h-full object-cover opacity-75" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
                          item.section === 'products'
                            ? 'bg-orange-600/90 text-white backdrop-blur-sm'
                            : item.section === 'stories'
                              ? 'bg-pink-600/90 text-white backdrop-blur-sm'
                              : item.type === 'video'
                                ? 'bg-purple-600/90 text-white backdrop-blur-sm'
                                : 'bg-[#5D8A8F]/90 text-white backdrop-blur-sm'
                        }`}>
                          {item.section === 'products' ? 'PRODUCT'
                            : item.section === 'stories' ? 'STORY'
                            : item.type === 'video' ? 'REEL' : 'PHOTO'}
                        </span>
                        <div className="flex items-center gap-1">
                          {item.pending ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-400 text-white">Unsaved</span>
                          ) : (!isPremiumUser && item.isVisible === false) ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/50 text-white backdrop-blur-sm">Hidden</span>
                          ) : null}
                          {isEditing && (
                            <button
                              onClick={e => { e.stopPropagation(); handleDeleteItem(item._id, item.pending); }}
                              className="opacity-0 group-hover:opacity-100 transition-all duration-200 w-6 h-6 rounded-md bg-red-500/90 backdrop-blur-sm flex items-center justify-center hover:bg-red-600 cursor-pointer"
                              title="Delete"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Plan notice */}
              {isPremiumUser ? (
                <div className="mt-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 flex-shrink-0">★</span>
                    <p><strong>Premium active.</strong> All your uploaded content is visible to brands.</p>
                  </div>
                </div>
              ) : (
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
              )}
            </div>
          </div>

        </div>
        </>)}
      </main>
    </div>
  );
}
