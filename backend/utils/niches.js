// Canonical creator/campaign niche list. Keep in sync with frontend/lib/niches.ts
// and the marketing site's niche marquee (app/(marketing)/page.tsx) — every niche
// advertised on the marketing pages must exist here, and vice versa.
const NICHES = [
  'fashion', 'beauty', 'tech', 'gaming', 'food', 'travel', 'fitness', 'finance',
  'comedy', 'education', 'music', 'lifestyle', 'parenting', 'automobiles',
  'photography', 'vlogging', 'art-diy', 'books', 'skincare', 'streetwear',
  'home-decor', 'pets', 'startups', 'cricket', 'regional-cinema', 'cooking',
  'dance', 'wellness',
];

const NICHE_LABELS = {
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

module.exports = { NICHES, NICHE_LABELS };
