const mongoose = require('mongoose');

// A single shared/sent file — brief, photo, video, or reference document.
// Uploaded directly to Cloudinary by the client; only the resulting metadata
// is stored here (mirrors how portfolio items are persisted).
const attachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'video', 'raw'], required: true },
  thumbnailUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  mimeType: { type: String, default: '' }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    required: true
  },

  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Not required — a message can be attachments-only (no caption).
  content: {
    type: String,
    default: '',
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },

  attachments: {
    type: [attachmentSchema],
    default: []
  },

  blocked: {
    type: Boolean,
    default: false
  },

  blockReason: {
    type: String,
    default: ''
  },

  read: {
    type: Boolean,
    default: false
  },

  // System notices (e.g. an admin removed the campaign) are rendered as a
  // centered banner in the chat rather than a sender's bubble.
  system: {
    type: Boolean,
    default: false
  },

  // For system notices only — the text shown to the acting party themselves
  // ("You marked..."), vs `content` which is written for the other party
  // ("X marked..."). Empty when there's no distinct actor's-eye-view (e.g.
  // neutral admin notices), in which case `content` is shown to everyone.
  actorContent: {
    type: String,
    default: ''
  }

}, { timestamps: true });

// Conversation history + latest-message preview, newest first.
messageSchema.index({ dealId: 1, createdAt: -1 });
// Unread-count lookups per deal for a given recipient.
messageSchema.index({ dealId: 1, receiverId: 1, read: 1 });

module.exports = mongoose.model('Message', messageSchema);