const { NICHES, SUB_NICHES } = require('./niches');

// The old flat 28-niche taxonomy (live until the 2026-08-08 migration to the
// current 9-category/38-niche/173-sub-niche structure — see [[niche-taxonomy]]
// memory). Any InfluencerProfile/BrandProfile/Campaign document written before
// that migration still carries these slugs, which are no longer part of the
// NICHES enum — so the very next .save() on that document throws a Mongoose
// ValidationError, surfaced to the user as a generic "Something went wrong."
// on an otherwise-unrelated edit (e.g. just changing a bio or a budget).
//
// This is a best-effort remap to the closest equivalent in the new taxonomy,
// applied defensively wherever a profile/campaign is next written to, so a
// stale document self-heals instead of permanently blocking that user's save.
// `null` means no reasonable equivalent exists in the new taxonomy — the tag
// is dropped rather than forced into a wrong category.
const LEGACY_NICHE_MAP = {
  fashion: 'fashion-and-styling',
  beauty: 'beauty-makeup-and-aesthetics',
  tech: 'software-and-coding',
  gaming: 'gaming-ecosystem',
  food: 'food-discovery-and-criticism',
  travel: 'budget-and-adventure-travel',
  fitness: 'gym-training-and-strength',
  finance: 'personal-finance-and-budgeting',
  comedy: 'comedy-and-relatable-satire',
  education: 'educators-and-teachers',
  music: null,
  lifestyle: 'daily-vlogging-and-aesthetic-living',
  parenting: 'parenting-and-family-dynamics',
  automobiles: 'automotive-and-mechanical',
  photography: 'visual-arts-and-crafting',
  vlogging: 'daily-vlogging-and-aesthetic-living',
  'art-diy': 'visual-arts-and-crafting',
  books: 'science-history-and-humanities',
  skincare: 'beauty-makeup-and-aesthetics',
  streetwear: 'fashion-and-styling',
  'home-decor': 'home-decor-and-interior-styling',
  pets: 'pet-and-animal-care',
  startups: 'entrepreneurship-and-startups',
  cricket: 'endurance-and-specialty-sports',
  'regional-cinema': 'pop-culture-and-media-commentary',
  cooking: 'everyday-and-budget-cooking',
  dance: null,
  wellness: 'holistic-wellness-and-biohacking',
};

const NICHE_SET = new Set(NICHES);
const SUB_NICHE_SET = new Set(SUB_NICHES);

// Remaps/drops legacy niche slugs so the result is always valid against the
// current NICHES enum. Already-current values pass through unchanged.
// Dedupes, since a remap can collapse two old slugs onto one new one
// (e.g. 'beauty' and 'skincare' both → 'beauty-makeup-and-aesthetics').
function migrateNicheArray(niches) {
  if (!Array.isArray(niches)) return [];
  const out = [];
  for (const n of niches) {
    let mapped = n;
    if (!NICHE_SET.has(mapped)) {
      mapped = Object.prototype.hasOwnProperty.call(LEGACY_NICHE_MAP, n) ? LEGACY_NICHE_MAP[n] : null;
    }
    if (mapped && NICHE_SET.has(mapped) && !out.includes(mapped)) out.push(mapped);
  }
  return out;
}

// Sub-niches have no legacy equivalent (they didn't exist before the
// migration) — this is purely a safety filter against the current enum.
function migrateSubNicheArray(subNiches) {
  if (!Array.isArray(subNiches)) return [];
  return subNiches.filter(s => SUB_NICHE_SET.has(s));
}

// BrandProfile.industry is a single value with an 'other' catch-all in its
// enum (unlike InfluencerProfile.niche), so an unmappable legacy value has
// somewhere safe to land instead of being dropped to empty.
function migrateIndustryValue(industry) {
  if (!industry) return industry;
  if (NICHE_SET.has(industry) || industry === 'other') return industry;
  const mapped = LEGACY_NICHE_MAP[industry];
  return mapped && NICHE_SET.has(mapped) ? mapped : 'other';
}

module.exports = { LEGACY_NICHE_MAP, migrateNicheArray, migrateSubNicheArray, migrateIndustryValue };
