'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

type Range = '7d' | '30d' | '90d';

const ENGAGEMENT_DATA = [
  { day: 'Mon', Instagram: 4200, YouTube: 2800, TikTok: 5100 },
  { day: 'Tue', Instagram: 3800, YouTube: 3200, TikTok: 4700 },
  { day: 'Wed', Instagram: 5100, YouTube: 2900, TikTok: 6200 },
  { day: 'Thu', Instagram: 4600, YouTube: 3500, TikTok: 5500 },
  { day: 'Fri', Instagram: 6200, YouTube: 4100, TikTok: 7100 },
  { day: 'Sat', Instagram: 7800, YouTube: 4800, TikTok: 8900 },
  { day: 'Sun', Instagram: 6500, YouTube: 4200, TikTok: 7600 },
];

const CATEGORY_DATA = [
  { category: 'Fashion',   score: 0.88 },
  { category: 'Lifestyle', score: 0.74 },
  { category: 'Travel',    score: 0.69 },
  { category: 'Tech',      score: 0.55 },
  { category: 'Food',      score: 0.42 },
];

const TOP_POSTS = [
  { rank: 1, title: 'Travel Vlog: Paris Adventure',   likes: 18700, score: 94.2, up: true  },
  { rank: 2, title: 'Product Review: Tech Gadgets',   likes: 15600, score: 89.5, up: true  },
  { rank: 3, title: 'Summer Fashion Trends 2026',     likes: 12400, score: 86.3, up: true  },
  { rank: 4, title: 'Healthy Meal Prep Ideas',        likes: 11300, score: 78.1, up: false },
  { rank: 5, title: 'Workout Tips & Motivation',      likes: 9200,  score: 75.8, up: true  },
];

const RANK_COLORS = ['bg-brand-400', 'bg-purple-400', 'bg-amber-400', 'bg-gray-300', 'bg-gray-200'];

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('7d');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">
            Track your content performance across platforms
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                range === r
                  ? 'bg-brand-400 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-brand-300'
              }`}
            >
              {r === '7d' ? 'Last 7 days' : r === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Engagement trends chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          Engagement Trends
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          Platform performance comparison
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={ENGAGEMENT_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
              cursor={{ stroke: '#e5e7eb' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
            <Line type="monotone" dataKey="Instagram" stroke="#ec4899" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="YouTube"   stroke="#ef4444" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="TikTok"    stroke="#1f2937" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-5">

        {/* Content performance by category */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Content Performance by Category
          </h2>
          <p className="text-xs text-gray-400 mb-5">Engagement score per niche</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={CATEGORY_DATA}
              layout="vertical"
              margin={{ left: 16, right: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 1]}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${Math.round(v * 100)}%`}
              />
              <YAxis
                dataKey="category"
                type="category"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                formatter={(v: number | undefined) => [
                  v !== undefined ? `${Math.round(v * 100)}%` : '',
                  'Score',
                ]}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Bar dataKey="score" fill="#2D8796" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top performing posts */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Top Performing Posts
          </h2>
          <p className="text-xs text-gray-400 mb-4">Ranked by engagement score</p>
          <div className="space-y-3">
            {TOP_POSTS.map(post => (
              <div key={post.rank} className="flex items-center gap-3">
                <div className={`w-7 h-7 ${RANK_COLORS[post.rank - 1]} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {post.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {post.likes.toLocaleString()} likes
                  </p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${post.up ? 'text-green-500' : 'text-danger'}`}>
                  {post.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {post.score}%
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}