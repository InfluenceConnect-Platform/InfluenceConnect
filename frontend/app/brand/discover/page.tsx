'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import BrandNav from '@/components/shared/BrandNav';

const NICHES = ['beauty', 'fashion', 'food', 'fitness', 'lifestyle', 'travel', 'tech', 'books'];
const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata'];

export default function BrandDiscover() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [minFollowers, setMinFollowers] = useState('');
  const [maxFollowers, setMaxFollowers] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    setUser(JSON.parse(stored));
    fetchInfluencers();
  }, []);

  useEffect(() => {
    fetchInfluencers();
  }, [selectedNiches, selectedCity, minFollowers, maxFollowers]);

  const fetchInfluencers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedNiches.length > 0) params.niche = selectedNiches.join(',');
      if (selectedCity) params.city = selectedCity;
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

  const clearFilters = () => {
    setSelectedNiches([]);
    setSelectedCity('');
    setMinFollowers('');
    setMaxFollowers('');
  };

  const activeFilterCount =
    selectedNiches.length + (selectedCity ? 1 : 0) + (minFollowers ? 1 : 0) + (maxFollowers ? 1 : 0);

  const getPrimaryPlatform = (influencer: any) => {
    if (!influencer.platforms || influencer.platforms.length === 0) return null;
    return influencer.platforms.reduce((max: any, p: any) =>
      p.followers > (max?.followers || 0) ? p : max, null
    );
  };

  const fieldClass = 'w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#3D5087]/30 focus:border-[#3D5087] hover:border-gray-300 transition-all placeholder:text-gray-400';

  const FilterPanel = () => (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filters</h4>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-[#3D5087] font-semibold hover:underline cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Niche */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-700 mb-2.5">Niche</p>
        <div className="flex flex-col gap-2">
          {NICHES.map(n => (
            <label key={n} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                selectedNiches.includes(n)
                  ? 'bg-[#3D5087] border-[#3D5087]'
                  : 'border-gray-300 group-hover:border-[#3D5087]'
              }`}>
                {selectedNiches.includes(n) && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={selectedNiches.includes(n)}
                onChange={() => toggleNiche(n)}
                className="sr-only"
              />
              <span className="text-sm text-gray-700 capitalize">{n}</span>
            </label>
          ))}
        </div>
      </div>

      {/* City */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-700 mb-2.5">City</p>
        <select
          value={selectedCity}
          onChange={e => setSelectedCity(e.target.value)}
          className={fieldClass}
        >
          <option value="">All cities</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Follower range */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2.5">Follower range</p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minFollowers}
            onChange={e => setMinFollowers(e.target.value)}
            className={fieldClass}
          />
          <input
            type="number"
            placeholder="Max"
            value={maxFollowers}
            onChange={e => setMaxFollowers(e.target.value)}
            className={fieldClass}
          />
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
            <div className="flex items-center justify-between px-5 py-4 bg-white rounded-t-2xl border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">Filters</h3>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#3D5087] text-white text-[10px] font-bold flex items-center justify-center">
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
              <FilterPanel />
            </div>
            <div className="px-4 py-4 bg-white border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full py-3 bg-[#3D5087] hover:bg-[#2B3B68] text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                Show {influencers.length} creators
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Find the right creators</p>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Discover Influencers</h1>
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-300 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="12" y1="18" x2="12" y2="18"/>
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#3D5087] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 items-start">

          {/* Desktop filter panel */}
          <div className="hidden lg:block sticky top-[72px]">
            <FilterPanel />
          </div>

          {/* Creator grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                <strong className="text-gray-900 font-semibold">{influencers.length}</strong> creators found
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="hidden lg:flex text-xs text-gray-500 items-center gap-1.5 hover:text-red-500 transition-colors cursor-pointer"
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
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center bg-white/50">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">No creators found</p>
                <p className="text-xs text-gray-400 mb-4">Try adjusting or clearing your filters.</p>
                <button
                  onClick={clearFilters}
                  className="text-xs text-[#3D5087] font-semibold hover:underline cursor-pointer"
                >
                  Clear all filters →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {influencers.map((influencer, i) => {
                  const primary = getPrimaryPlatform(influencer);
                  return (
                    <div
                      key={i}
                      className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:border-[#3D5087]/40 hover:shadow-md transition-all group"
                    >
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#EAEDF6] to-[#d0d5ea] text-[#3D5087] flex items-center justify-center font-bold text-lg flex-shrink-0">
                          {influencer.userId?.name?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{influencer.userId?.name}</p>
                          <p className="text-xs text-gray-400 font-mono truncate">@{influencer.slug}</p>
                        </div>
                      </div>

                      {/* Niche + city tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4 min-h-[28px]">
                        {influencer.niche?.slice(0, 3).map((n: string) => (
                          <span key={n} className="text-[11px] px-2 py-1 rounded-full bg-[#EAEDF6] text-[#3D5087] capitalize font-semibold">
                            {n}
                          </span>
                        ))}
                        {influencer.niche?.length > 3 && (
                          <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
                            +{influencer.niche.length - 3}
                          </span>
                        )}
                        {influencer.city && (
                          <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                            {influencer.city}
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 p-3 bg-[#F4F6FB] rounded-xl mb-4">
                        <div className="text-center">
                          <p className="text-sm font-bold text-gray-900">
                            {primary ? `${(primary.followers / 1000).toFixed(1)}k` : '—'}
                          </p>
                          <p className="text-[11px] text-gray-400 capitalize mt-0.5">
                            {primary?.name || 'Followers'}
                          </p>
                        </div>
                        <div className="text-center border-x border-gray-200/60">
                          <p className="text-sm font-bold text-gray-900">
                            {primary ? `${primary.engagementRate}%` : '—'}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">Engage.</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-gray-900">{influencer.credibilityScore ?? '—'}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">Score</p>
                        </div>
                      </div>

                      {/* Rate + CTA */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] text-gray-400 mb-0.5">Rate</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">
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
                          className="flex-shrink-0 text-xs px-3.5 py-2 bg-[#3D5087] hover:bg-[#2B3B68] text-white rounded-xl font-semibold transition-all"
                        >
                          View profile
                        </a>
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
