'use client';

interface Row { label: string; value: number; color?: string; }
interface Props {
  title: string;
  subtitle?: string;
  rows: Row[];
  defaultColor?: string;
  emptyText?: string;
}

export default function AdminCategoryBars({
  title,
  subtitle,
  rows,
  defaultColor = '#3E4751',
  emptyText = 'No data yet',
}: Props) {
  const max = Math.max(1, ...rows.map(r => r.value));
  const hasData = rows.some(r => r.value > 0);

  return (
    <div className="bg-white border border-gray-200/70 rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.04)] overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 pb-1">
        <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="px-5 sm:px-6 py-5 flex flex-col gap-3.5">
        {!hasData ? (
          <p className="text-[12px] text-gray-400 py-4 text-center">{emptyText}</p>
        ) : (
          rows.map((row, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-[12px] mb-1.5">
                <span className="text-gray-600 font-medium capitalize">{row.label}</span>
                <span className="text-gray-900 font-bold tabular-nums">{row.value}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(row.value / max) * 100}%`, background: row.color || defaultColor }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
