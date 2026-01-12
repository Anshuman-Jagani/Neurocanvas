const mongoose = require('mongoose');

const modelPreferenceSchema = new mongoose.Schema({
  score: { type: Number, default: 0 },      // Average reward
  pulls: { type: Number, default: 0 },      // Times selected
  wins: { type: Number, default: 0 },       // Positive feedback count
  losses: { type: Number, default: 0 }      // Negative feedback count
}, { _id: false });

const userPreferenceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Model preferences for MAB
  modelPreferences: {
    'style-transfer': {
      type: modelPreferenceSchema,
      default: () => ({ score: 0, pulls: 0, wins: 0, losses: 0 })
    },
    'diffusion': {
      type: modelPreferenceSchema,
      default: () => ({ score: 0, pulls: 0, wins: 0, losses: 0 })
    }
  },
  
  // Style preferences
  stylePreferences: {
    abstract: { type: Number, default: 0 },
    realistic: { type: Number, default: 0 },
    surreal: { type: Number, default: 0 },
    impressionist: { type: Number, default: 0 },
    expressionist: { type: Number, default: 0 },
    minimalist: { type: Number, default: 0 },
    baroque: { type: Number, default: 0 },
    renaissance: { type: Number, default: 0 }
  },
  
  // Color preferences
  colorPreferences: {
    vibrant: { type: Number, default: 0 },
    muted: { type: Number, default: 0 },
    monochrome: { type: Number, default: 0 },
    warm: { type: Number, default: 0 },
    cool: { type: Number, default: 0 },
    pastel: { type: Number, default: 0 },
    neon: { type: Number, default: 0 }
  },
  
  // Mood preferences
  moodPreferences: {
    peaceful: { type: Number, default: 0 },
    dramatic: { type: Number, default: 0 },
    mysterious: { type: Number, default: 0 },
    playful: { type: Number, default: 0 },
    ethereal: { type: Number, default: 0 },
    energetic: { type: Number, default: 0 },
    melancholic: { type: Number, default: 0 }
  },
  
  // MAB parameters
  epsilon: {
    type: Number,
    default: 0.2,  // Start with 20% exploration
    min: 0.05,     // Minimum exploration rate
    max: 1.0
  },
  
  // Statistics
  totalGenerations: {
    type: Number,
    default: 0
  },
  
  totalFeedback: {
    type: Number,
    default: 0
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
userPreferenceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to decay epsilon over time
userPreferenceSchema.methods.decayEpsilon = function() {
  // Exponential decay: epsilon = max(min_epsilon, initial_epsilon * exp(-decay_rate * generations))
  const decayRate = 0.02;
  const newEpsilon = Math.max(
    0.05,
    0.2 * Math.exp(-decayRate * this.totalGenerations)
  );
  this.epsilon = newEpsilon;
  return newEpsilon;
};

// Method to get best model based on current preferences
userPreferenceSchema.methods.getBestModel = function() {
  const models = this.modelPreferences;
  let bestModel = 'diffusion';
  let bestScore = -Infinity;
  
  for (const [modelName, stats] of Object.entries(models)) {
    if (stats.pulls > 0 && stats.score > bestScore) {
      bestScore = stats.score;
      bestModel = modelName;
    }
  }
  
  return { model: bestModel, score: bestScore };
};

// Method to update preferences based on feedback
userPreferenceSchema.methods.updatePreferences = function(model, reward, metadata = {}) {
  // Update model preferences
  if (this.modelPreferences[model]) {
    const modelPref = this.modelPreferences[model];
    modelPref.pulls += 1;
    
    if (reward > 0) {
      modelPref.wins += 1;
    } else if (reward < 0) {
      modelPref.losses += 1;
    }
    
    // Update average score using incremental formula
    const n = modelPref.pulls;
    modelPref.score = ((n - 1) * modelPref.score + reward) / n;
  }
  
  // Update style preferences if provided
  if (metadata.style && this.stylePreferences.hasOwnProperty(metadata.style)) {
    this.stylePreferences[metadata.style] += reward;
  }
  
  // Update color preferences if provided
  if (metadata.color && this.colorPreferences.hasOwnProperty(metadata.color)) {
    this.colorPreferences[metadata.color] += reward;
  }
  
  // Update mood preferences if provided
  if (metadata.mood && this.moodPreferences.hasOwnProperty(metadata.mood)) {
    this.moodPreferences[metadata.mood] += reward;
  }
  
  // Update statistics
  this.totalFeedback += 1;
  
  // Decay epsilon
  this.decayEpsilon();
};

const UserPreference = mongoose.model('UserPreference', userPreferenceSchema);

module.exports = UserPreference;
