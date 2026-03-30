import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: string;
  trend?: number;          // e.g. 12.3 for +12.3%
  icon: LucideIcon;
  iconBg?: string;         // Tailwind class e.g. 'bg-brand-50'
  iconColor?: string;      // Tailwind class e.g. 'text-brand-400'
};

export default function StatCard({
  label,
  value,
  trend,
  icon: Icon,
  iconBg = 'bg-brand-50',
  iconColor = 'text-brand-400',
}: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-brand-200 transition-colors">
      <div className="flex items-start justify-between mb-4">

        {/* Icon */}
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={22} className={iconColor} />
        </div>

        {/* Trend badge */}
        {trend !== undefined && (
          <span
            className={`
              flex items-center gap-1 text-xs font-semibold
              px-2 py-1 rounded-full
              ${isPositive
                ? 'bg-green-50 text-green-600'
                : 'bg-red-50 text-danger'}
            `}
          >
            {isPositive
              ? <TrendingUp size={11} />
              : <TrendingDown size={11} />}
            {isPositive ? '+' : ''}{trend}%
          </span>
        )}
      </div>

      <p className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
        {value}
      </p>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}