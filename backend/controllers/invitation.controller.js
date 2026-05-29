const Invitation = require('../models/Invitation');
const Campaign = require('../models/Campaign');
const Application = require('../models/Application');
const Deal = require('../models/Deal');
const User = require('../models/User');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');

// ─────────────────────────────────────────
// BRAND → SEND INVITATIONS (premium only)
// ─────────────────────────────────────────
// Body: { campaignId, influencerIds: [userId, ...], message? }
exports.sendInvitations = async (req, res) => {
  try {
    // Premium gate — proactive invitations are a Premium-only feature.
    if (req.user.plan !== 'premium') {
      return res.status(403).json({
        error: 'premium_only',
        message: 'Upgrade to Premium to invite influencers to your campaigns.'
      });
    }

    const { campaignId, influencerIds, message } = req.body;

    if (!campaignId) {
      return res.status(400).json({ error: 'A campaign is required.' });
    }
    const ids = Array.isArray(influencerIds) ? influencerIds.filter(Boolean) : [];
    if (ids.length === 0) {
      return res.status(400).json({ error: 'Select at least one influencer to invite.' });
    }

    // Campaign must belong to this brand and be live (published).
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });
    if (campaign.brandId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    if (!['active', 'in-progress'].includes(campaign.status)) {
      return res.status(400).json({ error: 'You can only invite influencers to a published campaign.' });
    }

    // Keep only valid influencer accounts.
    const validInfluencers = await User.find({
      _id: { $in: ids },
      role: 'influencer'
    }).select('_id');
    const validIds = validInfluencers.map(u => u._id.toString());

    // Skip anyone already invited to this campaign (unique index also guards this).
    const existing = await Invitation.find({
      campaignId,
      influencerId: { $in: validIds }
    }).select('influencerId');
    const alreadyInvited = new Set(existing.map(i => i.influencerId.toString()));

    const toCreate = validIds
      .filter(id => !alreadyInvited.has(id))
      .map(id => ({
        campaignId,
        brandId: req.userId,
        influencerId: id,
        message: (message || '').trim().slice(0, 500),
      }));

    let created = [];
    if (toCreate.length > 0) {
      created = await Invitation.insertMany(toCreate, { ordered: false });
    }

    res.json({
      message: created.length
        ? `Invitation${created.length > 1 ? 's' : ''} sent to ${created.length} influencer${created.length > 1 ? 's' : ''}.`
        : 'No new invitations sent.',
      invited: created.length,
      skipped: validIds.length - created.length,
    });
  } catch (error) {
    console.error('Send invitations error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// BRAND → LIST SENT INVITATIONS
// ─────────────────────────────────────────
// Optional ?campaignId= to scope to a single campaign (used by Discover invite mode).
exports.getBrandInvitations = async (req, res) => {
  try {
    const query = { brandId: req.userId };
    if (req.query.campaignId) query.campaignId = req.query.campaignId;

    const invitations = await Invitation.find(query)
      .populate('campaignId', 'title status budgetMin budgetMax niche')
      .sort({ createdAt: -1 });

    // Attach the influencer's public profile (name, slug, avatar) for display.
    const influencerIds = invitations.map(i => i.influencerId);
    const [users, profiles] = await Promise.all([
      User.find({ _id: { $in: influencerIds } }).select('name'),
      InfluencerProfile.find({ userId: { $in: influencerIds } }).select('userId slug profilePicUrl'),
    ]);
    const nameByUser = new Map(users.map(u => [u._id.toString(), u.name]));
    const profByUser = new Map(profiles.map(p => [p.userId.toString(), p]));

    const result = invitations.map(inv => {
      const obj = inv.toObject();
      const prof = profByUser.get(inv.influencerId.toString());
      return {
        ...obj,
        influencerName: nameByUser.get(inv.influencerId.toString()) || 'Influencer',
        influencerSlug: prof?.slug || '',
        influencerProfilePicUrl: prof?.profilePicUrl || '',
      };
    });

    res.json({ invitations: result });
  } catch (error) {
    console.error('Get brand invitations error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// BRAND → COUNT NEW RESPONSES (nav badge)
// ─────────────────────────────────────────
exports.getBrandResponseCount = async (req, res) => {
  try {
    const count = await Invitation.countDocuments({
      brandId: req.userId,
      status: { $in: ['accepted', 'rejected'] },
      brandSeenResponse: false,
    });
    res.json({ count });
  } catch (error) {
    console.error('Get brand response count error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// BRAND → MARK RESPONSES SEEN (clears badge)
// ─────────────────────────────────────────
exports.markBrandResponsesSeen = async (req, res) => {
  try {
    await Invitation.updateMany(
      { brandId: req.userId, status: { $in: ['accepted', 'rejected'] }, brandSeenResponse: false },
      { $set: { brandSeenResponse: true } }
    );
    res.json({ message: 'Marked as seen.' });
  } catch (error) {
    console.error('Mark brand responses seen error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// INFLUENCER → LIST RECEIVED INVITATIONS
// ─────────────────────────────────────────
exports.getInfluencerInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({ influencerId: req.userId })
      .populate('campaignId', 'title description deliverables niche budgetMin budgetMax deadline status targetPlatform targetCity minFollowers')
      .populate('brandId', 'name')
      .sort({ createdAt: -1 });

    // Attach full brand profile details for each invitation.
    const brandIds = invitations.map(i => i.brandId?._id || i.brandId);
    const brandProfiles = await BrandProfile.find({ userId: { $in: brandIds } })
      .select('userId logoUrl companyName description website industry gstinVerified');
    const profByBrand = new Map(brandProfiles.map(b => [b.userId.toString(), b]));

    const result = invitations.map(inv => {
      const obj = inv.toObject();
      const bId = (inv.brandId?._id || inv.brandId).toString();
      const bProf = profByBrand.get(bId);
      return {
        ...obj,
        brandLogoUrl:       bProf?.logoUrl || '',
        brandCompanyName:   bProf?.companyName || inv.brandId?.name || 'Brand',
        brandDescription:   bProf?.description || '',
        brandWebsite:       bProf?.website || '',
        brandIndustry:      bProf?.industry || '',
        brandGstinVerified: bProf?.gstinVerified || false,
      };
    });

    res.json({ invitations: result });
  } catch (error) {
    console.error('Get influencer invitations error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// INFLUENCER → PENDING COUNT (nav badge)
// ─────────────────────────────────────────
exports.getInfluencerPendingCount = async (req, res) => {
  try {
    const count = await Invitation.countDocuments({
      influencerId: req.userId,
      status: 'pending',
    });
    res.json({ count });
  } catch (error) {
    console.error('Get influencer pending count error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// INFLUENCER → RESPOND (accept / reject)
// ─────────────────────────────────────────
// Body: { action: 'accept' | 'reject' }
// Accepting mirrors the existing application-acceptance flow exactly:
// an accepted Application + a Deal are created so the rest of the platform
// (messaging, negotiation, lifecycle) works unchanged.
exports.respondToInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { action } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action.' });
    }

    const invitation = await Invitation.findById(invitationId)
      .populate('campaignId');
    if (!invitation) return res.status(404).json({ error: 'Invitation not found.' });

    if (invitation.influencerId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'This invitation has already been responded to.' });
    }

    // ── Reject ──
    if (action === 'reject') {
      invitation.status = 'rejected';
      invitation.respondedAt = new Date();
      invitation.brandSeenResponse = false; // notify the brand
      await invitation.save();
      return res.json({ message: 'Invitation declined.', status: 'rejected' });
    }

    // ── Accept ── (create Application + Deal, mirroring brand.updateApplicationStatus)
    const campaign = invitation.campaignId;
    if (!campaign) return res.status(404).json({ error: 'Campaign no longer exists.' });

    // Reuse an existing application if the influencer already applied, else create one.
    let application = await Application.findOne({
      campaignId: campaign._id,
      influencerId: req.userId,
    });
    if (!application) {
      application = await Application.create({
        campaignId: campaign._id,
        influencerId: req.userId,
        brandId: invitation.brandId,
        message: 'Accepted a campaign invitation.',
        proposedRate: 0,
        status: 'accepted',
      });
    } else {
      application.status = 'accepted';
      await application.save();
    }

    // Create the deal if one doesn't already exist for this application.
    let deal = await Deal.findOne({ applicationId: application._id });
    if (!deal) {
      deal = await Deal.create({
        campaignId: campaign._id,
        applicationId: application._id,
        influencerId: req.userId,
        brandId: invitation.brandId,
        agreedAmount: application.proposedRate || campaign.budgetMin,
        status: 'in-progress',
      });
    }

    // Mark campaign in-progress while the deal is active.
    await Campaign.findByIdAndUpdate(campaign._id, { status: 'in-progress' });

    // Put all other pending applications on hold (reinstated if the deal is cancelled).
    await Application.updateMany(
      {
        campaignId: campaign._id,
        _id: { $ne: application._id },
        status: { $in: ['applied', 'shortlisted'] },
      },
      { $set: { status: 'on-hold' } }
    );

    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    invitation.dealId = deal._id;
    invitation.brandSeenResponse = false; // notify the brand
    await invitation.save();

    res.json({
      message: 'Invitation accepted — a deal has been created.',
      status: 'accepted',
      dealId: deal._id.toString(),
    });
  } catch (error) {
    console.error('Respond to invitation error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};
