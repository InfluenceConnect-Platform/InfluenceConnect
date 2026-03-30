'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from 'recharts';

const AGE_DATA = [
  { range: '13-17', followers: 18760  },
  { range: '18-24', followers: 82075  },
  { range: '25-34', followers: 75040  },
  { range: '35-44', followers: 42210  },
  { range: '45+',   followers: 16415  },
];

const GENDER_DATA = [
  { name: 'Female', value: 62, color: '#ec4899' },
  { name: 'Male',   value: 36, color: '#8b5cf6' },
  { name: 'Other',  value: 2,  color: '#3b82f6'  },
];

const TOP_CITIES = [
  { city: 'Mumbai',    country: 'India',        pct: 18.4 },
  { city: 'Delhi',     country: 'India',        pct: 14.2 },
  { city: 'Bangalore', country: 'India',        pct: 11.7 },
  { city: 'London',    country: 'UK',           pct: 8.3  },
  { city: 'New York',  country: 'USA',          pct: 7.1  },
];

const SUMMARY = [
  { label: 'Total Followers', value: '234.5K' },
  { label: 'Avg. Age',        value: '26.4'   },
  { label: 'Top Country',     value: 'India'  },
  { label: 'Growth (30d)',    value: '+12.3%' },
];

export default function AudiencePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audience</h1>
        <p className="text-sm text-gray-400 mt-1">
          Understand who your followers are
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SUMMARY.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-5">

        {/* Age distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Age Distribution
          </h2>
          <p className="text-xs text-gray-400 mb-4">Followers by age group</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={AGE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                formatter={(v: number) => [v.toLocaleString(), 'Followers']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Bar dataKey="followers" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>

          {/* Breakdown table */}
          <div className="mt-4 space-y-2">
            {AGE_DATA.map(a => (
              <div key={a.range} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{a.range}</span>
                <span className="font-semibold text-gray-800">
                  {a.followers.toLocaleString()} followers
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Gender distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Gender Distribution
          </h2>
          <p className="text-xs text-gray-400 mb-4">Audience breakdown by gender</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={GENDER_DATA}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
              >
                {GENDER_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
             <Tooltip
  formatter={(value: number | string) => [`${value}%`, 'Share']}
  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
/>
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="space-y-2 mt-2">
            {GENDER_DATA.map(g => (
              <div key={g.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: g.color }} />
                  <span className="text-gray-500">{g.name}</span>
                </div>
                <span className="font-semibold text-gray-800">{g.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top cities */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Top Locations
        </h2>
        <div className="space-y-3">
          {TOP_CITIES.map((c, i) => (
            <div key={c.city} className="flex items-center gap-4">
              <span className="text-sm text-gray-400 w-5 text-right">{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">
                    {c.city}, {c.country}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">{c.pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-400 rounded-full transition-all"
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}