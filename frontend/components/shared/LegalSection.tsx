'use client';

import { useTheme } from '@/lib/useTheme';
import { LEGAL_INDEX, LEGAL_ENTITY } from '@/lib/legalContent';

export default function LegalSection() {
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {LEGAL_INDEX.map((item) => (
          <a
            key={item.slug}
            href={`/legal/${item.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between rounded-xl border p-4 transition-all group ${
              isDark
                ? 'border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/40'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="min-w-0 pr-3">
              <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{item.title}</p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{item.desc}</p>
            </div>
            <svg
              className={`w-4 h-4 flex-shrink-0 ml-3 transition-transform group-hover:translate-x-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>
        ))}
      </div>

      <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
        Last updated {LEGAL_ENTITY.lastUpdated}. Questions? Email{' '}
        <a href={`mailto:${LEGAL_ENTITY.email}`} className={`font-medium ${isDark ? 'text-[#7FA8AD]' : 'text-[#3D5087]'} hover:underline`}>
          {LEGAL_ENTITY.email}
        </a>
        .
      </p>
    </div>
  );
}
