// ─────────────────────────────────────────
// CAMPAIGN AUDIENCE MATCHING
// The inverse of campaign.controller.js' buildProfileMatchConditions():
// given ONE campaign, build the InfluencerProfile query for the creators it
// is actually relevant to. Used by the "new campaign you might like" email
// fan-out so a creator is only mailed a campaign that would also show up in
// their browse list — most importantly, one the brand can afford.
//
// Every rule mirrors a rule in buildProfileMatchConditions and is likewise
// skipped when the campaign leaves that dimension open, and widened to keep
// profiles that simply haven't filled a field (no price floor, no city, no
// platforms) — "incomplete profiles see more" rather than being over-filtered.
// Returns an array of conditions meant to be $and-ed into an
// InfluencerProfile query.
// ─────────────────────────────────────────
function buildCampaignAudienceConditions(campaign) {
  const conditions = [];
  if (!campaign) return conditions;

  // 1. NICHE — the campaign's niches overlap the creator's. A campaign with
  //    no niche set targets everyone. Mirroring browse, a creator who hasn't
  //    picked any niche isn't gated out either (the browse rule is skipped
  //    when the profile has no niches — "incomplete profiles see more").
  if (Array.isArray(campaign.niche) && campaign.niche.length > 0) {
    conditions.push({
      $or: [
        { niche: { $in: campaign.niche } },
        { niche: { $size: 0 } },
        { niche: { $exists: false } },
      ],
    });
  }

  // 2. BUDGET — the brand must be able to afford the creator: the campaign's
  //    top budget reaches at least the creator's price floor. budgetMax 0
  //    means an open-ended budget, so it targets everyone. Creators with no
  //    price floor set (priceRangeMin 0 / unset) are never gated out.
  if (campaign.budgetMax && campaign.budgetMax > 0) {
    conditions.push({
      $or: [
        { priceRangeMin: { $lte: campaign.budgetMax } },
        { priceRangeMin: { $exists: false } },
        { priceRangeMin: null },
      ],
    });
  }

  // 3. PLATFORMS + FOLLOWERS (coupled, per-platform) — the creator has at
  //    least one platform that is BOTH targeted by the campaign (or the
  //    campaign targets any) AND whose follower count sits inside the
  //    campaign's range. maxFollowers 0 means no upper limit; a platform with
  //    0/unknown followers only has to be targeted. Creators with no
  //    platforms recorded aren't gated on this rule at all.
  const min = campaign.minFollowers || 0;
  const max = campaign.maxFollowers || 0;
  const targetsAnyPlatform =
    !Array.isArray(campaign.targetPlatforms) || campaign.targetPlatforms.length === 0;

  if (!targetsAnyPlatform || min > 0 || max > 0) {
    const elem = {};
    if (!targetsAnyPlatform) elem.name = { $in: campaign.targetPlatforms };
    elem.$or = [
      { followers: { $lte: 0 } },
      {
        $and: [
          { followers: { $gte: min } },
          ...(max > 0 ? [{ followers: { $lte: max } }] : []),
        ],
      },
    ];
    conditions.push({
      $or: [{ platforms: { $size: 0 } }, { platforms: { $elemMatch: elem } }],
    });
  }

  // 4. CITY — the creator's city is one the campaign targets. A campaign that
  //    targets everyone ([], or the 'all' sentinel) qualifies for anyone.
  //    Creators with no city set aren't gated out.
  const targetsAllCities =
    !Array.isArray(campaign.targetCity) ||
    campaign.targetCity.length === 0 ||
    campaign.targetCity.includes('all');
  if (!targetsAllCities) {
    conditions.push({
      $or: [
        { city: { $in: campaign.targetCity } },
        { city: '' },
        { city: { $exists: false } },
        { city: null },
      ],
    });
  }

  return conditions;
}

module.exports = { buildCampaignAudienceConditions };
