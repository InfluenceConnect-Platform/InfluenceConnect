// Canonical creator/campaign niche list — single source of truth for every
// niche filter, form, and badge across the product. Keep in sync with
// backend/utils/niches.js and the marketing site's niche marquee
// (app/(marketing)/page.tsx): every niche advertised on the marketing pages
// must exist here, and vice versa.

export const NICHES = [
  'fashion', 'beauty', 'tech', 'gaming', 'food', 'travel', 'fitness', 'finance',
  'comedy', 'education', 'music', 'lifestyle', 'parenting', 'automobiles',
  'photography', 'vlogging', 'art-diy', 'books', 'skincare', 'streetwear',
  'home-decor', 'pets', 'startups', 'cricket', 'regional-cinema', 'cooking',
  'dance', 'wellness',
] as const;

export type Niche = typeof NICHES[number];

// Brand "industry" is the same list plus a catch-all.
export const INDUSTRIES = [...NICHES, 'other'] as const;

export const NICHE_LABELS: Record<string, string> = {
  fashion: 'Fashion',
  beauty: 'Beauty',
  tech: 'Tech',
  gaming: 'Gaming',
  food: 'Food',
  travel: 'Travel',
  fitness: 'Fitness',
  finance: 'Finance',
  comedy: 'Comedy',
  education: 'Education',
  music: 'Music',
  lifestyle: 'Lifestyle',
  parenting: 'Parenting',
  automobiles: 'Automobiles',
  photography: 'Photography',
  vlogging: 'Vlogging',
  'art-diy': 'Art & DIY',
  books: 'Books',
  skincare: 'Skincare',
  streetwear: 'Streetwear',
  'home-decor': 'Home Decor',
  pets: 'Pets',
  startups: 'Startups',
  cricket: 'Cricket',
  'regional-cinema': 'Regional Cinema',
  cooking: 'Cooking',
  dance: 'Dance',
  wellness: 'Wellness',
  other: 'Other',
};

// Light-mode tint classes shared by every niche/industry chip in the app.
// Dark mode is handled by the global cascade in globals.css (bg-x-50 overrides),
// not by dark: variants here, to match the rest of the app's chip styling.
export const NICHE_STYLES: Record<string, string> = {
  fashion: 'bg-rose-50 text-rose-700 border-rose-200',
  beauty: 'bg-pink-50 text-pink-700 border-pink-200',
  tech: 'bg-blue-50 text-blue-700 border-blue-200',
  gaming: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  food: 'bg-orange-50 text-orange-700 border-orange-200',
  travel: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  fitness: 'bg-amber-50 text-amber-700 border-amber-200',
  finance: 'bg-green-50 text-green-700 border-green-200',
  comedy: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  education: 'bg-sky-50 text-sky-700 border-sky-200',
  music: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  lifestyle: 'bg-purple-50 text-purple-700 border-purple-200',
  parenting: 'bg-lime-50 text-lime-700 border-lime-200',
  automobiles: 'bg-slate-50 text-slate-700 border-slate-200',
  photography: 'bg-zinc-50 text-zinc-700 border-zinc-200',
  vlogging: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'art-diy': 'bg-violet-50 text-violet-700 border-violet-200',
  books: 'bg-stone-50 text-stone-700 border-stone-200',
  skincare: 'bg-pink-50 text-pink-700 border-pink-200',
  streetwear: 'bg-rose-50 text-rose-700 border-rose-200',
  'home-decor': 'bg-orange-50 text-orange-700 border-orange-200',
  pets: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  startups: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  cricket: 'bg-green-50 text-green-700 border-green-200',
  'regional-cinema': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  cooking: 'bg-orange-50 text-orange-700 border-orange-200',
  dance: 'bg-purple-50 text-purple-700 border-purple-200',
  wellness: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  other: 'bg-gray-50 text-gray-600 border-gray-200',
};
