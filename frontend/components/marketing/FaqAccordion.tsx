'use client';

import { useState } from 'react';

export interface FaqItem {
  q: string;
  a: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className={`border rounded-2xl overflow-hidden transition-colors ${
              isOpen ? 'border-[#5D8A8F]/40 bg-white shadow-sm' : 'border-gray-200 bg-white'
            }`}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4.5 text-left cursor-pointer group"
            >
              <span className="text-sm sm:text-[0.95rem] font-semibold text-gray-900 group-hover:text-[#5D8A8F] transition-colors">
                {item.q}
              </span>
              <span
                className={`w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-45 bg-[#5D8A8F] border-[#5D8A8F]' : ''
                }`}
              >
                <svg
                  className={`w-3.5 h-3.5 ${isOpen ? 'text-white' : 'text-gray-500'}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 sm:px-6 pb-5 text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
