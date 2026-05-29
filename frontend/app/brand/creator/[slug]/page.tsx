'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';

/* ─── constants ────────────────────────────────────── */

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
  'from-[#3D5087] to-[#6B7FBB]',
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
      <radialGradient id="igp" cx="30%" cy="110%" r="130%">
        <stop offset="0%" stopColor="#ffd676"/>
        <stop offset="25%" stopColor="#f46f30"/>
        <stop offset="50%" stopColor="#e1306c"/>
        <stop offset="75%" stopColor="#833ab4"/>
        <stop offset="100%" stopColor="#4a23a8"/>
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#igp)"/>
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

/* ─── media viewer modal ───────────────────────────── */

type MediaItem = {
  type: 'image' | 'video';
  src: string;
  thumbnail?: string;
  label?: string;
};

function MediaModal({
  items,
  startIndex,
  onClose,
}: {
  items: MediaItem[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const videoRef = useRef<HTMLVideoElement>(null);
  const current = items[idx];

  const prev = useCallback(() => setIdx(i => (i - 1 + items.length) % items.length), [items.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % items.length), [items.length]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowLeft')   prev();
      if (e.key === 'ArrowRight')  next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  // Pause/reset video when switching slides
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.load();
    }
  }, [idx]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const single = items.length === 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
        aria-label="Close"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Counter */}
      {!single && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white text-xs font-semibold px-3 py-1 rounded-full">
          {idx + 1} / {items.length}
        </div>
      )}

      {/* Prev */}
      {!single && (
        <button
          onClick={e => { e.stopPropagation(); prev(); }}
          className="absolute left-3 sm:left-5 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
          aria-label="Previous"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
      )}

      {/* Media */}
      <div
        className="relative flex items-center justify-center w-full h-full px-16 sm:px-20"
        onClick={e => e.stopPropagation()}
      >
        {current.type === 'video' ? (
          <video
            ref={videoRef}
            key={current.src}
            src={current.src}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-[88vh] w-auto h-auto rounded-xl shadow-2xl object-contain"
            style={{ maxWidth: 'min(680px, 90vw)' }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current.src}
            src={current.src}
            alt={current.label ?? 'media'}
            className="max-w-full max-h-[88vh] w-auto h-auto rounded-xl shadow-2xl object-contain"
            style={{ maxWidth: 'min(680px, 90vw)' }}
          />
        )}
      </div>

      {/* Next */}
      {!single && (
        <button
          onClick={e => { e.stopPropagation(); next(); }}
          className="absolute right-3 sm:right-5 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
          aria-label="Next"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      )}

      {/* Dot indicators for post grid */}
      {!single && items.length <= 20 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setIdx(i); }}
              className={`rounded-full transition-all cursor-pointer ${i === idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── tab type ─────────────────────────────────────── */
type Tab = 'all' | 'reels' | 'photos' | 'products' | 'stories';

/* ─── page ─────────────────────────────────────────── */

export default function CreatorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const slug   = params?.slug as string;

  const [profile,   setProfile]   = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('all');

  // Media modal state
  const [modalItems,      setModalItems]      = useState<MediaItem[]>([]);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [modalOpen,       setModalOpen]       = useState(false);

  const openModal = (items: MediaItem[], startIndex = 0) => {
    setModalItems(items);
    setModalStartIndex(startIndex);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    if (slug) fetchProfile();
  }, [slug]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/api/brand/influencer/${slug}`);
      setProfile(res.data.profile);
    } catch (err: any) {
      if (err.response?.status === 404) setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#3D5087] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading profile…</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col items-center justify-center gap-4 px-6">
      <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
        <svg className="w-7 h-7 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <p className="text-lg font-bold text-gray-800">Profile not found</p>
      <p className="text-sm text-gray-400">This creator hasn&apos;t set up their profile yet.</p>
      <button onClick={() => router.back()}
        className="mt-1 px-5 py-2.5 bg-[#3D5087] hover:bg-[#2B3B68] text-white text-sm font-semibold rounded-xl transition-all cursor-pointer">
        ← Back to Discover
      </button>
    </div>
  );

  if (!profile) return null;

  /* ── computed ── */
  const name       = profile.userId?.name ?? 'Creator';
  const code       = name.charCodeAt(0) || 0;
  const avatarGrad = AVATAR_GRADS[code % AVATAR_GRADS.length];

  const primary = (profile.platforms ?? []).reduce(
    (mx: any, p: any) => p.followers > (mx?.followers ?? 0) ? p : mx, null
  );
  const totalFollowers = (profile.platforms ?? []).reduce((s: number, p: any) => s + (p.followers ?? 0), 0);
  const avgEng = profile.platforms?.length
    ? ((profile.platforms.reduce((s: number, p: any) => s + (p.engagementRate ?? 0), 0)) / profile.platforms.length).toFixed(1)
    : '0';

  const allItems = profile.portfolioItems ?? [];
  const reels    = allItems.filter((i: any) => i.section === 'reels'  || (!i.section && i.type === 'video'));
  const photos   = allItems.filter((i: any) => i.section === 'photos' || (!i.section && i.type === 'image'));
  const products = allItems.filter((i: any) => i.section === 'products');
  const stories  = allItems.filter((i: any) => i.section === 'stories');
  const tabMedia: Record<Tab, any[]> = { all: allItems, reels, photos, products, stories };
  // Unlocked items are the first 3 (or all items for premium influencers).
  const visible  = allItems.filter((i: any) => !i.locked);

  const sectionLabel: Record<string, string> = {
    reels: 'Reel', photos: 'Photo', products: 'Product', stories: 'Story',
  };

  // Build flat media list for modal navigation
  const buildMediaItems = (list: any[]): MediaItem[] =>
    list.map(item => ({
      type:      item.type === 'video' ? 'video' : 'image',
      src:       item.cloudinaryUrl,
      thumbnail: item.thumbnailUrl || undefined,
      label:     sectionLabel[item.section] ?? (item.type === 'video' ? 'Reel' : 'Photo'),
    }));

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'all',      label: 'All Posts', count: allItems.length  },
    { key: 'reels',    label: 'Reels',     count: reels.length     },
    { key: 'photos',   label: 'Photos',    count: photos.length    },
    { key: 'products', label: 'Products',  count: products.length  },
    { key: 'stories',  label: 'Stories',   count: stories.length   },
  ];

  const card = 'bg-white rounded-2xl border border-gray-200/80 shadow-sm';

  return (
    <div className="min-h-screen bg-[#F4F6FB]">

      {/* ── Media Modal ─────────────────────────────────── */}
      {modalOpen && (
        <MediaModal
          items={modalItems}
          startIndex={modalStartIndex}
          onClose={closeModal}
        />
      )}

      <div className="max-w-3xl mx-auto px-0 sm:px-4 py-5 sm:py-6 pb-20 space-y-4">

        {/* ═══════════════════════════════
            HERO CARD
            ═══════════════════════════════ */}
        <div className={`${card} overflow-hidden`}>

          {/* Cover — clickable if coverPhotoUrl exists */}
          <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-[#1e2d56] via-[#2B3B68] to-[#4a5fa0]">
            {/* Decorative shapes on the cover default gradient */}
            {!profile.coverPhotoUrl && <>
              <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute top-4 right-1/3 w-20 h-20 rounded-full bg-white/[0.03] pointer-events-none" />
              {/* Diagonal lines accent */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" preserveAspectRatio="none">
                <defs>
                  <pattern id="diag" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                    <line x1="0" y1="0" x2="0" y2="20" stroke="white" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#diag)"/>
              </svg>
            </>}
            {profile.coverPhotoUrl ? (
              <div
                className="w-full h-full cursor-zoom-in"
                onClick={() => openModal([{ type: 'image', src: profile.coverPhotoUrl, label: 'Cover Photo' }], 0)}
                title="Click to view cover photo"
              >
                <img src={profile.coverPhotoUrl} alt="cover" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" />
              </div>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
          </div>

          {/* Identity */}
          <div className="px-5 sm:px-7 pt-0 pb-6">

            {/* Avatar — pulled up over the cover with -mt-10, z-10 keeps it above the cover stacking context */}
            <div className="-mt-10 mb-4">
              <div
                className={`relative z-10 w-[78px] h-[78px] sm:w-[88px] sm:h-[88px] rounded-full border-[3px] border-white ring-2 ring-[#3D5087]/20 shadow-lg overflow-hidden bg-gradient-to-br ${avatarGrad} flex items-center justify-center ${profile.profilePicUrl ? 'cursor-zoom-in' : ''}`}
                onClick={() => {
                  if (profile.profilePicUrl)
                    openModal([{ type: 'image', src: profile.profilePicUrl, label: `${name}'s profile picture` }], 0);
                }}
                title={profile.profilePicUrl ? 'Click to view profile picture' : undefined}
              >
                {profile.profilePicUrl
                  ? <img src={profile.profilePicUrl} alt={name} className="w-full h-full object-cover" />
                  : <span className="text-white font-bold text-3xl select-none">{name.charAt(0).toUpperCase()}</span>
                }
              </div>
            </div>

            {/* Name + handle + level */}
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{name}</h1>
              {profile.level && (
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${LEVEL_BADGE[profile.level] ?? LEVEL_BADGE.starter}`}>
                  {profile.level}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 font-mono mb-3">@{profile.slug}</p>

            {/* Niche tags */}
            {(profile.niche ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {profile.niche.map((n: string) => (
                  <span key={n} className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full capitalize border ${NICHE_CHIPS[n] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {n}
                  </span>
                ))}
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="text-[14px] text-gray-600 leading-relaxed mb-4 max-w-lg">{profile.bio}</p>
            )}

            {/* Location + platform links */}
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-gray-500 mb-5">
              {profile.city && (
                <span className="flex items-center gap-1.5 font-semibold bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                  <svg className="w-3 h-3 text-[#3D5087]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {profile.city}
                </span>
              )}
              {(profile.platforms ?? []).map((p: any) => p.profileUrl && (
                <a key={p.name} href={p.profileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-semibold bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full hover:border-[#3D5087]/30 hover:bg-[#EEF1F8] transition-all">
                  {p.name === 'instagram' && <InstagramLogo size={13} />}
                  {p.name === 'youtube'   && <YouTubeLogo size={13} />}
                  {p.name === 'facebook'  && <FacebookLogo size={13} />}
                  <span className="capitalize text-[12px]">{p.name}</span>
                </a>
              ))}
            </div>

            {/* Stats row — 4 tinted cells */}
            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-gray-100">
              {[
                {
                  value: String(allItems.length), label: 'Posts',
                  bg: 'bg-[#EEF1F8]', darkBg: 'dark:bg-[#0d2d33]', text: 'text-[#3D5087]', darkText: 'dark:text-[#7EC8D3]',
                  icon: (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  ),
                },
                {
                  value: formatNum(totalFollowers), label: 'Followers',
                  bg: 'bg-violet-50', darkBg: 'dark:bg-violet-900/40', text: 'text-violet-600', darkText: 'dark:text-violet-400',
                  icon: (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  ),
                },
                {
                  value: primary ? formatNum(primary.avgLikes ?? 0) : '—', label: 'Avg Likes',
                  bg: 'bg-rose-50', darkBg: 'dark:bg-rose-900/30', text: 'text-rose-500', darkText: 'dark:text-rose-400',
                  icon: (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  ),
                },
                {
                  value: `${avgEng}%`, label: 'Engagement',
                  bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/30', text: 'text-emerald-600', darkText: 'dark:text-emerald-400',
                  icon: (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                    </svg>
                  ),
                },
              ].map((s, i) => (
                <div key={i} className={`relative ${s.bg} ${s.darkBg} rounded-xl px-2 py-3 flex flex-col items-center gap-1 overflow-hidden`}>
                  {/* Corner circle accent */}
                  <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-black/[0.04] pointer-events-none" />
                  <span className={`relative ${s.text} ${s.darkText}`}>{s.icon}</span>
                  <p className="relative text-sm font-bold text-gray-900 dark:text-slate-100 tabular-nums leading-none">{s.value}</p>
                  <p className="relative text-[10px] text-gray-400 dark:text-slate-400 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════
            PLATFORM BREAKDOWN
            ═══════════════════════════════ */}
        {(profile.platforms ?? []).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#3D5087] to-[#6B7FBB]" />
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Platform Stats</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {profile.platforms.map((p: any) => {
                const acc = PLATFORM_ACCENT[p.name] ?? { bar: 'border-l-gray-300', label: 'text-gray-500' };
                return (
                  <div key={p.name} className={`${card} border-l-4 ${acc.bar} overflow-hidden`}>
                    {/* Platform header with subtle dot-grid accent */}
                    <div className="relative flex items-center justify-between px-4 py-3 bg-gray-50/80 border-b border-gray-100 overflow-hidden">
                      <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" preserveAspectRatio="none">
                        <defs>
                          <pattern id={`dots-${p.name}`} width="8" height="8" patternUnits="userSpaceOnUse">
                            <circle cx="1.5" cy="1.5" r="1" fill="currentColor"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#dots-${p.name})`} className="text-gray-400"/>
                      </svg>
                      <div className="relative flex items-center gap-2">
                        {p.name === 'instagram' && <InstagramLogo size={18} />}
                        {p.name === 'youtube'   && <YouTubeLogo size={18} />}
                        {p.name === 'facebook'  && <FacebookLogo size={18} />}
                        <span className={`text-sm font-bold capitalize ${acc.label}`}>{p.name}</span>
                      </div>
                      {p.profileUrl && (
                        <a href={p.profileUrl} target="_blank" rel="noopener noreferrer"
                          className="relative flex items-center gap-1 text-[11px] font-semibold text-[#3D5087] hover:underline">
                          Visit
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </a>
                      )}
                    </div>
                    {/* Stat values */}
                    <div className="px-4 py-4 grid grid-cols-2 gap-x-4 gap-y-3.5">
                      {[
                        { v: formatNum(p.followers ?? 0),   l: 'Followers'    },
                        { v: `${p.engagementRate ?? 0}%`,   l: 'Engagement'   },
                        { v: formatNum(p.avgLikes ?? 0),    l: 'Avg Likes'    },
                        { v: formatNum(p.avgComments ?? 0), l: 'Avg Comments' },
                      ].map((st, i) => (
                        <div key={i}>
                          <p className="text-base font-bold text-gray-900 tabular-nums leading-tight">{st.v}</p>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">{st.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════
            COLLABORATION DETAILS
            ═══════════════════════════════ */}
        <div>
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#3D5087] to-[#6B7FBB]" />
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Collaboration Details</h2>
          </div>

          {/* Rate — full-width card */}
          <div className={`relative ${card} p-5 mb-3 overflow-hidden`}>
            {/* Wave accent top-right */}
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

          {/* Score + Level */}
          <div className="grid grid-cols-2 gap-3">
            {/* Score card */}
            <div className={`relative ${card} p-5 overflow-hidden`}>
              {/* Quarter-circle bottom-right */}
              <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-[#EEF1F8] pointer-events-none" />
              <div className="absolute -bottom-4 -right-4 w-14 h-14 rounded-full bg-[#D6DCF0]/60 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-[#EEF1F8] flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-[#3D5087]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <div
                    className="h-full bg-gradient-to-r from-[#3D5087] to-[#6B7FBB] rounded-full transition-all duration-700"
                    style={{ width: `${profile.credibilityScore ?? 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Level card */}
            <div className={`relative ${card} p-5 overflow-hidden`}>
              {/* Star-burst / halo accent */}
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

        {/* ═══════════════════════════════
            PORTFOLIO
            ═══════════════════════════════ */}
        <div>
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#3D5087] to-[#6B7FBB]" />
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Portfolio</h2>
          </div>
          <div className={`${card} overflow-hidden`}>

            {/* Tabs */}
            <div className="flex bg-gray-50/60 border-b border-gray-100">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-bold transition-all cursor-pointer relative ${
                    activeTab === tab.key
                      ? 'text-[#3D5087] bg-white shadow-[inset_0_-2px_0_#3D5087]'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-white/60'
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${activeTab === tab.key ? 'bg-[#EEF1F8] text-[#3D5087]' : 'bg-gray-100 text-gray-400'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Freemium blurred-content banner */}
            {tabMedia[activeTab].some((i: any) => i.locked) && (
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border-b border-amber-100">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-amber-800">
                    {tabMedia[activeTab].filter((i: any) => i.locked).length} posts blurred
                  </p>
                  <p className="text-[11px] text-amber-600/80 mt-0.5">
                    This creator is on the free plan. Only the first 3 posts are fully visible — the rest are blurred.
                  </p>
                </div>
              </div>
            )}

            {/* Grid */}
            {tabMedia[activeTab].length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-500">No content yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  This creator hasn&apos;t uploaded any {activeTab === 'all' ? 'posts' : activeTab} yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-px bg-gray-100">
                {tabMedia[activeTab].map((item: any, i: number) => {
                  const mediaList = buildMediaItems(tabMedia[activeTab].filter((x: any) => !x.locked));

                  /* ── Locked (freemium blur) cell ── */
                  if (item.locked) {
                    const blurSrc = item.thumbnailUrl || item.cloudinaryUrl;
                    return (
                      <div
                        key={item._id ?? i}
                        className="relative aspect-square overflow-hidden bg-gray-200 select-none"
                        aria-label="Blurred post"
                      >
                        {blurSrc && (
                          <img
                            src={blurSrc}
                            alt=""
                            className="w-full h-full object-cover"
                            style={{ filter: 'blur(12px)', transform: 'scale(1.1)' }}
                          />
                        )}
                        {!blurSrc && (
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
                        )}
                      </div>
                    );
                  }

                  /* ── Unlocked cell ── */
                  const unlockedIndex = tabMedia[activeTab].slice(0, i + 1).filter((x: any) => !x.locked).length - 1;
                  return (
                    <button
                      key={item._id ?? i}
                      onClick={() => openModal(mediaList, unlockedIndex)}
                      className="relative aspect-square overflow-hidden bg-white group cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#3D5087]"
                      aria-label={item.type === 'video' ? 'Play reel' : 'View photo'}
                    >
                      {item.type === 'video' ? (
                        <>
                          {item.thumbnailUrl
                            ? <img src={item.thumbnailUrl} alt="reel thumbnail"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            : (
                              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                <svg className="w-8 h-8 text-white/30" viewBox="0 0 24 24" fill="currentColor">
                                  <polygon points="5 3 19 12 5 21 5 3"/>
                                </svg>
                              </div>
                            )
                          }
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-black/50 group-hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                              <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                              </svg>
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                            <span className="text-white text-[10px] font-semibold">Reel</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <img src={item.cloudinaryUrl} alt={`post-${i}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════
            HOW TO COLLABORATE
            ═══════════════════════════════ */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#2B3B68] via-[#3D5087] to-[#4a5fa0] sm:rounded-2xl px-6 py-7 shadow-lg">
          {/* decorative orbs */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-8 -left-6 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />

          <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" preserveAspectRatio="none">
            <defs>
              <pattern id="ctadiag" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="24" stroke="white" strokeWidth="1.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ctadiag)"/>
          </svg>

          <div className="relative">
            <p className="text-blue-200/80 text-[11px] font-semibold uppercase tracking-widest mb-1">Want to work with {name.split(' ')[0]}?</p>
            <p className="text-white text-lg font-bold tracking-tight">Collaborations start with a campaign</p>
            <p className="text-blue-200/70 text-sm mt-1 max-w-xl leading-relaxed">
              Post a campaign that fits {name.split(' ')[0]}&apos;s niche. Once they apply and you accept,
              a deal opens up and you can chat and collaborate directly.
            </p>

            {/* 3-step flow */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { n: 1, t: 'Post a campaign', d: 'Share your brief, budget & deliverables.' },
                { n: 2, t: 'Review applicants', d: 'Creators apply — pick the right fit.' },
                { n: 3, t: 'Accept & chat', d: 'A deal opens and messaging unlocks.' },
              ].map(step => (
                <div key={step.n} className="rounded-xl bg-white/10 border border-white/10 px-3.5 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white text-[#3D5087] text-[11px] font-bold flex items-center justify-center">{step.n}</span>
                    <span className="text-white text-[13px] font-bold">{step.t}</span>
                  </div>
                  <p className="text-blue-200/60 text-[11px] leading-snug">{step.d}</p>
                </div>
              ))}
            </div>

            <a href="/brand/campaigns"
              className="mt-5 inline-flex items-center gap-2 bg-white hover:bg-blue-50 text-[#3D5087] px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Post a Campaign
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
