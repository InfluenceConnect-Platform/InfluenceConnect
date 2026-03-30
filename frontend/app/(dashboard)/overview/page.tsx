import StatCard from '@/components/stats/StatCard';
import {
  Users,
  Heart,
  Eye,
  MessageCircle,
  Sparkles,
} from 'lucide-react';

const STATS = [
  {
    label: 'Total Followers',
    value: '234.5K',
    trend: 12.3,
    icon: Users,
    iconBg: 'bg-brand-50',
    iconColor: 'text-brand-400',
  },
  {
    label: 'Engagement Rate',
    value: '8.4%',
    trend: 2.1,
    icon: Heart,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-400',
  },
  {
    label: 'Total Reach',
    value: '1.2M',
    trend: 18.7,
    icon: Eye,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-500',
  },
  {
    label: 'Avg. Comments',
    value: '342',
    trend: -5.2,
    icon: MessageCircle,
    iconBg: 'bg-red-50',
    iconColor: 'text-danger',
  },
];

export default function OverviewPage() {
  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Welcome back! Here&#39;s your performance summary.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-400 text-white text-sm font-medium rounded-xl hover:bg-brand-500 transition-colors">
          <Sparkles size={15} />
          Generate Report
        </button>
      </div>

      {/* ── Profile completion banner ── */}
      <div className="bg-white border border-brand-200 rounded-2xl px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">
              Complete your profile — 65% done
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Add your Instagram handle to unlock brand discovery
            </p>
          </div>
          <div className="w-48 h-2 bg-brand-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-400 rounded-full" style={{ width: '65%' }} />
          </div>
        </div>
        <button className="ml-6 px-4 py-2 border border-brand-400 text-brand-400 text-sm font-medium rounded-xl hover:bg-brand-50 transition-colors flex-shrink-0">
          Complete Profile
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Engagement trends */}
        <div className="col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Engagement Trends
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Last 7 days performance
              </p>
            </div>
            <button className="text-xs text-brand-400 font-medium hover:underline">
              View Details →
            </button>
          </div>
          {/* Chart placeholder — Recharts AreaChart in Sprint 2 */}
          <div className="h-48 bg-brand-50 rounded-xl flex items-center justify-center border border-dashed border-brand-200">
            <p className="text-sm text-brand-400 font-medium">
              Engagement chart — Sprint 2
            </p>
          </div>
        </div>

        {/* Platform split */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-0.5">
            Platform Split
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Audience distribution
          </p>
          <div className="h-48 bg-brand-50 rounded-xl flex items-center justify-center border border-dashed border-brand-200">
            <p className="text-sm text-brand-400 font-medium">
              Donut chart — Sprint 2
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}