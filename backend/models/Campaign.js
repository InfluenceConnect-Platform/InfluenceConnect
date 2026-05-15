const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  title: {
    type: String,
    required: [true, 'Campaign title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },

  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  niche: [{
    type: String,
    enum: ['beauty', 'fashion', 'food', 'fitness', 'lifestyle', 'travel', 'tech', 'books']
  }],

  deliverables: {
    type: String,
    required: [true, 'Deliverables are required'],
    // e.g. "2 reels + 3 stories"
  },

  budgetMin: {
    type: Number,
    required: [true, 'Minimum budget is required'],
    min: 0
  },

  budgetMax: {
    type: Number,
    required: [true, 'Maximum budget is required'],
    min: 0
  },

  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },

  targetCity: [{
    type: String,
    default: 'all'
  }],

  targetPlatform: {
    type: String,
    enum: ['instagram', 'youtube', 'facebook', 'any'],
    default: 'any'
  },

  minFollowers: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'completed'],
    default: 'draft'
  },

  applicantCount: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);