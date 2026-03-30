'use client';

import { useState } from 'react';
import { Search, MapPin, Star, Briefcase } from 'lucide-react';

type Industry = 'All' | 'Fashion' | 'Technology' | 'Beauty' | 'Food & Beverage' | 'Fitness';

const INDUSTRY_COLORS: Record<string, { bg: string; text: string }> = {
  Fashion:          { bg: 'bg-pink-50',   text: 'text-pink-500'   },
  Technology:       { bg: 'bg-blue-50',   text: 'text-blue-500'   },
  Beauty:           { bg: 'bg-purple-50', text: 'text-purple-500' },
  'Food & Beverage':{ bg: 'bg-amber-50',  text: 'text-amber-600'  },
  Fitness:          { bg: 'bg-green-50',  text: 'text-green-600'  },
};

const BRANDS = [
  {
    name: 'Luxe Fashion Co.',  handle: '@luxe_fashion',    location: 'New York, NY',
    industry: 'Fashion',          campaigns: 45, partners: '250+', rating: 4.8,
    cover: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    logo: 'LF',
  },
  {
    name: 'TechPro Global',    handle: '@techpro_global',  location: 'San Francisco, CA',
    industry: 'Technology',       campaigns: 62, partners: '180+', rating: 4.9,
    cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
    logo: 'TP',
  },
  {
    name: 'Glow Beauty',       handle: '@glow_beauty',     location: 'Los Angeles, CA',
    industry: 'Beauty',           campaigns: 78, partners: '320+', rating: 4.7,
    cover: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80',
    logo: 'GB',
  },
  {
    name: 'Urban Eats',        handle: '@urban_eats',      location: 'Chicago, IL',
    industry: 'Food & Beverage',  campaigns: 34, partners: '150+', rating: 4.6,
    cover: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
    logo: 'UE',
  },
  {
    name: 'FitLife Gear',      handle: '@fitlife_gear',    location: 'Austin, TX',
    industry: 'Fitness',          campaigns: 29, partners: '95+',  rating: 4.5,
    cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
    logo: 'FL',
  },
  {
    name: 'Nova Tech',         handle: '@nova_tech',       location: 'Seattle, WA',
    industry: 'Technology',       campaigns: 41, partners: '210+', rating: 4.8,
    cover: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&q=80',
    logo: 'NT',
  },
];

const LOGO_COLORS = [
  'bg-pink-400', 'bg-blue-500', 'bg-purple-400',
  'bg-amber-400', 'bg-green-500', 'bg-brand-400',
];

export default function BrandsPage() {
  const [activeIndustry, setActiveIndustry] = useState<Industry>('All');
  const [search, setSearch]     = useState('');
  const [partnered, setPartnered] = useState<string[]>([]);

  const filtered = BRANDS.filter(b => {
    const matchIndustry = activeIndustry === 'All' || b.industry === activeIndustry;
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
                        b.handle.toLowerCase().includes(search.toLowerCase());
    return matchIndustry && matchSearch;
  });

  const togglePartner = (handle: string) => {
    setPartnered(prev =>
      prev.includes(handle) ? prev.filter(h => h !== handle) : [...prev, handle]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse Brands</h1>
        <p className="text-sm text-gray-400 mt-1">
          Discover brands looking for influencer partnerships
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search brands..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/20 focus:border-brand-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['All', 'Fashion', 'Technology', 'Beauty', 'Food & Beverage', 'Fitness'] as Industry[]).map(ind => (
            <button
              key={ind}
              onClick={() => setActiveIndustry(ind)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                activeIndustry === ind
                  ? 'bg-brand-400 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-brand-300'
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filtered.map((brand, i) => {
          const is = INDUSTRY_COLORS[brand.industry];
          const isPartnered = partnered.includes(brand.handle);
          return (
            <div key={brand.handle} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-brand-200 hover:shadow-sm transition-all">
              {/* Cover */}
              <div className="relative h-36 overflow-hidden">
                <img src={brand.cover} alt="" className="w-full h-full object-cover" />
              </div>

              {/* Logo overlapping */}
              <div className="px-4 pb-4">
                <div className="flex justify-center -mt-8 mb-3">
                  <div className={`w-16 h-16 rounded-2xl ${LOGO_COLORS[i % LOGO_COLORS.length]} flex items-center justify-center text-white font-bold text-lg border-4 border-white`}>
                    {brand.logo}
                  </div>
                </div>

                <div className="text-center mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">{brand.name}</h3>
                  <p className="text-xs text-gray-400">{brand.handle}</p>
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs text-gray-400">
                    <MapPin size={11} />
                    {brand.location}
                  </div>
                  <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${is.bg} ${is.text}`}>
                    {brand.industry}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-1 text-center mb-4 py-3 border-y border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{brand.campaigns}</p>
                    <p className="text-xs text-gray-400">Campaigns</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{brand.partners}</p>
                    <p className="text-xs text-gray-400">Partners</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-0.5">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <p className="text-sm font-bold text-gray-900">{brand.rating}</p>
                    </div>
                    <p className="text-xs text-gray-400">Rating</p>
                  </div>
                </div>

                <button
                  onClick={() => togglePartner(brand.handle)}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    isPartnered
                      ? 'bg-purple-50 text-purple-500 border border-purple-200'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                >
                  <Briefcase size={14} />
                  {isPartnered ? 'Partnered' : 'Partner'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}