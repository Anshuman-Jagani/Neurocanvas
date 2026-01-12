const express = require('express');
const router = express.Router();
const mabService = require('../services/mabService');
const analyticsService = require('../services/analyticsService');

/**
 * Calculate reward from star rating
 * 1-2 stars: negative reward
 * 3 stars: neutral (0)
 * 4-5 stars: positive reward
 */
function calculateReward(stars) {
  return (stars - 3) / 2; // Maps 1-5 to -1 to 1
}

/**
 * POST /api/feedback/rate
 * Rate an image (1-5 stars)
 */
router.post('/rate', async (req, res) => {
  try {
    const { userId, generationId, model, stars, metadata = {} } = req.body;
    
    // Validation
    if (!userId || !model || !stars) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, model, stars' 
      });
    }
    
    if (stars < 1 || stars > 5) {
      return res.status(400).json({ 
        error: 'Stars must be between 1 and 5' 
      });
    }
    
    // Calculate reward
    const reward = calculateReward(stars);
    
    // Update MAB preferences
    const updateResult = await mabService.updatePreferences(
      userId, 
      model, 
      reward, 
      metadata
    );
    
    // Track interaction
    await analyticsService.trackInteraction(userId, 'rate', {
      generationId,
      model,
      stars,
      reward,
      ...metadata
    });
    
    res.json({
      success: true,
      stars,
      reward,
      epsilon: updateResult.epsilon,
      message: 'Rating recorded successfully'
    });
  } catch (error) {
    console.error('Error recording rating:', error);
    res.status(500).json({ error: 'Failed to record rating' });
  }
});

/**
 * POST /api/feedback/like
 * Like or unlike an image
 */
router.post('/like', async (req, res) => {
  try {
    const { userId, generationId, model, liked, metadata = {} } = req.body;
    
    if (!userId || !model || liked === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, model, liked' 
      });
    }
    
    // Reward: +0.5 for like, -0.5 for unlike
    const reward = liked ? 0.5 : -0.5;
    
    // Update MAB preferences
    const updateResult = await mabService.updatePreferences(
      userId, 
      model, 
      reward, 
      metadata
    );
    
    // Track interaction
    await analyticsService.trackInteraction(userId, 'like', {
      generationId,
      model,
      liked,
      reward,
      ...metadata
    });
    
    res.json({
      success: true,
      liked,
      reward,
      epsilon: updateResult.epsilon,
      message: liked ? 'Image liked' : 'Like removed'
    });
  } catch (error) {
    console.error('Error recording like:', error);
    res.status(500).json({ error: 'Failed to record like' });
  }
});

/**
 * POST /api/feedback/favorite
 * Toggle favorite status
 */
router.post('/favorite', async (req, res) => {
  try {
    const { userId, generationId, model, favorited, metadata = {} } = req.body;
    
    if (!userId || !model || favorited === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, model, favorited' 
      });
    }
    
    // Reward: +1.0 for favorite, -1.0 for unfavorite
    const reward = favorited ? 1.0 : -1.0;
    
    // Update MAB preferences
    const updateResult = await mabService.updatePreferences(
      userId, 
      model, 
      reward, 
      metadata
    );
    
    // Track interaction
    await analyticsService.trackInteraction(userId, 'favorite', {
      generationId,
      model,
      favorited,
      reward,
      ...metadata
    });
    
    res.json({
      success: true,
      favorited,
      reward,
      epsilon: updateResult.epsilon,
      message: favorited ? 'Added to favorites' : 'Removed from favorites'
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

/**
 * POST /api/feedback/share
 * Track when user shares an image
 */
router.post('/share', async (req, res) => {
  try {
    const { userId, generationId, model, platform, metadata = {} } = req.body;
    
    if (!userId || !model) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, model' 
      });
    }
    
    // Reward: +0.8 for sharing
    const reward = 0.8;
    
    // Update MAB preferences
    const updateResult = await mabService.updatePreferences(
      userId, 
      model, 
      reward, 
      metadata
    );
    
    // Track interaction
    await analyticsService.trackInteraction(userId, 'share', {
      generationId,
      model,
      platform,
      reward,
      ...metadata
    });
    
    res.json({
      success: true,
      reward,
      epsilon: updateResult.epsilon,
      message: 'Share tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking share:', error);
    res.status(500).json({ error: 'Failed to track share' });
  }
});

/**
 * POST /api/feedback/download
 * Track when user downloads an image
 */
router.post('/download', async (req, res) => {
  try {
    const { userId, generationId, model, metadata = {} } = req.body;
    
    if (!userId || !model) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, model' 
      });
    }
    
    // Reward: +0.6 for download
    const reward = 0.6;
    
    // Update MAB preferences
    const updateResult = await mabService.updatePreferences(
      userId, 
      model, 
      reward, 
      metadata
    );
    
    // Track interaction
    await analyticsService.trackInteraction(userId, 'download', {
      generationId,
      model,
      reward,
      ...metadata
    });
    
    res.json({
      success: true,
      reward,
      epsilon: updateResult.epsilon,
      message: 'Download tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking download:', error);
    res.status(500).json({ error: 'Failed to track download' });
  }
});

/**
 * GET /api/feedback/stats
 * Get user statistics and preferences
 */
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing required parameter: userId' 
      });
    }
    
    // Get MAB stats
    const mabStats = await mabService.getStats(userId);
    
    // Get analytics insights
    const insights = await analyticsService.generateInsights(userId);
    
    // Get recommendations
    const recommendations = await mabService.getRecommendations(userId, 5);
    
    res.json({
      success: true,
      mabStats,
      insights,
      recommendations
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/feedback/recommendations
 * Get personalized recommendations
 */
router.get('/recommendations', async (req, res) => {
  try {
    const { userId, count = 5 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing required parameter: userId' 
      });
    }
    
    const recommendations = await mabService.getRecommendations(
      userId, 
      parseInt(count)
    );
    
    // Get trending content
    const trending = await analyticsService.getTrending(7, 5);
    
    res.json({
      success: true,
      personalized: recommendations,
      trending
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

/**
 * POST /api/feedback/model-selection
 * Get intelligent model selection using MAB
 */
router.post('/model-selection', async (req, res) => {
  try {
    const { userId, algorithm = 'epsilon-greedy' } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing required field: userId' 
      });
    }
    
    const selection = await mabService.selectModel(userId, algorithm);
    
    res.json({
      success: true,
      ...selection
    });
  } catch (error) {
    console.error('Error selecting model:', error);
    res.status(500).json({ error: 'Failed to select model' });
  }
});

module.exports = router;
