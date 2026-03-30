'use client';

import { useState } from 'react';
import { Search, MapPin, Heart } from 'lucide-react';

type Niche = 'All' | 'Fashion' | 'Fitness' | 'Lifestyle' | 'Tech' | 'Food';

const NICHE_COLORS: Record<string, { bg: string; text: string }> = {
  Fashion:   { bg: 'bg-pink-50',   text: 'text-pink-500'   },
  Fitness:   { bg: 'bg-green-50',  text: 'text-green-600'  },
  Lifestyle: { bg: 'bg-purple-50', text: 'text-purple-500' },
  Tech:      { bg: 'bg-blue-50',   text: 'text-blue-500'   },
  Food:      { bg: 'bg-amber-50',  text: 'text-amber-600'  },
};

const INFLUENCERS = [
  {
    name: 'Sophia Anderson', handle: '@sophia_fashion', location: 'Los Angeles, CA',
    niche: 'Fashion',   posts: 342, followers: '1.2M', engagement: '8.4%',
    avatar: 'SA',
    cover: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  },
  {
    name: 'Alex Johnson', handle: '@alex_fitness', location: 'Miami, FL',
    niche: 'Fitness',   posts: 567, followers: '890K', engagement: '9.1%',
    avatar: 'AJ',
    cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
  },
  {
    name: 'Emma Davis', handle: '@emma_lifestyle', location: 'New York, NY',
    niche: 'Lifestyle', posts: 289, followers: '654K', engagement: '7.8%',
    avatar: 'ED',
    cover: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
  },
  {
    name: 'Mike Chen', handle: '@mike_tech', location: 'San Francisco, CA',
    niche: 'Tech',      posts: 412, followers: '1.5M', engagement: '6.9%',
    avatar: 'MC',
    cover: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&q=80',
  },
  {
    name: 'Priya Sharma', handle: '@priya_eats', location: 'Chicago, IL',
    niche: 'Food',      posts: 198, followers: '430K', engagement: '11.2%',
    avatar: 'PS',
    cover: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
  },
  {
    name: 'Carlos Rivera', handle: '@carlos_fit', location: 'Austin, TX',
    niche: 'Fitness',   posts: 623, followers: '720K', engagement: '8.7%',
    avatar: 'CR',
    cover: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
  },
];

const AVATAR_COLORS = [
  'bg-brand-400', 'bg-purple-400', 'bg-pink-400',
  'bg-blue-400',  'bg-amber-400',  'bg-green-500',
];

export default function DiscoverPage() {
  const [activeNiche, setActiveNiche] = useState<Niche>('All');
  const [search, setSearch] = useState('');
  const [followed, setFollowed] = useState<string[]>([]);

  const filtered = INFLUENCERS.filter(inf => {
    const matchNiche = activeNiche === 'All' || inf.niche === activeNiche;
    const matchSearch = inf.name.toLowerCase().includes(search.toLowerCase()) ||
                        inf.handle.toLowerCase().includes(search.toLowerCase());
    return matchNiche && matchSearch;
  });

  const toggleFollow = (handle: string) => {
    setFollowed(prev =>
      prev.includes(handle) ? prev.filter(h => h !== handle) : [...prev, handle]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Discover Influencers</h1>
        <p className="text-sm text-gray-400 mt-1">
          Find and connect with influencers in your niche
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search influencers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/20 focus:border-brand-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['All', 'Fashion', 'Fitness', 'Lifestyle', 'Tech', 'Food'] as Niche[]).map(n => (
            <button
              key={n}
              onClick={() => setActiveNiche(n)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                activeNiche === n
                  ? 'bg-brand-400 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-brand-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filtered.map((inf, i) => {
          const ns = NICHE_COLORS[inf.niche];
          const isFollowed = followed.includes(inf.handle);
          return (
            <div key={inf.handle} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-brand-200 hover:shadow-sm transition-all">
              {/* Cover */}
              <div className="relative h-36 overflow-hidden">
                <img src={inf.cover} alt="" className="w-full h-full object-cover" />
              </div>

              {/* Avatar overlapping cover */}
              <div className="px-4 pb-4">
                <div className="flex justify-center -mt-8 mb-3">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-lg border-4 border-white`}>
                      {inf.avatar}
                    </div>
                    <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full" />
                  </div>
                </div>

                <div className="text-center mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">{inf.name}</h3>
                  <p className="text-xs text-gray-400">{inf.handle}</p>
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs text-gray-400">
                    <MapPin size={11} />
                    {inf.location}
                  </div>
                  <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${ns.bg} ${ns.text}`}>
                    {inf.niche}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-1 text-center mb-4 py-3 border-y border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{inf.posts}</p>
                    <p className="text-xs text-gray-400">Posts</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{inf.followers}</p>
                    <p className="text-xs text-gray-400">Followers</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{inf.engagement}</p>
                    <p className="text-xs text-gray-400">Engage.</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleFollow(inf.handle)}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    isFollowed
                      ? 'bg-brand-50 text-brand-400 border border-brand-200'
                      : 'bg-brand-400 text-white hover:bg-brand-500'
                  }`}
                >
                  <Heart size={14} className={isFollowed ? 'fill-brand-400' : ''} />
                  {isFollowed ? 'Following' : 'Follow'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}