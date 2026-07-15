// ─────────────────────────────────────────
// INFLUENCER PROFILE COMPLETENESS
// Campaigns are only meaningful once we know enough about the creator to
// judge fit (niche, rate, reach, location). Until these fields are filled
// in, an influencer sees no campaigns rather than an unfiltered firehose.
// ─────────────────────────────────────────

const REQUIRED_FIELDS = [
  { key: 'bio', label: 'Bio', check: (p) => !!p.bio && p.bio.trim().length > 0 },
  { key: 'niche', label: 'At least one niche', check: (p) => (p.niche ?? []).length > 0 },
  { key: 'city', label: 'City', check: (p) => !!p.city && p.city.trim().length > 0 },
  {
    key: 'rateRange',
    label: 'Rate range',
    check: (p) => (p.priceRangeMin ?? 0) > 0 && (p.priceRangeMax ?? 0) > 0,
  },
  {
    key: 'platform',
    label: 'At least one social platform with follower count',
    check: (p) => (p.platforms ?? []).some((pl) => pl.name && (pl.followers ?? 0) > 0),
  },
];

function getMissingProfileFields(profile) {
  if (!profile) return REQUIRED_FIELDS.map((f) => f.label);
  return REQUIRED_FIELDS.filter((f) => !f.check(profile)).map((f) => f.label);
}

function isInfluencerProfileComplete(profile) {
  return getMissingProfileFields(profile).length === 0;
}

module.exports = { getMissingProfileFields, isInfluencerProfileComplete };
