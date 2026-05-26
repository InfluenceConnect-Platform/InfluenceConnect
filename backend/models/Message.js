const mongoose = require('mongoose');

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

  content: {
    type: String,
    required: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
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
  }

}, { timestamps: true });

// Conversation history + latest-message preview, newest first.
messageSchema.index({ dealId: 1, createdAt: -1 });
// Unread-count lookups per deal for a given recipient.
messageSchema.index({ dealId: 1, receiverId: 1, read: 1 });

module.exports = mongoose.model('Message', messageSchema);