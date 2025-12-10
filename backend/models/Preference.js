const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modelPreferences: {
    style_transfer: {
      count: { type: Number, default: 0 },
      avgRating: { type: Number, default: 0 },
      favoriteStyles: [String]
    },
    diffusion: {
      count: { type: Number, default: 0 },
      avgRating: { type: Number, default: 0 }
    },
    gan: {
      count: { type: Number, default: 0 },
      avgRating: { type: Number, default: 0 }
    }
  },
  banditState: {
    // Multi-Armed Bandit algorithm state
    modelArms: {
      style_transfer: {
        alpha: { type: Number, default: 1 },
        beta: { type: Number, default: 1 }
      },
      diffusion: {
        alpha: { type: Number, default: 1 },
        beta: { type: Number, default: 1 }
      },
      gan: {
        alpha: { type: Number, default: 1 },
        beta: { type: Number, default: 1 }
      }
    }
  },
  styleEmbeddings: {
    // Store learned style preferences as vectors
    type: Map,
    of: [Number]
  }
}, {
  timestamps: true
});

// Ensure one preference document per user
preferenceSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model('Preference', preferenceSchema);
