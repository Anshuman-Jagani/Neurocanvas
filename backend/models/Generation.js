const mongoose = require('mongoose');

const generationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prompt: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    enum: ['style_transfer', 'diffusion', 'gan'],
    required: true
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
  imagePath: {
    type: String,
    required: true
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
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for faster queries
generationSchema.index({ user: 1, createdAt: -1 });
generationSchema.index({ status: 1 });

module.exports = mongoose.model('Generation', generationSchema);
