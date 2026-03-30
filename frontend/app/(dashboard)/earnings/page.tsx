'use client';

import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';

type Period = '6m' | '1y';

const EARNINGS_DATA = {
  '6m': [
    { month: 'Sep', amount: 11200 },
    { month: 'Oct', amount: 13500 },
    { month: 'Nov', amount: 12800 },
    { month: 'Dec', amount: 15100 },
    { month: 'Jan', amount: 14700 },
    { month: 'Feb', amount: 16200 },
  ],
  '1y': [
    { month: 'Mar', amount: 8400  },
    { month: 'Apr', amount: 9200  },
    { month: 'May', amount: 10500 },
    { month: 'Jun', amount: 11800 },
    { month: 'Jul', amount: 10900 },
    { month: 'Aug', amount: 12300 },
    { month: 'Sep', amount: 11200 },
    { month: 'Oct', amount: 13500 },
    { month: 'Nov', amount: 12800 },
    { month: 'Dec', amount: 15100 },
    { month: 'Jan', amount: 14700 },
    { month: 'Feb', amount: 16200 },
  ],
};

const DEALS = [
  { brand: 'Luxe Fashion Co.',  category: 'Fashion',   amount: 4200, status: 'Completed', date: 'Feb 20, 2026' },
  { brand: 'TechPro Global',    category: 'Technology', amount: 3800, status: 'Active',    date: 'Feb 18, 2026' },
  { brand: 'Glow Beauty',       category: 'Beauty',    amount: 2900, status: 'Completed', date: 'Feb 15, 2026' },
  { brand: 'Urban Eats',        category: 'Food',      amount: 1500, status: 'Pending',   date: 'Feb 10, 2026' },
  { brand: 'FitLife Gear',      category: 'Fitness',   amount: 3800, status: 'Completed', date: 'Feb 5, 2026'  },
];

const STATUS_STYLE: Record<string, string> = {
  Completed: 'bg-green-50 text-green-600',
  Active:    'bg-brand-50 text-brand-400',
  Pending:   'bg-amber-50 text-amber-600',
};

export default function EarningsPage() {
  const [period, setPeriod] = useState<Period>('6m');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Track your revenue and brand partnerships
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total earnings — highlighted purple */}
        <div className="bg-purple-600 rounded-2xl p-5 text-white">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <DollarSign size={20} className="text-white" />
          </div>
          <p className="text-xs font-medium text-purple-200 mb-1">Total Earnings (Feb)</p>
          <p className="text-3xl font-bold tracking-tight">$16,200</p>
          <p className="text-xs text-purple-200 mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> +9.5% from last month
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4">
            <ShoppingBag size={20} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">8</p>
          <p className="text-sm text-gray-400 mt-1">Sponsored Deals</p>
          <p className="text-xs text-gray-400 mt-1">$12,100 revenue</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
            <Users size={20} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">401</p>
          <p className="text-sm text-gray-400 mt-1">Affiliate Sales</p>
          <p className="text-xs text-gray-400 mt-1">$4,100 commission</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp size={20} className="text-pink-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">$1,513</p>
          <p className="text-sm text-gray-400 mt-1">Avg. Deal Value</p>
          <p className="text-xs text-gray-400 mt-1">Per campaign</p>
        </div>
      </div>

      {/* Earnings chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Earnings Overview</h2>
          <div className="flex gap-2">
            {(['6m', '1y'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  period === p
                    ? 'bg-brand-400 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {p === '6m' ? 'Last 6 months' : 'Last 1 year'}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={EARNINGS_DATA[period]}>
            <defs>
              <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#2D8796" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2D8796" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              formatter={(v: number) => [`$${v.toLocaleString()}`, 'Earnings']}
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Area type="monotone" dataKey="amount" stroke="#2D8796" strokeWidth={2.5} fill="url(#earningsGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Deal history table */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Deal History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 pb-3">Brand</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-3">Category</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-3">Date</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-400 pb-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {DEALS.map((deal, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 font-medium text-gray-800">{deal.brand}</td>
                  <td className="py-3 text-gray-500">{deal.category}</td>
                  <td className="py-3 text-gray-400">{deal.date}</td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[deal.status]}`}>
                      {deal.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-semibold text-gray-800">
                    ${deal.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}