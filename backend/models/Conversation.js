const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Optional for now (no auth yet)
  },
  
  title: {
    type: String,
    default: 'New Conversation'
  },
  
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      model: String,
      tokens: Number,
      responseTime: Number,
      temperature: Number
    }
  }],
  
  finalPrompt: {
    type: String,
    default: null
  },
  
  generationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Generation',
    default: null
  },
  
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  
  stats: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Update stats before saving
conversationSchema.pre('save', function(next) {
  this.stats.totalMessages = this.messages.length;
  this.stats.totalTokens = this.messages.reduce((sum, msg) => 
    sum + (msg.metadata?.tokens || 0), 0
  );
  
  const responseTimes = this.messages
    .filter(msg => msg.metadata?.responseTime)
    .map(msg => msg.metadata.responseTime);
  
  if (responseTimes.length > 0) {
    this.stats.averageResponseTime = 
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  }
  
  // Auto-generate title from first user message
  if (this.title === 'New Conversation' && this.messages.length > 0) {
    const firstUserMsg = this.messages.find(m => m.role === 'user');
    if (firstUserMsg) {
      this.title = firstUserMsg.content.substring(0, 50) + 
        (firstUserMsg.content.length > 50 ? '...' : '');
    }
  }
  
  next();
});

// Instance methods
conversationSchema.methods.addMessage = function(role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    metadata,
    timestamp: new Date()
  });
  return this.save();
};

conversationSchema.methods.getLastMessage = function() {
  return this.messages[this.messages.length - 1];
};

conversationSchema.methods.getContext = function(limit = null) {
  const messages = limit ? this.messages.slice(-limit) : this.messages;
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
};

module.exports = mongoose.model('Conversation', conversationSchema);
