// Single source of truth for the tiered subscription system (added 2026-08-08,
// replacing the old binary freemium/premium model — see the client's
// "Some changes of platform" doc for the feature lists these numbers come from).
//
// `user.tier` is the real source of truth now. `user.plan` ('freemium'/'premium')
// is kept in sync automatically (free tier → freemium, any paid tier → premium)
// purely so the handful of call sites that only care about "is this user on
// any paid plan at all" (e.g. invitations, portfolio full-visibility default)
// don't all need touching — see applyTierUpgrade / syncPlanFromTier below.

const Infinity_ = Infinity;

// NOTE: shortlisting is deliberately available on every brand tier. The
// client's doc lists only "accept, reject" for Free, but confirmed that was an
// omission rather than an intended restriction — so there is no
// applicationActions gate here, and none should be added back.
const BRAND_TIERS = {
  free: {
    label: 'Free', order: 0, priceMonthly: 0,
    maxActiveCampaigns: 3, discoverPerDay: 5, maxMessagesPerDay: 5, maxFileMB: 10,
    prioritySupport: false, darkModePerk: false,
    quickActions: false, earlyAccess: false, canInvite: false,
  },
  silver: {
    label: 'Silver', order: 1, priceMonthly: 399,
    maxActiveCampaigns: 5, discoverPerDay: 10, maxMessagesPerDay: 10, maxFileMB: 30,
    prioritySupport: true, darkModePerk: true,
    quickActions: true, earlyAccess: false, canInvite: true,
  },
  golden: {
    label: 'Golden', order: 2, priceMonthly: 499,
    maxActiveCampaigns: Infinity_, discoverPerDay: Infinity_, maxMessagesPerDay: Infinity_, maxFileMB: Infinity_,
    prioritySupport: true, darkModePerk: true,
    quickActions: true, earlyAccess: true, canInvite: true,
  },
};

const INFLUENCER_TIERS = {
  free: {
    label: 'Free', order: 0, priceMonthly: 0,
    maxPortfolioUploads: 2, visiblePortfolioItems: 1, invitationsPerMonth: 1,
    maxMessagesPerDay: 3, maxApplicationsPerMonth: 3, credibilityDetail: 'basic',
    customUrl: false, campaignFilters: false, csvExport: false, earningsBreakdown: false, earlyAccess: false,
  },
  silver: {
    label: 'Silver', order: 1, priceMonthly: 9,
    maxPortfolioUploads: 10, visiblePortfolioItems: 3, invitationsPerMonth: 3,
    maxMessagesPerDay: 5, maxApplicationsPerMonth: 10, credibilityDetail: 'basic',
    customUrl: true, campaignFilters: true, csvExport: false, earningsBreakdown: false, earlyAccess: false,
  },
  golden: {
    label: 'Golden', order: 2, priceMonthly: 21,
    maxPortfolioUploads: 20, visiblePortfolioItems: 5, invitationsPerMonth: 5,
    maxMessagesPerDay: 10, maxApplicationsPerMonth: 25, credibilityDetail: 'advanced',
    customUrl: true, campaignFilters: true, csvExport: true, earningsBreakdown: true, earlyAccess: true,
  },
  platinum: {
    label: 'Platinum', order: 3, priceMonthly: 29,
    maxPortfolioUploads: Infinity_, visiblePortfolioItems: Infinity_, invitationsPerMonth: Infinity_,
    maxMessagesPerDay: Infinity_, maxApplicationsPerMonth: Infinity_, credibilityDetail: 'advanced',
    customUrl: true, campaignFilters: true, csvExport: true, earningsBreakdown: true, earlyAccess: true,
  },
};

const TIERS_BY_ROLE = { brand: BRAND_TIERS, influencer: INFLUENCER_TIERS };

function getTierConfig(role, tier) {
  const table = TIERS_BY_ROLE[role];
  if (!table) return null;
  return table[tier] || table.free;
}

function isValidTier(role, tier) {
  const table = TIERS_BY_ROLE[role];
  return !!table && !!table[tier];
}

function tierOrder(role, tier) {
  return getTierConfig(role, tier)?.order ?? 0;
}

// Keeps the legacy `plan` field consistent with the real `tier` field.
function syncPlanFromTier(user) {
  user.plan = user.tier && user.tier !== 'free' ? 'premium' : 'freemium';
}

module.exports = {
  BRAND_TIERS, INFLUENCER_TIERS, TIERS_BY_ROLE,
  getTierConfig, isValidTier, tierOrder, syncPlanFromTier,
};
