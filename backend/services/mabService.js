const UserPreference = require('../models/UserPreference');

/**
 * Multi-Armed Bandit Service
 * Implements three MAB algorithms for intelligent model selection
 */
class MABService {
  /**
   * Get or create user preferences
   */
  async getUserPreferences(userId) {
    let preferences = await UserPreference.findOne({ userId });
    
    if (!preferences) {
      preferences = new UserPreference({ userId });
      await preferences.save();
    }
    
    return preferences;
  }

  /**
   * Epsilon-Greedy Algorithm
   * With probability ε: explore (random selection)
   * With probability 1-ε: exploit (best arm)
   * 
   * @param {string} userId - User identifier
   * @param {number} epsilon - Exploration rate (optional, uses user's epsilon if not provided)
   * @returns {Object} { model, algorithm, confidence }
   */
  async epsilonGreedy(userId, epsilon = null) {
    const preferences = await this.getUserPreferences(userId);
    const eps = epsilon !== null ? epsilon : preferences.epsilon;
    
    // Explore: random selection
    if (Math.random() < eps) {
      const models = Object.keys(preferences.modelPreferences);
      const randomModel = models[Math.floor(Math.random() * models.length)];
      
      return {
        model: randomModel,
        algorithm: 'epsilon-greedy',
        confidence: 1 - eps,
        exploring: true
      };
    }
    
    // Exploit: select best model
    const { model, score } = preferences.getBestModel();
    
    return {
      model,
      algorithm: 'epsilon-greedy',
      confidence: 1 - eps,
      exploring: false,
      score
    };
  }

  /**
   * Upper Confidence Bound (UCB) Algorithm
   * UCB = average_reward + sqrt(2 * ln(total_pulls) / arm_pulls)
   * Balances exploitation and exploration with optimism
   * 
   * @param {string} userId - User identifier
   * @returns {Object} { model, algorithm, confidence, ucbScores }
   */
  async ucb(userId) {
    const preferences = await this.getUserPreferences(userId);
    const totalPulls = preferences.totalGenerations || 1;
    
    let bestModel = null;
    let bestUCB = -Infinity;
    const ucbScores = {};
    
    for (const [modelName, stats] of Object.entries(preferences.modelPreferences)) {
      let ucbValue;
      
      if (stats.pulls === 0) {
        // Unplayed arms get infinite UCB (ensures exploration)
        ucbValue = Infinity;
      } else {
        // UCB formula
        const exploitation = stats.score;
        const exploration = Math.sqrt((2 * Math.log(totalPulls)) / stats.pulls);
        ucbValue = exploitation + exploration;
      }
      
      ucbScores[modelName] = ucbValue;
      
      if (ucbValue > bestUCB) {
        bestUCB = ucbValue;
        bestModel = modelName;
      }
    }
    
    return {
      model: bestModel,
      algorithm: 'ucb',
      confidence: bestUCB > 0 ? Math.min(bestUCB, 1) : 0.5,
      ucbScores
    };
  }

  /**
   * Thompson Sampling Algorithm
   * Bayesian approach using Beta distribution
   * Sample from Beta(wins+1, losses+1) for each arm
   * 
   * @param {string} userId - User identifier
   * @returns {Object} { model, algorithm, confidence, samples }
   */
  async thompsonSampling(userId) {
    const preferences = await this.getUserPreferences(userId);
    
    let bestModel = null;
    let bestSample = -Infinity;
    const samples = {};
    
    for (const [modelName, stats] of Object.entries(preferences.modelPreferences)) {
      // Beta distribution parameters (add 1 for prior)
      const alpha = stats.wins + 1;
      const beta = stats.losses + 1;
      
      // Sample from Beta distribution
      const sample = this.sampleBeta(alpha, beta);
      samples[modelName] = sample;
      
      if (sample > bestSample) {
        bestSample = sample;
        bestModel = modelName;
      }
    }
    
    return {
      model: bestModel,
      algorithm: 'thompson-sampling',
      confidence: bestSample,
      samples
    };
  }

