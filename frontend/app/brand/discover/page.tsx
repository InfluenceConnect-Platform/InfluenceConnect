'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import BrandNav from '@/components/shared/BrandNav';

const NICHES = ['beauty', 'fashion', 'food', 'fitness', 'lifestyle', 'travel', 'tech', 'books'];
const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata'];

const NICHE_COLORS: Record<string, string> = {
  beauty: 'bg-pink-100 text-pink-800',
  fashion: 'bg-rose-100 text-rose-800',
  food: 'bg-orange-100 text-orange-800',
  fitness: 'bg-amber-100 text-amber-800',
  lifestyle: 'bg-purple-100 text-purple-800',
  travel: 'bg-emerald-100 text-emerald-800',
  tech: 'bg-blue-100 text-blue-800',
  books: 'bg-violet-100 text-violet-800',
};

const AVATAR_GRADIENTS = [
  'bg-gradient-to-br from-violet-500 to-purple-600',
  'bg-gradient-to-br from-teal-500 to-cyan-600',
  'bg-gradient-to-br from-amber-500 to-orange-500',
  'bg-gradient-to-br from-indigo-500 to-blue-600',
  'bg-gradient-to-br from-pink-500 to-rose-500',
  'bg-gradient-to-br from-emerald-500 to-green-600',
];

const InstagramLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <defs>
      <radialGradient id="ig-grad" cx="30%" cy="110%" r="130%">
        <stop offset="0%" stopColor="#ffd676"/>
        <stop offset="25%" stopColor="#f46f30"/>
        <stop offset="50%" stopColor="#e1306c"/>
        <stop offset="75%" stopColor="#833ab4"/>
        <stop offset="100%" stopColor="#4a23a8"/>
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ig-grad)"/>
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

const FIELD_CLASS = 'w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#3D5087]/30 focus:border-[#3D5087] hover:border-gray-300 transition-all placeholder:text-gray-400';

interface FilterPanelProps {
  selectedNiches: string[];
  toggleNiche: (n: string) => void;
  selectedCity: string;
  setSelectedCity: (v: string) => void;
  selectedPlatform: string;
  setSelectedPlatform: (v: string) => void;
  minInput: string;
  setMinInput: (v: string) => void;
  maxInput: string;
  setMaxInput: (v: string) => void;
  minFollowers: string;
  maxFollowers: string;
  applyFollowerRange: () => void;
  activeFilterCount: number;
  clearFilters: () => void;
}

