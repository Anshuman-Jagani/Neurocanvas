const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema({
  originalPrompt: {
    type: String,
    required: true,
    trim: true
  },
  enhancedPrompt: {
    type: String,
    trim: true
  },
  analysis: {
    sentiment: {
      label: String,
      score: Number
    },
    keywords: [String],
    artisticConcepts: [String],
    suggestedStyles: [String],
    mood: String,
    colorPalette: [String]
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  usageCount: {
    type: Number,
    default: 0
  },
  isFavorite: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
promptSchema.index({ userId: 1, createdAt: -1 });
promptSchema.index({ 'analysis.keywords': 1 });

const Prompt = mongoose.model('Prompt', promptSchema);

module.exports = Prompt;
