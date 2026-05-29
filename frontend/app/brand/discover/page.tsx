'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  'from-violet-500 to-purple-600',
  'from-teal-500 to-cyan-600',
  'from-amber-500 to-orange-500',
  'from-indigo-500 to-blue-600',
  'from-pink-500 to-rose-500',
  'from-emerald-500 to-green-600',
];

const BANNER_GRADIENTS = [
  'from-violet-600 via-purple-600 to-indigo-700',
  'from-teal-600 via-cyan-600 to-cyan-700',
  'from-amber-500 via-orange-500 to-orange-600',
  'from-indigo-600 via-blue-600 to-blue-700',
  'from-pink-500 via-rose-500 to-rose-600',
  'from-emerald-500 via-green-600 to-green-700',
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
  clearFollowerRange: () => void;
  minPriceInput: string;
  setMinPriceInput: (v: string) => void;
  maxPriceInput: string;
  setMaxPriceInput: (v: string) => void;
  minPrice: string;
  maxPrice: string;
  applyPriceRange: () => void;
  clearPriceRange: () => void;
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
  clearFollowerRange,
  minPriceInput, setMinPriceInput,
  maxPriceInput, setMaxPriceInput,
  minPrice, maxPrice,
  applyPriceRange,
  clearPriceRange,
  activeFilterCount,
  clearFilters,
}: FilterPanelProps) {
  const minVal = minInput.trim() !== '' ? Number(minInput) : null;
  const maxVal = maxInput.trim() !== '' ? Number(maxInput) : null;
  const rangeError =
    minVal !== null && maxVal !== null && minVal > maxVal
      ? 'Min cannot be greater than max'
      : maxVal !== null && minVal !== null && maxVal < minVal
      ? 'Max cannot be less than min'
      : null;
  const canApply = minInput.trim() !== '' && maxInput.trim() !== '' && !rangeError;
  const hasApplied = !!(minFollowers || maxFollowers);

  const minPriceVal = minPriceInput.trim() !== '' ? Number(minPriceInput) : null;
  const maxPriceVal = maxPriceInput.trim() !== '' ? Number(maxPriceInput) : null;
  const priceError =
    minPriceVal !== null && maxPriceVal !== null && minPriceVal > maxPriceVal
      ? 'Min cannot be greater than max'
      : null;
  const canApplyPrice = (minPriceInput.trim() !== '' || maxPriceInput.trim() !== '') && !priceError;
  const hasPriceApplied = !!(minPrice || maxPrice);
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

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Min e.g. 5000"
              value={minInput}
              onChange={e => setMinInput(e.target.value.replace(/[^\d]/g, ''))}
              className={`${FIELD_CLASS} flex-1 ${rangeError && minVal !== null ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : ''}`}
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Max e.g. 500000"
              value={maxInput}
              onChange={e => setMaxInput(e.target.value.replace(/[^\d]/g, ''))}
              className={`${FIELD_CLASS} flex-1 ${rangeError && maxVal !== null ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : ''}`}
            />
          </div>

          {/* Validation error */}
          {rangeError && (
            <p className="flex items-center gap-1 text-[11px] text-red-500 font-semibold mb-2">
              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {rangeError}
            </p>
          )}

          {/* Apply + Clear buttons */}
          <div className="flex gap-2">
            <button
              onClick={applyFollowerRange}
              disabled={!canApply}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                canApply
                  ? 'bg-gradient-to-r from-[#3D5087] to-[#4a5fa0] text-white cursor-pointer hover:from-[#2B3B68] hover:to-[#3D5087] shadow-sm hover:shadow-md'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Apply
            </button>
            {(hasApplied || minInput || maxInput) && (
              <button
                onClick={clearFollowerRange}
                className="px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
                title="Clear follower range"
              >
                Clear
              </button>
            )}
          </div>

          {/* Applied range indicator */}
          {hasApplied && (
            <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
              <svg className="w-3 h-3 text-amber-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <p className="text-[11px] text-amber-700 font-semibold">
                {minFollowers ? Number(minFollowers).toLocaleString('en-IN') : '0'}
                {' – '}
                {maxFollowers ? Number(maxFollowers).toLocaleString('en-IN') : '∞'}
              </p>
            </div>
          )}
        </div>

        <div className="h-px bg-gray-100 my-5" />

        {/* Price range */}
        <div>
          <p className="text-xs font-bold text-gray-600 mb-2.5 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex-shrink-0" />
            Price range (₹)
          </p>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Min e.g. 5000"
              value={minPriceInput}
              onChange={e => setMinPriceInput(e.target.value.replace(/[^\d]/g, ''))}
              className={`${FIELD_CLASS} flex-1 ${priceError && minPriceVal !== null ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : ''}`}
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Max e.g. 50000"
              value={maxPriceInput}
              onChange={e => setMaxPriceInput(e.target.value.replace(/[^\d]/g, ''))}
              className={`${FIELD_CLASS} flex-1 ${priceError && maxPriceVal !== null ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : ''}`}
            />
          </div>

          {priceError && (
            <p className="flex items-center gap-1 text-[11px] text-red-500 font-semibold mb-2">
              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {priceError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={applyPriceRange}
              disabled={!canApplyPrice}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                canApplyPrice
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white cursor-pointer hover:from-emerald-600 hover:to-teal-700 shadow-sm hover:shadow-md'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Apply
            </button>
            {(hasPriceApplied || minPriceInput || maxPriceInput) && (
              <button
                onClick={clearPriceRange}
                className="px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
                title="Clear price range"
              >
                Clear
              </button>
            )}
          </div>

          {hasPriceApplied && (
            <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12M6 8h12M12 21 6 8"/><path d="M6 13h3a4 4 0 1 0 0-5H6"/>
              </svg>
              <p className="text-[11px] text-emerald-700 font-semibold">
                ₹{minPrice ? Number(minPrice).toLocaleString('en-IN') : '0'}
                {' – '}
                {maxPrice ? `₹${Number(maxPrice).toLocaleString('en-IN')}` : '∞'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrandDiscover() {
  const router = useRouter();
  const [user] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [minFollowers, setMinFollowers] = useState('');
  const [maxFollowers, setMaxFollowers] = useState('');
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !localStorage.getItem('user')) { router.push('/auth/login'); return; }
    fetchInfluencers();
  }, []);

  useEffect(() => {
    fetchInfluencers();
  }, [selectedNiches, selectedCity, selectedPlatform, minFollowers, maxFollowers, minPrice, maxPrice]);

  const fetchInfluencers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedNiches.length > 0) params.niche = selectedNiches.join(',');
      if (selectedCity) params.city = selectedCity;
      if (selectedPlatform) params.platform = selectedPlatform;
      if (minFollowers) params.minFollowers = minFollowers;
      if (maxFollowers) params.maxFollowers = maxFollowers;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

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

  const clearFollowerRange = () => {
    setMinFollowers('');
    setMaxFollowers('');
    setMinInput('');
    setMaxInput('');
  };

  const applyPriceRange = () => {
    setMinPrice(minPriceInput);
    setMaxPrice(maxPriceInput);
  };

  const clearPriceRange = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinPriceInput('');
    setMaxPriceInput('');
  };

  const clearFilters = () => {
    setSelectedNiches([]);
    setSelectedCity('');
    setSelectedPlatform('');
    setMinFollowers('');
    setMaxFollowers('');
    setMinInput('');
    setMaxInput('');
    setMinPrice('');
    setMaxPrice('');
    setMinPriceInput('');
    setMaxPriceInput('');
  };

  const activeFilterCount =
    selectedNiches.length + (selectedCity ? 1 : 0) + (selectedPlatform ? 1 : 0) +
    (minFollowers ? 1 : 0) + (maxFollowers ? 1 : 0) + (minPrice || maxPrice ? 1 : 0);

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
    clearFollowerRange,
    minPriceInput, setMinPriceInput,
    maxPriceInput, setMaxPriceInput,
    minPrice, maxPrice,
    applyPriceRange,
    clearPriceRange,
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
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1e2f5c] via-[#3D5087] to-[#4a5fa0] rounded-2xl px-6 sm:px-10 py-8 sm:py-10 mb-5 shadow-lg">
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" preserveAspectRatio="none">
            <defs><pattern id="bd-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="white"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#bd-dots)"/>
          </svg>
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
              <div>
                <p className="text-blue-300/80 text-xs font-semibold uppercase tracking-widest mb-2">Find the right creators</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">Discover Influencers</h1>
                <p className="text-blue-200/70 text-sm mt-1.5">Browse, filter, and connect with verified creators</p>
              </div>
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden self-start sm:self-auto relative flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="18" x2="12" y2="18"/>
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-gray-900 text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
            {/* Stat chips */}
            <div className="flex flex-wrap gap-2.5">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3.5 py-1.5">
                <svg className="w-3.5 h-3.5 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span className="text-xs font-semibold text-white">{loading ? '…' : influencers.length} creators</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3.5 py-1.5">
                <svg className="w-3.5 h-3.5 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span className="text-xs font-semibold text-white">{NICHES.length} niches</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3.5 py-1.5">
                <svg className="w-3.5 h-3.5 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span className="text-xs font-semibold text-white">{CITIES.length} cities</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 items-start">

          {/* Desktop filter panel */}
          <div className="hidden lg:block sticky top-[72px]">
            <FilterPanel {...filterPanelProps} />
          </div>

          {/* Creator grid */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center min-w-[2rem] h-6 px-2 rounded-full bg-gradient-to-r from-[#3D5087] to-[#4a5fa0] text-white text-xs font-bold shadow-sm">
                  {influencers.length}
                </span>
                <p className="text-sm text-gray-500 font-medium">
                  creator{influencers.length !== 1 ? 's' : ''} found
                  {activeFilterCount > 0 && <span className="text-[#3D5087] font-semibold ml-1">· {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active</span>}
                </p>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="hidden lg:flex text-xs text-red-500 font-semibold items-center gap-1.5 hover:text-red-700 transition-colors cursor-pointer bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Clear filters
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden animate-pulse">
                    <div className="h-20 bg-gray-100" />
                    <div className="px-4 pb-4">
                      <div className="flex items-end justify-between -mt-7 mb-3">
                        <div className="w-14 h-14 rounded-full bg-gray-200 border-[3px] border-white" />
                        <div className="flex gap-1 mb-1">
                          <div className="w-5 h-5 rounded bg-gray-100" />
                          <div className="w-5 h-5 rounded bg-gray-100" />
                        </div>
                      </div>
                      <div className="h-4 bg-gray-100 rounded w-3/4 mb-1.5" />
                      <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                      <div className="flex gap-1.5 mb-4">
                        <div className="h-5 bg-gray-100 rounded-full w-14" />
                        <div className="h-5 bg-gray-100 rounded-full w-16" />
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 mb-4">
                        {[1,2,3].map(j => <div key={j} className="h-12 bg-gray-100 rounded-xl" />)}
                      </div>
                      <div className="flex justify-between pt-3 border-t border-gray-100">
                        <div className="h-8 bg-gray-100 rounded w-1/3" />
                        <div className="h-8 bg-gray-100 rounded-xl w-28" />
                      </div>
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
                  const charCode = influencer.userId?.name?.charCodeAt(0) || 0;
                  const avatarGrad = AVATAR_GRADIENTS[charCode % 6];
                  const bannerGrad = BANNER_GRADIENTS[charCode % 6];
                  return (
                    <div
                      key={i}
                      className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group"
                    >
                      {/* Gradient mini-banner */}
                      <div className={`h-20 bg-gradient-to-br ${bannerGrad} relative overflow-hidden`}>
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
                        {/* Credibility badge */}
                        {influencer.credibilityScore != null && (
                          <div className="absolute top-2.5 right-3 flex items-center gap-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-2 py-0.5">
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            <span className="text-[10px] font-bold text-white">{influencer.credibilityScore}</span>
                          </div>
                        )}
                      </div>

                      <br /> 


                      <div className="px-4 pb-4">
                        {/* Avatar + platforms row */}
                        <div className="flex items-end justify-between -mt-4 mb-3">
                          <div className={`w-14 h-14 rounded-full border-[3px] border-white shadow-md overflow-hidden bg-gradient-to-br ${avatarGrad} flex items-center justify-center flex-shrink-0`}>
                            {influencer.profilePicUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={influencer.profilePicUrl} alt={influencer.userId?.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold text-xl">{influencer.userId?.name?.charAt(0).toUpperCase() ?? '?'}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mb-1">
                            {influencer.platforms?.map((p: any) => (
                              <span key={p.name}>
                                {p.name === 'instagram' && <InstagramLogo size={18} />}
                                {p.name === 'youtube' && <YouTubeLogo size={18} />}
                                {p.name === 'facebook' && <FacebookLogo size={18} />}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Name + handle + city */}
                        <p className="font-bold text-gray-900 mb-0.5 truncate">{influencer.userId?.name}</p>
                        <div className="flex items-center gap-2 mb-3 min-w-0">
                          <p className="text-xs text-gray-400 font-mono truncate">@{influencer.slug}</p>
                          {influencer.city && (
                            <>
                              <div className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                <p className="text-xs text-gray-400">{influencer.city}</p>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Niche pills */}
                        <div className="flex flex-wrap gap-1.5 mb-4 min-h-[24px]">
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
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-1.5 mb-4">
                          <div className="bg-teal-50 border border-teal-100 rounded-xl p-2 text-center">
                            <p className="text-sm font-black text-teal-900">
                              {primary ? `${(primary.followers / 1000).toFixed(1)}k` : '—'}
                            </p>
                            <p className="text-[9px] font-bold uppercase tracking-wide text-teal-600/80 mt-0.5">Followers</p>
                          </div>
                          <div className="bg-violet-50 border border-violet-100 rounded-xl p-2 text-center">
                            <p className="text-sm font-black text-violet-900">
                              {primary ? `${primary.engagementRate}%` : '—'}
                            </p>
                            <p className="text-[9px] font-bold uppercase tracking-wide text-violet-600/80 mt-0.5">Engage</p>
                          </div>
                          <div className="bg-amber-50 border border-amber-100 rounded-xl p-2 text-center">
                            <p className="text-sm font-black text-amber-900">{influencer.credibilityScore ?? '—'}</p>
                            <p className="text-[9px] font-bold uppercase tracking-wide text-amber-600/80 mt-0.5">Score</p>
                          </div>
                        </div>

                        {/* Rate + CTA */}
                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">Rate</p>
                            <p className={`text-sm font-bold truncate ${influencer.priceRangeMin > 0 ? 'text-emerald-700' : 'text-gray-400 italic text-xs font-normal'}`}>
                              {influencer.priceRangeMin > 0
                                ? `₹${influencer.priceRangeMin.toLocaleString('en-IN')} – ₹${influencer.priceRangeMax.toLocaleString('en-IN')}`
                                : 'Not specified'
                              }
                            </p>
                          </div>
                          <Link
                            href={`/brand/creator/${influencer.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 text-xs px-4 py-2 bg-gradient-to-r from-[#3D5087] to-[#4a5fa0] hover:from-[#1e2f5c] hover:to-[#3D5087] text-white rounded-xl font-bold transition-all shadow-sm hover:shadow-md"
                          >
                            View profile →
                          </Link>
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