function FilterPanel({
  selectedNiches, toggleNiche,
  selectedCity, setSelectedCity,
  selectedPlatform, setSelectedPlatform,
  minInput, setMinInput,
  maxInput, setMaxInput,
  minFollowers, maxFollowers,
  applyFollowerRange,
  activeFilterCount,
  clearFilters,
}: FilterPanelProps) {
  const canApply = minInput.trim() !== '' && maxInput.trim() !== '';
  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 bg-gradient-to-r from-blue-50/70 to-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#3D5087] to-[#2B3B68]" />
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Filters</h4>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#3D5087] to-[#2B3B68] text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-xs text-red-500 font-semibold hover:text-red-700 cursor-pointer transition-colors">
            Clear all
          </button>
        )}
      </div>

      <div className="p-5">
        {/* Niche */}
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-600 mb-2.5 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0" />
            Niche
          </p>
          <div className="flex flex-col gap-2">
            {NICHES.map(n => (
              <label key={n} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => toggleNiche(n)}>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  selectedNiches.includes(n)
                    ? 'border-0 bg-gradient-to-br from-[#3D5087] to-[#2B3B68] shadow-sm'
                    : 'border-gray-300 group-hover:border-[#3D5087]'
                }`}>
                  {selectedNiches.includes(n) && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <input type="checkbox" checked={selectedNiches.includes(n)} onChange={() => toggleNiche(n)} className="sr-only" />
                <span className={`text-sm capitalize transition-colors ${selectedNiches.includes(n) ? 'text-[#3D5087] font-semibold' : 'text-gray-600 group-hover:text-gray-800'}`}>{n}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-100 mb-5" />

        {/* City */}
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-600 mb-2.5 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-br from-emerald-500 to-green-600 flex-shrink-0" />
            City
          </p>
          <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} className={FIELD_CLASS}>
            <option value="">All cities</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="h-px bg-gray-100 mb-5" />

        {/* Platform */}
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-600 mb-2.5 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-br from-pink-500 to-rose-600 flex-shrink-0" />
            Platform
          </p>
          <div className="flex flex-col gap-2">
            {[
              { value: '', label: 'Any platform', logo: null },
              { value: 'instagram', label: 'Instagram', logo: <InstagramLogo size={16} /> },
              { value: 'youtube', label: 'YouTube', logo: <YouTubeLogo size={16} /> },
              { value: 'facebook', label: 'Facebook', logo: <FacebookLogo size={16} /> },
            ].map(p => (
              <label key={p.value} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setSelectedPlatform(p.value)}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  selectedPlatform === p.value
                    ? 'border-[#3D5087] bg-[#3D5087]'
                    : 'border-gray-300 group-hover:border-[#3D5087]'
                }`}>
                  {selectedPlatform === p.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <input type="radio" name="platform" value={p.value} checked={selectedPlatform === p.value} onChange={() => setSelectedPlatform(p.value)} className="sr-only" />
                <div className="flex items-center gap-1.5">
                  {p.logo}
                  <span className={`text-sm transition-colors ${selectedPlatform === p.value ? 'text-[#3D5087] font-semibold' : 'text-gray-600 group-hover:text-gray-800'}`}>{p.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-100 mb-5" />

        {/* Follower range */}
        <div>
          <p className="text-xs font-bold text-gray-600 mb-2.5 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-br from-amber-500 to-orange-500 flex-shrink-0" />
            Follower range
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Min e.g. 5000"
              value={minInput}
              onChange={e => setMinInput(e.target.value.replace(/[^\d]/g, ''))}
              className={`${FIELD_CLASS} flex-1`}
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Max e.g. 500000"
              value={maxInput}
              onChange={e => setMaxInput(e.target.value.replace(/[^\d]/g, ''))}
              className={`${FIELD_CLASS} flex-1`}
            />
          </div>
          <button
            onClick={applyFollowerRange}
            disabled={!canApply}
            className={`w-full py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
              canApply
                ? 'bg-gradient-to-r from-[#3D5087] to-[#4a5fa0] text-white cursor-pointer hover:from-[#2B3B68] hover:to-[#3D5087] shadow-sm hover:shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Apply range
          </button>
          {(minFollowers || maxFollowers) && (
            <p className="text-[11px] text-[#3D5087] font-semibold mt-2">
              Applied: {minFollowers ? Number(minFollowers).toLocaleString('en-IN') : '0'} – {maxFollowers ? Number(maxFollowers).toLocaleString('en-IN') : '∞'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrandDiscover() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [minFollowers, setMinFollowers] = useState('');
  const [maxFollowers, setMaxFollowers] = useState('');
  // Draft state — updated on every keystroke, applied to API on blur / Enter
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    setUser(JSON.parse(stored));
    fetchInfluencers();
  }, []);

  useEffect(() => {
    fetchInfluencers();
  }, [selectedNiches, selectedCity, selectedPlatform, minFollowers, maxFollowers]);

  const fetchInfluencers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedNiches.length > 0) params.niche = selectedNiches.join(',');
      if (selectedCity) params.city = selectedCity;
      if (selectedPlatform) params.platform = selectedPlatform;
      if (minFollowers) params.minFollowers = minFollowers;
      if (maxFollowers) params.maxFollowers = maxFollowers;

      const response = await api.get('/api/brand/discover', { params });
      setInfluencers(response.data.influencers);
    } catch (error) {
      console.error('Fetch influencers error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNiche = (niche: string) => {
    setSelectedNiches(prev =>
      prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche]
    );
  };

  const applyFollowerRange = () => {
    setMinFollowers(minInput);
    setMaxFollowers(maxInput);
  };

  const clearFilters = () => {
    setSelectedNiches([]);
    setSelectedCity('');
    setSelectedPlatform('');
    setMinFollowers('');
    setMaxFollowers('');
    setMinInput('');
    setMaxInput('');
  };

  const activeFilterCount =
    selectedNiches.length + (selectedCity ? 1 : 0) + (selectedPlatform ? 1 : 0) + (minFollowers ? 1 : 0) + (maxFollowers ? 1 : 0);

  const getPrimaryPlatform = (influencer: any) => {
    if (!influencer.platforms || influencer.platforms.length === 0) return null;
    return influencer.platforms.reduce((max: any, p: any) =>
      p.followers > (max?.followers || 0) ? p : max, null
    );
  };

  const filterPanelProps: FilterPanelProps = {
    selectedNiches, toggleNiche,
    selectedCity, setSelectedCity,
    selectedPlatform, setSelectedPlatform,
    minInput, setMinInput,
    maxInput, setMaxInput,
    minFollowers, maxFollowers,
    applyFollowerRange,
    activeFilterCount,
    clearFilters,
  };

  if (false) return (
    <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm">
      {/* Panel header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-blue-50/70 to-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#3D5087] to-[#2B3B68]" />
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Filters</h4>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#3D5087] to-[#2B3B68] text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-xs text-red-500 font-semibold hover:text-red-700 cursor-pointer transition-colors">
            Clear all
          </button>
        )}
      </div>

      <div className="p-5">
        {/* Niche */}
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-600 mb-2.5 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0" />
            Niche
          </p>
          <div className="flex flex-col gap-2">
            {NICHES.map(n => (
              <label key={n} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => toggleNiche(n)}>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  selectedNiches.includes(n)
                    ? 'border-0 bg-gradient-to-br from-[#3D5087] to-[#2B3B68] shadow-sm'
                    : 'border-gray-300 group-hover:border-[#3D5087]'
                }`}>
                  {selectedNiches.includes(n) && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <input type="checkbox" checked={selectedNiches.includes(n)} onChange={() => toggleNiche(n)} className="sr-only" />
                <span className={`text-sm capitalize transition-colors ${selectedNiches.includes(n) ? 'text-[#3D5087] font-semibold' : 'text-gray-600 group-hover:text-gray-800'}`}>{n}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-100 mb-5" />

        {/* City */}
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-600 mb-2.5 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-br from-emerald-500 to-green-600 flex-shrink-0" />
            City
          </p>
          <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} className={FIELD_CLASS}>
            <option value="">All cities</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="h-px bg-gray-100 mb-5" />

        {/* Platform */}
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-600 mb-2.5 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-br from-pink-500 to-rose-600 flex-shrink-0" />
            Platform
          </p>
          <div className="flex flex-col gap-2">
            {[
              { value: '', label: 'Any platform', logo: null },
              { value: 'instagram', label: 'Instagram', logo: <InstagramLogo size={16} /> },
              { value: 'youtube', label: 'YouTube', logo: <YouTubeLogo size={16} /> },
              { value: 'facebook', label: 'Facebook', logo: <FacebookLogo size={16} /> },
            ].map(p => (
              <label key={p.value} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setSelectedPlatform(p.value)}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  selectedPlatform === p.value
                    ? 'border-[#3D5087] bg-[#3D5087]'
                    : 'border-gray-300 group-hover:border-[#3D5087]'
                }`}>
                  {selectedPlatform === p.value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <input type="radio" name="platform" value={p.value} checked={selectedPlatform === p.value} onChange={() => setSelectedPlatform(p.value)} className="sr-only" />
                <div className="flex items-center gap-1.5">
                  {p.logo}
                  <span className={`text-sm transition-colors ${selectedPlatform === p.value ? 'text-[#3D5087] font-semibold' : 'text-gray-600 group-hover:text-gray-800'}`}>{p.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-100 mb-5" />

        {/* Follower range */}
        <div>
          <p className="text-xs font-bold text-gray-600 mb-2.5 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-br from-amber-500 to-orange-500 flex-shrink-0" />
            Follower range
          </p>
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Min e.g. 5000"
                value={minInput}
                onChange={e => setMinInput(e.target.value.replace(/[^\d]/g, ''))}
                onBlur={applyFollowerRange}
                onKeyDown={e => e.key === 'Enter' && applyFollowerRange()}
                className={FIELD_CLASS}
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Max e.g. 500000"
                value={maxInput}
                onChange={e => setMaxInput(e.target.value.replace(/[^\d]/g, ''))}
                onBlur={applyFollowerRange}
                onKeyDown={e => e.key === 'Enter' && applyFollowerRange()}
                className={FIELD_CLASS}
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400">Press Enter or click away to apply</p>
          {(minFollowers || maxFollowers) && (
            <p className="text-[11px] text-[#3D5087] font-semibold mt-1">
              Applied: {minFollowers ? Number(minFollowers).toLocaleString('en-IN') : '0'} – {maxFollowers ? Number(maxFollowers).toLocaleString('en-IN') : '∞'}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      <BrandNav user={user} />

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-end">
          <div className="bg-[#F4F6FB] w-full rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-50 to-white rounded-t-2xl border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">Filters</h3>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#3D5087] to-[#2B3B68] text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <FilterPanel {...filterPanelProps} />
            </div>
            <div className="px-4 py-4 bg-white border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full py-3 bg-gradient-to-r from-[#3D5087] to-[#4a5fa0] hover:from-[#2B3B68] hover:to-[#3D5087] text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-sm"
              >
                Show {influencers.length} creators
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* Hero banner */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#2B3B68] via-[#3D5087] to-[#4a5fa0] rounded-2xl px-5 sm:px-8 py-5 sm:py-6 mb-5 shadow-lg">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs text-blue-200/90 font-semibold uppercase tracking-wider mb-1">Find the right creators</p>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Discover Influencers</h1>
              <p className="text-blue-200/70 text-sm mt-1">
                {loading ? 'Searching creators…' : <><strong className="text-white font-semibold">{influencers.length}</strong> creators available</>}
              </p>
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="lg:hidden self-start sm:self-auto relative flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
                <line x1="12" y1="18" x2="12" y2="18"/>
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-gray-900 text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 items-start">

          {/* Desktop filter panel */}
          <div className="hidden lg:block sticky top-[72px]">
            <FilterPanel {...filterPanelProps} />
          </div>

          {/* Creator grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                <strong className="text-gray-900 font-semibold">{influencers.length}</strong> creator{influencers.length !== 1 ? 's' : ''} found
                {activeFilterCount > 0 && <span className="text-blue-600 ml-1">· {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active</span>}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="hidden lg:flex text-xs text-red-500 font-semibold items-center gap-1.5 hover:text-red-700 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Clear filters
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white border border-gray-200/80 rounded-2xl p-5 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-8 bg-gray-100 rounded-lg mb-3" />
                    <div className="grid grid-cols-3 gap-2">
                      {[1,2,3].map(j => <div key={j} className="h-12 bg-gray-100 rounded-xl" />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : influencers.length === 0 ? (
              <div className="border-2 border-dashed border-blue-100 rounded-2xl p-16 text-center bg-white/60">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3D5087] to-[#4a5fa0] text-white flex items-center justify-center mx-auto mb-4 shadow-md">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">No creators found</p>
                <p className="text-xs text-gray-400 mb-4">Try adjusting or clearing your filters.</p>
                <button
                  onClick={clearFilters}
                  className="text-xs bg-gradient-to-r from-[#3D5087] to-[#4a5fa0] text-white px-4 py-2 rounded-xl font-semibold cursor-pointer shadow-sm hover:shadow-md transition-all"
                >
                  Clear all filters →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {influencers.map((influencer, i) => {
                  const primary = getPrimaryPlatform(influencer);
                  const avatarGradient = AVATAR_GRADIENTS[(influencer.userId?.name?.charCodeAt(0) || 0) % 6];
                  return (
                    <div
                      key={i}
                      className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                    >
                      {/* Top accent strip */}
                      <div className="h-1.5 w-full bg-gradient-to-r from-[#3D5087] via-[#4a5fa0] to-[#6B7FBB]" />

                      <div className="p-5">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-12 h-12 rounded-full text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm ${avatarGradient}`}>
                            {influencer.userId?.name?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 truncate">{influencer.userId?.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-xs text-gray-400 font-mono truncate">@{influencer.slug}</p>
                              {primary?.name === 'instagram' && <InstagramLogo size={14} />}
                              {primary?.name === 'youtube' && <YouTubeLogo size={14} />}
                              {primary?.name === 'facebook' && <FacebookLogo size={14} />}
                            </div>
                          </div>
                        </div>

                        {/* Niche + city tags */}
                        <div className="flex flex-wrap gap-1.5 mb-4 min-h-[26px]">
                          {influencer.niche?.slice(0, 3).map((n: string) => (
                            <span key={n} className={`text-[11px] px-2 py-0.5 rounded-full capitalize font-semibold ${NICHE_COLORS[n] || 'bg-blue-100 text-blue-800'}`}>
                              {n}
                            </span>
                          ))}
                          {influencer.niche?.length > 3 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                              +{influencer.niche.length - 3}
                            </span>
                          )}
                          {influencer.city && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                              {influencer.city}
                            </span>
                          )}
                        </div>

                        {/* Stats — colorful mini-cards */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="bg-gradient-to-br from-teal-50 to-cyan-100 border border-teal-200 rounded-xl p-2.5 text-center">
                            <p className="text-sm font-bold text-teal-900">
                              {primary ? `${(primary.followers / 1000).toFixed(1)}k` : '—'}
                            </p>
                            <div className="flex items-center justify-center gap-1 mt-0.5">
                              {primary?.name === 'instagram' && <InstagramLogo size={11} />}
                              {primary?.name === 'youtube' && <YouTubeLogo size={11} />}
                              {primary?.name === 'facebook' && <FacebookLogo size={11} />}
                              {!primary && <p className="text-[10px] text-teal-600/80">Followers</p>}
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-violet-50 to-purple-100 border border-violet-200 rounded-xl p-2.5 text-center">
                            <p className="text-sm font-bold text-violet-900">
                              {primary ? `${primary.engagementRate}%` : '—'}
                            </p>
                            <p className="text-[10px] text-violet-600/80 mt-0.5">Engage.</p>
                          </div>
                          <div className="bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 rounded-xl p-2.5 text-center">
                            <p className="text-sm font-bold text-amber-900">{influencer.credibilityScore ?? '—'}</p>
                            <p className="text-[10px] text-amber-600/80 mt-0.5">Score</p>
                          </div>
                        </div>

                        {/* Rate + CTA */}
                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                          <div className="min-w-0">
                            <p className="text-[11px] text-gray-400 mb-0.5">Rate</p>
                            <p className={`text-sm font-semibold truncate ${influencer.priceRangeMin > 0 ? 'text-emerald-700' : 'text-gray-400 italic text-xs'}`}>
                              {influencer.priceRangeMin > 0
                                ? `₹${influencer.priceRangeMin.toLocaleString('en-IN')} – ₹${influencer.priceRangeMax.toLocaleString('en-IN')}`
                                : 'Not specified'
                              }
                            </p>
                          </div>
                          <a
                            href={`/creator/${influencer.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 text-xs px-3.5 py-2 bg-gradient-to-r from-[#3D5087] to-[#4a5fa0] hover:from-[#2B3B68] hover:to-[#3D5087] text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md"
                          >
                            View profile →
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
