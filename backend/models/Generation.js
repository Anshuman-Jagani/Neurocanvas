const mongoose = require('mongoose');

const generationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Made optional for now (can use userId string)
  },
  userId: {
    type: String,
    index: true
  },
  prompt: {
    type: String,
    required: true,
    trim: true
  },
  enhancedPrompt: {
    type: String
  },
  analysis: {
    type: Object // NLP analysis results
  },
  // Support for multi-model generation
  models: [{
    type: String,
    enum: ['style-transfer', 'diffusion', 'auto']
  }],
  // Legacy single model support (for backward compatibility)
  model: {
    type: String,
    enum: ['style_transfer', 'diffusion', 'gan', 'style-transfer']
  },
  style: {
    type: String,
    default: null
  },
  parameters: {
    resolution: String,
    steps: Number,
    seed: Number,
    customParams: mongoose.Schema.Types.Mixed
  },
  // Multi-model results
  results: [{
    model: String,
    imageUrl: String,
    imagePath: String,
    score: Number,
    metadata: Object,
    generatedAt: Date
  }],
  // Legacy single image support
  imagePath: {
    type: String
  },
  thumbnail: String,
  metadata: {
    generationTime: Number, // in seconds
    modelVersion: String,
    fileSize: Number
  },
  userFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    liked: Boolean,
    favorited: Boolean
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  priority: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  error: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
generationSchema.index({ user: 1, createdAt: -1 });
generationSchema.index({ userId: 1, createdAt: -1 });
generationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Generation', generationSchema);
