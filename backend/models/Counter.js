const mongoose = require('mongoose');

// Atomic sequence source for human-readable customIds.
// One document per entity type (influencer, brand, campaign, …); `seq` is
// incremented atomically via findOneAndUpdate so concurrent creates never
// collide on the same number.
const counterSchema = new mongoose.Schema({
  entity: {
    type: String,
    required: true,
    unique: true
  },

  seq: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Counter', counterSchema);
