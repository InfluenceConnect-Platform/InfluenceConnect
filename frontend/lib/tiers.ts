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
