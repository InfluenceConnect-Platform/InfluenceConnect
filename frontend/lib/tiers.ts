// Frontend mirror of backend/utils/tiers.js — display-only (labels, prices,
// feature copy for pricing/billing pages). Actual enforcement lives server-side;
// this file must be kept in sync with the backend numbers by hand since Infinity
// doesn't serialize over the API. See [[niche-taxonomy]]-style "one file per side"
// convention already used elsewhere in this repo.

export interface TierDef {
  key: string;
  label: string;
  priceMonthly: number; // ₹/mo
  tagline: string;
  features: string[];
}

export const BRAND_TIERS: TierDef[] = [
  {
    key: 'free', label: 'Free', priceMonthly: 0,
    tagline: 'Get started with your first campaigns',
    features: [
      'Up to 3 active campaigns',
      'Creator discovery — up to 5 profiles/day',
      'Application management (accept, reject)',
      'Campaign performance dashboard',
      'Up to 5 messages per day',
      'Email notifications',
      'Shared files up to 10 MB',
    ],
  },
  {
    key: 'silver', label: 'Silver', priceMonthly: 399,
    tagline: 'For brands scaling up outreach',
    features: [
      'Up to 5 active campaigns',
      'Creator discovery — up to 10 profiles/day',
      'Application management (shortlist, accept, reject)',
      'Invite creators directly',
      'Up to 10 messages per day',
      'Quick actions on dashboard',
      'Priority support',
      'Light & dark mode',
      'Shared files up to 30 MB',
    ],
  },
  {
    key: 'golden', label: 'Golden', priceMonthly: 499,
    tagline: 'Unlimited everything, for serious scale',
    features: [
      'Unlimited active campaigns',
      'Unlimited creator discovery',
      'Unlimited daily messages',
      'Unlimited file transfers',
      'Unlimited creator profile views',
      'Everything in Free & Silver',
      'Early access to new features',
    ],
  },
];

export const INFLUENCER_TIERS: TierDef[] = [
  {
    key: 'free', label: 'Free', priceMonthly: 0,
    tagline: 'Try the platform',
    features: [
      '2 portfolio uploads',
      '1 portfolio item visible to brands',
      '1 campaign invitation/month',
      '3 messages per day',
      'Basic credibility score',
    ],
  },
  {
    key: 'silver', label: 'Silver', priceMonthly: 9,
    tagline: 'For creators getting started',
    features: [
      '10 portfolio uploads',
      '3 portfolio items visible to brands',
      '3 campaign invitations/month',
      '5 messages per day',
      'Basic credibility score',
      'Public profile with custom URL',
      'Filters for campaign searching',
    ],
  },
  {
    key: 'golden', label: 'Golden', priceMonthly: 21,
    tagline: 'For growing creators',
    features: [
      '20 portfolio uploads',
      '5 portfolio items visible to brands',
      '5 campaign invitations/month',
      '10 messages per day',
      'Advanced credibility score',
      'CSV earnings export',
      'Earnings by category breakdown',
      'Detailed monthly earnings chart',
      'Public profile with custom URL',
      'Early access to new features',
    ],
  },
  {
    key: 'platinum', label: 'Platinum', priceMonthly: 29,
    tagline: 'Unlimited everything',
    features: [
      'Unlimited portfolio uploads',
      'All portfolio items visible to brands',
      'Unlimited campaign invitations',
      'Unlimited daily messages',
      'Advanced credibility score',
      'CSV earnings export',
      'Earnings by category breakdown',
      'Detailed monthly earnings chart',
      'Public profile with custom URL',
      'Early access to new features',
    ],
  },
];

export function tiersFor(role: 'brand' | 'influencer'): TierDef[] {
  return role === 'brand' ? BRAND_TIERS : INFLUENCER_TIERS;
}

export function yearlyPrice(monthly: number) {
  return Math.round(monthly * 12 * 0.8);
}

// ─────────────────────────────────────────────────────────────
// Capabilities — a hand-kept mirror of the limits/flags in
// backend/utils/tiers.js. The backend stays the authority; these exist so the
// UI can show the RIGHT number and hide what a tier doesn't include, instead
// of falling back to the pre-tier binary `plan === 'premium'` (which treats a
// ₹9 Silver creator identically to ₹29 Platinum).
//
// Keep in sync with backend/utils/tiers.js by hand — Infinity does not
// survive JSON, so it can't simply be fetched.
// ─────────────────────────────────────────────────────────────

export type BrandTierKey = 'free' | 'silver' | 'golden';
export type InfluencerTierKey = 'free' | 'silver' | 'golden' | 'platinum';
export type AnyTierKey = BrandTierKey | InfluencerTierKey;

