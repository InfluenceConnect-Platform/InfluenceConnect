const Message = require('../models/Message');
const Deal = require('../models/Deal');
const User = require('../models/User');
const notify = require('../services/email');

const BLOCKED_PATTERN = /(\+?\d[\d\s\-()\u200c]{7,}|[\w.-]+@[\w.-]+\.\w+|https?:\/\/|www\.|instagram|insta\.me|facebook|fb\.com|whatsapp|wa\.me|telegram|t\.me|snapchat)/i;

// ─────────────────────────────────────────
// GET MESSAGES FOR A DEAL
// ─────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const { dealId } = req.params;

    // Verify user is part of this deal
    const deal = await Deal.findById(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const isParticipant =
      deal.influencerId.toString() === req.userId.toString() ||
      deal.brandId.toString() === req.userId.toString();

    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.find({ dealId })
      .sort({ createdAt: 1 })
      .lean();

    // Mark received messages as read
    await Message.updateMany(
      { dealId, receiverId: req.userId, read: false },
      { $set: { read: true } }
    );

    // Ensure ObjectIds are plain strings so frontend === comparison works
    const normalized = messages.map(m => ({
      ...m,
      _id: m._id.toString(),
      senderId: m.senderId.toString(),
      receiverId: m.receiverId.toString(),
      dealId: m.dealId.toString(),
    }));

    res.json({ messages: normalized });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// UNREAD COUNT
// ─────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiverId: req.userId, read: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// SEND MESSAGE
// ─────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Verify deal exists and user is participant
    const deal = await Deal.findById(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const isInfluencer = deal.influencerId.toString() === req.userId.toString();
    const isBrand = deal.brandId.toString() === req.userId.toString();

    if (!isInfluencer && !isBrand) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Freemium daily message limit
    const isPremium = req.user.plan === 'premium';
    if (!isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const messagesToday = await Message.countDocuments({
        senderId: req.userId,
        createdAt: { $gte: today }
      });

      if (messagesToday >= 10) {
        return res.status(403).json({
          error: 'daily_message_limit',
          message: 'You have reached your 10 daily messages on freemium. Upgrade to Premium for unlimited messaging.'
        });
      }
    }

    // Server-side moderation — runs even if client bypasses
    if (BLOCKED_PATTERN.test(content)) {
      // Log the violation
      console.log(`Message blocked — user ${req.userId} attempted to share contact info`);

      return res.status(400).json({
        error: 'message_blocked',
        message: 'Message blocked: sharing contact info, social handles, or external links is not allowed.'
      });
    }

    // Determine receiver
    const receiverId = isInfluencer ? deal.brandId : deal.influencerId;

    const message = await Message.create({
      dealId,
      senderId: req.userId,
      receiverId,
      content: content.trim()
    });

    // Notify the recipient of the new message (#7 influencer / #10 brand)
    const receiver = await User.findById(receiverId).select('email role');
    if (receiver?.email) {
      const payload = { fromName: req.user.name, preview: content.trim().slice(0, 140) };
      if (receiver.role === 'influencer') notify.newMessageToInfluencer(receiver.email, payload);
      else notify.newMessageToBrand(receiver.email, payload);
    }

    // Return plain strings so frontend === comparison works reliably
    res.status(201).json({
      message: {
        ...message.toObject(),
        _id: message._id.toString(),
        senderId: message.senderId.toString(),
        receiverId: message.receiverId.toString(),
        dealId: message.dealId.toString(),
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};