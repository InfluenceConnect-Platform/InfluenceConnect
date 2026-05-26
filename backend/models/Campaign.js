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
    default: '',
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  niche: [{
    type: String,
    enum: ['beauty', 'fashion', 'food', 'fitness', 'lifestyle', 'travel', 'tech', 'books']
  }],

  deliverables: {
    type: String,
    default: '',
  },

  budgetMin: {
    type: Number,
    default: 0,
    min: 0
  },

  budgetMax: {
    type: Number,
    default: 0,
    min: 0
  },

  deadline: {
    type: Date,
    default: null
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
    enum: ['draft', 'active', 'in-progress', 'closed', 'completed'],
    default: 'draft'
  },

  applicantCount: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

// Brand campaign lists, often filtered by status.
campaignSchema.index({ brandId: 1, status: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);