export interface BrandCaps {
  order: number;
  maxActiveCampaigns: number;
  discoverPerDay: number;
  maxMessagesPerDay: number;
  maxFileMB: number;
  applicationActions: ('shortlist' | 'accept' | 'reject')[];
  canInvite: boolean;
  prioritySupport: boolean;
  quickActions: boolean;
  earlyAccess: boolean;
}

export interface InfluencerCaps {
  order: number;
  maxPortfolioUploads: number;
  visiblePortfolioItems: number;
  invitationsPerMonth: number;
  maxMessagesPerDay: number;
  maxApplicationsPerMonth: number;
  credibilityDetail: 'basic' | 'advanced';
  customUrl: boolean;
  campaignFilters: boolean;
  csvExport: boolean;
  earningsBreakdown: boolean;
  earlyAccess: boolean;
}

export const BRAND_CAPS: Record<BrandTierKey, BrandCaps> = {
  free: {
    order: 0, maxActiveCampaigns: 3, discoverPerDay: 5, maxMessagesPerDay: 5, maxFileMB: 10,
    applicationActions: ['accept', 'reject'], canInvite: false,
    prioritySupport: false, quickActions: false, earlyAccess: false,
  },
  silver: {
    order: 1, maxActiveCampaigns: 5, discoverPerDay: 10, maxMessagesPerDay: 10, maxFileMB: 30,
    applicationActions: ['shortlist', 'accept', 'reject'], canInvite: true,
    prioritySupport: true, quickActions: true, earlyAccess: false,
  },
  golden: {
    order: 2, maxActiveCampaigns: Infinity, discoverPerDay: Infinity, maxMessagesPerDay: Infinity, maxFileMB: Infinity,
    applicationActions: ['shortlist', 'accept', 'reject'], canInvite: true,
    prioritySupport: true, quickActions: true, earlyAccess: true,
  },
};

export const INFLUENCER_CAPS: Record<InfluencerTierKey, InfluencerCaps> = {
  free: {
    order: 0, maxPortfolioUploads: 2, visiblePortfolioItems: 1, invitationsPerMonth: 1,
    maxMessagesPerDay: 3, maxApplicationsPerMonth: 3, credibilityDetail: 'basic',
    customUrl: false, campaignFilters: false, csvExport: false, earningsBreakdown: false, earlyAccess: false,
  },
  silver: {
    order: 1, maxPortfolioUploads: 10, visiblePortfolioItems: 3, invitationsPerMonth: 3,
    maxMessagesPerDay: 5, maxApplicationsPerMonth: 10, credibilityDetail: 'basic',
    customUrl: true, campaignFilters: true, csvExport: false, earningsBreakdown: false, earlyAccess: false,
  },
  golden: {
    order: 2, maxPortfolioUploads: 20, visiblePortfolioItems: 5, invitationsPerMonth: 5,
    maxMessagesPerDay: 10, maxApplicationsPerMonth: 25, credibilityDetail: 'advanced',
    customUrl: true, campaignFilters: true, csvExport: true, earningsBreakdown: true, earlyAccess: true,
  },
  platinum: {
    order: 3, maxPortfolioUploads: Infinity, visiblePortfolioItems: Infinity, invitationsPerMonth: Infinity,
    maxMessagesPerDay: Infinity, maxApplicationsPerMonth: Infinity, credibilityDetail: 'advanced',
    customUrl: true, campaignFilters: true, csvExport: true, earningsBreakdown: true, earlyAccess: true,
  },
};

/** Normalises whatever the API/localStorage gave us to a real tier key. */
export function normalizeTier(role: 'brand', tier?: string | null): BrandTierKey;
export function normalizeTier(role: 'influencer', tier?: string | null): InfluencerTierKey;
export function normalizeTier(role: 'brand' | 'influencer', tier?: string | null): AnyTierKey {
  const table = role === 'brand' ? BRAND_CAPS : INFLUENCER_CAPS;
  return (tier && tier in table ? tier : 'free') as AnyTierKey;
}

export function brandCaps(tier?: string | null): BrandCaps {
  return BRAND_CAPS[normalizeTier('brand', tier)];
}

export function influencerCaps(tier?: string | null): InfluencerCaps {
  return INFLUENCER_CAPS[normalizeTier('influencer', tier)];
}

/** True when `tier` is at or above `minimum` in the same role's ladder. */
export function tierAtLeast(
  role: 'brand' | 'influencer',
  tier: string | null | undefined,
  minimum: AnyTierKey,
): boolean {
  const table = role === 'brand' ? BRAND_CAPS : INFLUENCER_CAPS;
  const current = table[normalizeTier(role as 'influencer', tier) as keyof typeof table];
  const floor = table[minimum as keyof typeof table];
  if (!current || !floor) return false;
  return current.order >= floor.order;
}

/** "3" / "Unlimited" — for limit copy that must not print "Infinity". */
export function limitLabel(n: number): string {
  return Number.isFinite(n) ? String(n) : 'Unlimited';
}
