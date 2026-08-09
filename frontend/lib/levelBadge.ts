// Shared level badge styling — used for both influencer level (shown to brands
// in Discover) and brand level (shown to influencers in campaigns/invitations).
// Tiers mirror the backend enum on InfluencerProfile.level / BrandProfile.level.

export const LEVEL_BADGE: Record<string, string> = {
  elite:        'bg-amber-50 text-amber-700 border border-amber-200',
  professional: 'bg-sky-50 text-sky-700 border border-sky-200',
  growing:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  starter:      'bg-gray-100 text-gray-500 border border-gray-200',
};

export const LEVEL_LABEL: Record<string, string> = {
  elite: 'Elite',
  professional: 'Professional',
  growing: 'Growing',
  starter: 'Starter',
};

export function levelBadgeCls(level?: string) {
  return LEVEL_BADGE[level || 'starter'] ?? LEVEL_BADGE.starter;
}

export function levelLabel(level?: string) {
  return LEVEL_LABEL[level || 'starter'] ?? 'Starter';
}