  /**
   * Sample from Beta distribution using Gamma distribution
   * Beta(α, β) = Gamma(α) / (Gamma(α) + Gamma(β))
   */
  sampleBeta(alpha, beta) {
    const x = this.sampleGamma(alpha);
    const y = this.sampleGamma(beta);
    return x / (x + y);
  }

  /**
   * Sample from Gamma distribution using Marsaglia and Tsang method
   */
  sampleGamma(shape, scale = 1) {
    if (shape < 1) {
      // Use shape augmentation
      return this.sampleGamma(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
    }
    
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    
    while (true) {
      let x, v;
      do {
        x = this.randomNormal();
        v = 1 + c * x;
      } while (v <= 0);
      
      v = v * v * v;
      const u = Math.random();
      
      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v * scale;
      }
      
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  /**
   * Generate random number from standard normal distribution
   * Using Box-Muller transform
   */
  randomNormal() {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /**
   * Select model using specified algorithm
   * Default: epsilon-greedy
   * 
   * @param {string} userId - User identifier
   * @param {string} algorithm - 'epsilon-greedy', 'ucb', or 'thompson-sampling'
   * @returns {Object} Selection result
   */
  async selectModel(userId, algorithm = 'epsilon-greedy') {
    switch (algorithm) {
      case 'ucb':
        return await this.ucb(userId);
      case 'thompson-sampling':
        return await this.thompsonSampling(userId);
      case 'epsilon-greedy':
      default:
        return await this.epsilonGreedy(userId);
    }
  }

  /**
   * Update preferences based on user feedback
   * 
   * @param {string} userId - User identifier
   * @param {string} model - Model that was used
   * @param {number} reward - Reward value (-1 to 1)
   * @param {Object} metadata - Additional metadata (style, color, mood)
   */
  async updatePreferences(userId, model, reward, metadata = {}) {
    const preferences = await this.getUserPreferences(userId);
    
    // Update preferences using model method
    preferences.updatePreferences(model, reward, metadata);
    
    // Increment generation count
    preferences.totalGenerations += 1;
    
    // Save updated preferences
    await preferences.save();
    
    return {
      success: true,
      epsilon: preferences.epsilon,
      totalGenerations: preferences.totalGenerations,
      modelScore: preferences.modelPreferences[model]?.score
    };
  }

  /**
   * Get personalized recommendations based on preferences
   * 
   * @param {string} userId - User identifier
   * @param {number} count - Number of recommendations
   * @returns {Array} Recommended prompts/styles
   */
  async getRecommendations(userId, count = 5) {
    const preferences = await this.getUserPreferences(userId);
    
    // Get top styles
    const topStyles = Object.entries(preferences.stylePreferences)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([style]) => style);
    
    // Get top colors
    const topColors = Object.entries(preferences.colorPreferences)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([color]) => color);
    
    // Get top moods
    const topMoods = Object.entries(preferences.moodPreferences)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([mood]) => mood);
    
    // Get best model
    const { model: bestModel } = preferences.getBestModel();
    
    return {
      recommendedModel: bestModel,
      topStyles,
      topColors,
      topMoods,
      epsilon: preferences.epsilon,
      totalGenerations: preferences.totalGenerations
    };
  }

  /**
   * Calculate UCB scores for all models
   * Useful for analytics and debugging
   */
  async calculateUCB(userId) {
    const result = await this.ucb(userId);
    return result.ucbScores;
  }

  /**
   * Get user statistics
   */
  async getStats(userId) {
    const preferences = await this.getUserPreferences(userId);
    
    return {
      userId: preferences.userId,
      totalGenerations: preferences.totalGenerations,
      totalFeedback: preferences.totalFeedback,
      epsilon: preferences.epsilon,
      modelPreferences: preferences.modelPreferences,
      stylePreferences: preferences.stylePreferences,
      colorPreferences: preferences.colorPreferences,
      moodPreferences: preferences.moodPreferences,
      bestModel: preferences.getBestModel()
    };
  }
}

module.exports = new MABService();
