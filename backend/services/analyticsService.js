const mongoose = require('mongoose');

/**
 * Analytics Service
 * Track user interactions and generate insights
 */
class AnalyticsService {
  /**
   * Track user interaction
   * 
   * @param {string} userId - User identifier
   * @param {string} action - Action type (rate, like, favorite, share, download, generate)
   * @param {Object} metadata - Additional data
   */
  async trackInteraction(userId, action, metadata = {}) {
    const interaction = {
      userId,
      action,
      timestamp: new Date(),
      ...metadata
    };
    
    // Store in a simple collection for now
    // In production, consider using a time-series database or analytics platform
    const db = mongoose.connection.db;
    const collection = db.collection('interactions');
    
    await collection.insertOne(interaction);
    
    return interaction;
  }

  /**
   * Generate insights for a user
   * 
   * @param {string} userId - User identifier
   * @returns {Object} User insights
   */
  async generateInsights(userId) {
    const db = mongoose.connection.db;
    const collection = db.collection('interactions');
    
    // Get all user interactions
    const interactions = await collection
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    
    if (interactions.length === 0) {
      return {
        totalInteractions: 0,
        message: 'No interactions yet'
      };
    }
    
    // Count by action type
    const actionCounts = {};
    interactions.forEach(interaction => {
      actionCounts[interaction.action] = (actionCounts[interaction.action] || 0) + 1;
    });
    
    // Calculate engagement rate
    const totalGenerations = actionCounts.generate || 0;
    const totalFeedback = (actionCounts.rate || 0) + 
                         (actionCounts.like || 0) + 
                         (actionCounts.favorite || 0);
    const engagementRate = totalGenerations > 0 
      ? (totalFeedback / totalGenerations) * 100 
      : 0;
    
    // Get most active time of day
    const hourCounts = {};
    interactions.forEach(interaction => {
      const hour = new Date(interaction.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const mostActiveHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0];
    
    // Calculate average session length (time between first and last interaction per day)
    const sessionsByDay = {};
    interactions.forEach(interaction => {
      const date = new Date(interaction.timestamp).toDateString();
      if (!sessionsByDay[date]) {
        sessionsByDay[date] = [];
      }
      sessionsByDay[date].push(new Date(interaction.timestamp));
    });
    
    const sessionLengths = Object.values(sessionsByDay).map(times => {
      if (times.length < 2) return 0;
      const sorted = times.sort((a, b) => a - b);
      return (sorted[sorted.length - 1] - sorted[0]) / 1000 / 60; // minutes
    });
    
    const avgSessionLength = sessionLengths.length > 0
      ? sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length
      : 0;
    
    return {
      totalInteractions: interactions.length,
      actionCounts,
      engagementRate: Math.round(engagementRate * 100) / 100,
      mostActiveHour: mostActiveHour ? `${mostActiveHour[0]}:00` : 'N/A',
      avgSessionLength: Math.round(avgSessionLength * 100) / 100,
      recentActivity: interactions.slice(0, 10).map(i => ({
        action: i.action,
        timestamp: i.timestamp,
        model: i.model
      }))
    };
  }

  /**
   * Get user statistics for a time period
   * 
   * @param {string} userId - User identifier
   * @param {number} days - Number of days to look back
   */
  async getStatsByPeriod(userId, days = 7) {
    const db = mongoose.connection.db;
    const collection = db.collection('interactions');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const interactions = await collection
      .find({
        userId,
        timestamp: { $gte: startDate }
      })
      .toArray();
    
    // Group by day
    const byDay = {};
    interactions.forEach(interaction => {
      const day = new Date(interaction.timestamp).toDateString();
      if (!byDay[day]) {
        byDay[day] = { date: day, count: 0, actions: {} };
      }
      byDay[day].count += 1;
      byDay[day].actions[interaction.action] = 
        (byDay[day].actions[interaction.action] || 0) + 1;
    });
    
    return {
      period: `${days} days`,
      totalInteractions: interactions.length,
      dailyBreakdown: Object.values(byDay).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      )
    };
  }

  /**
   * A/B testing: Assign user to experiment
   * 
   * @param {string} userId - User identifier
   * @param {string} experimentId - Experiment identifier
   * @returns {string} Variant assigned (A or B)
   */
  async assignExperiment(userId, experimentId) {
    const db = mongoose.connection.db;
    const collection = db.collection('experiments');
    
    // Check if user already assigned
    const existing = await collection.findOne({ userId, experimentId });
    if (existing) {
      return existing.variant;
    }
    
    // Randomly assign to A or B
    const variant = Math.random() < 0.5 ? 'A' : 'B';
    
    await collection.insertOne({
      userId,
      experimentId,
      variant,
      assignedAt: new Date()
    });
    
    return variant;
  }

  /**
   * Get experiment results
   * 
   * @param {string} experimentId - Experiment identifier
   */
  async getExperimentResults(experimentId) {
    const db = mongoose.connection.db;
    const collection = db.collection('experiments');
    
    const assignments = await collection.find({ experimentId }).toArray();
    
    const variantA = assignments.filter(a => a.variant === 'A').length;
    const variantB = assignments.filter(a => a.variant === 'B').length;
    
    return {
      experimentId,
      totalUsers: assignments.length,
      variantA: {
        count: variantA,
        percentage: assignments.length > 0 ? (variantA / assignments.length) * 100 : 0
      },
      variantB: {
        count: variantB,
        percentage: assignments.length > 0 ? (variantB / assignments.length) * 100 : 0
      }
    };
  }

  /**
   * Cohort analysis: Analyze users by cohort
   * 
   * @param {string} cohortId - Cohort identifier (e.g., 'week-1', 'month-2024-01')
   */
  async analyzeCohort(cohortId) {
    const db = mongoose.connection.db;
    const collection = db.collection('interactions');
    
    // Get all users in cohort (users who joined in that period)
    // This is a simplified version - in production, you'd have a users collection
    const interactions = await collection
      .find({ cohortId })
      .toArray();
    
    const userIds = [...new Set(interactions.map(i => i.userId))];
    
    // Calculate retention (users who came back)
    const activeUsers = {};
    interactions.forEach(interaction => {
      const week = Math.floor(
        (new Date(interaction.timestamp) - new Date(interaction.timestamp).setHours(0, 0, 0, 0)) 
        / (7 * 24 * 60 * 60 * 1000)
      );
      if (!activeUsers[week]) {
        activeUsers[week] = new Set();
      }
      activeUsers[week].add(interaction.userId);
    });
    
    const retention = {};
    Object.entries(activeUsers).forEach(([week, users]) => {
      retention[`week${week}`] = {
        activeUsers: users.size,
        retentionRate: (users.size / userIds.length) * 100
      };
    });
    
    return {
      cohortId,
      totalUsers: userIds.length,
      totalInteractions: interactions.length,
      avgInteractionsPerUser: userIds.length > 0 
        ? interactions.length / userIds.length 
        : 0,
      retention
    };
  }

  /**
   * Get trending styles/models
   * 
   * @param {number} days - Number of days to look back
   * @param {number} limit - Number of results to return
   */
  async getTrending(days = 7, limit = 5) {
    const db = mongoose.connection.db;
    const collection = db.collection('interactions');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const interactions = await collection
      .find({
        timestamp: { $gte: startDate },
        action: { $in: ['generate', 'like', 'favorite'] }
      })
      .toArray();
    
    // Count by model
    const modelCounts = {};
    const styleCounts = {};
    
    interactions.forEach(interaction => {
      if (interaction.model) {
        modelCounts[interaction.model] = (modelCounts[interaction.model] || 0) + 1;
      }
      if (interaction.style) {
        styleCounts[interaction.style] = (styleCounts[interaction.style] || 0) + 1;
      }
    });
    
    const trendingModels = Object.entries(modelCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([model, count]) => ({ model, count }));
    
    const trendingStyles = Object.entries(styleCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([style, count]) => ({ style, count }));
    
    return {
      period: `${days} days`,
      trendingModels,
      trendingStyles
    };
  }
}

module.exports = new AnalyticsService();
