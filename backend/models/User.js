const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  preferences: {
    favoriteStyles: [String],
    preferredModels: [String],
    colorPreferences: [String]
  },
  stats: {
    totalGenerations: {
      type: Number,
      default: 0
    },
    favoriteCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
