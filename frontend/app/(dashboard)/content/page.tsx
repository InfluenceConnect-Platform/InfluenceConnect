'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, Eye } from 'lucide-react';

type Platform = 'All' | 'Instagram' | 'YouTube' | 'TikTok';

const PLATFORM_STYLES: Record<string, { bg: string; text: string }> = {
  Instagram: { bg: 'bg-pink-50',   text: 'text-pink-500'  },
  YouTube:   { bg: 'bg-red-50',    text: 'text-red-500'   },
  TikTok:    { bg: 'bg-gray-100',  text: 'text-gray-700'  },
};

const CONTENT = [
  {
    id: 1,
    platform: 'Instagram',
    date: 'Feb 20, 2026',
    title: 'Summer Fashion Trends 2026',
    description: 'Check out the hottest fashion trends for this summer season!',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    likes: 12400, comments: 340, shares: 180, views: 45600, status: 'Published',
  },
  {
    id: 2,
    platform: 'YouTube',
    date: 'Feb 19, 2026',
    title: 'Morning Routine Vlog',
    description: 'My complete morning routine for a productive day',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80',
    likes: 8900, comments: 210, shares: 95, views: 78200, status: 'Published',
  },
  {
    id: 3,
    platform: 'TikTok',
    date: 'Feb 18, 2026',
    title: 'Product Review: Tech Gadgets',
    description: 'Reviewing the latest tech gadgets you need in 2026',
    image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&q=80',
    likes: 15600, comments: 450, shares: 280, views: 92300, status: 'Published',
  },
  {
    id: 4,
    platform: 'Instagram',
    date: 'Feb 17, 2026',
    title: 'Healthy Meal Prep Ideas',
    description: 'Simple and nutritious meal prep for the whole week',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
    likes: 11300, comments: 298, shares: 142, views: 38900, status: 'Published',
  },
  {
    id: 5,
    platform: 'YouTube',
    date: 'Feb 16, 2026',
    title: 'Workout Tips & Motivation',
    description: 'Get motivated and crush your fitness goals this year',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
    likes: 9200, comments: 187, shares: 110, views: 54700, status: 'Published',
  },
  {
    id: 6,
    platform: 'TikTok',
    date: 'Feb 15, 2026',
    title: 'Travel Vlog: Paris Adventure',
    description: 'Exploring the beautiful streets of Paris in 2026',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80',
    likes: 18700, comments: 520, shares: 340, views: 112000, status: 'Published',
  },
];

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

export default function ContentPage() {
  const [activeFilter, setActiveFilter] = useState<Platform>('All');

  const filtered = activeFilter === 'All'
    ? CONTENT
    : CONTENT.filter(c => c.platform === activeFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage and track all your published content
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['All', 'Instagram', 'YouTube', 'TikTok'] as Platform[]).map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeFilter === f
                ? 'bg-brand-400 text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-brand-300 hover:text-brand-400'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(item => {
          const ps = PLATFORM_STYLES[item.platform];
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-brand-200 hover:shadow-sm transition-all"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {item.status}
                </span>
              </div>

              {/* Body */}
              <div className="p-4">
                {/* Platform + date */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ps.bg} ${ps.text}`}>
                    {item.platform}
                  </span>
                  <span className="text-xs text-gray-400">{item.date}</span>
                </div>

                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-400 mb-4 line-clamp-2">
                  {item.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Heart size={13} />
                    <span className="text-xs font-medium">{formatNum(item.likes)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <MessageCircle size={13} />
                    <span className="text-xs font-medium">{formatNum(item.comments)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Share2 size={13} />
                    <span className="text-xs font-medium">{formatNum(item.shares)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Eye size={13} />
                    <span className="text-xs font-medium">{formatNum(item.views)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}