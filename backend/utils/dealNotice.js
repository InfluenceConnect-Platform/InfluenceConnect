const Message = require('../models/Message');

/**
 * Drop a system notice into a deal's chat thread.
 *
 * It's stored as an unread message for the receiver, which (a) lights the
 * "Messages" notification dot in their nav via /api/messages/unread-count and
 * (b) renders in the chat as a centered system banner. This is how every deal
 * lifecycle event (offer, accept, mark-done, complete, cancel) reaches the
 * other party in-app, regardless of who triggered it.
 *
 * Failures are swallowed: a missing notice must never break the action that
 * triggered it (accepting a deal, completing it, …).
 */
async function postDealNotice({ dealId, senderId, receiverId, content }) {
  try {
    if (!dealId || !senderId || !receiverId || !content) return;
    await Message.create({ dealId, senderId, receiverId, content, system: true });
  } catch (err) {
    console.error('postDealNotice failed:', err);
  }
}

module.exports = { postDealNotice };
