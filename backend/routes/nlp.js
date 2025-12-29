const express = require('express');
const router = express.Router();
const nlpService = require('../services/nlpService');
const Prompt = require('../models/Prompt');

/**
 * POST /api/nlp/analyze
 * Analyze a prompt for sentiment, keywords, and artistic concepts
 */
router.post('/analyze', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid prompt',
        message: 'Prompt is required and must be a non-empty string'
      });
    }

    // Analyze the prompt
    const analysis = await nlpService.analyzePrompt(prompt.trim());

    // Save to database (optional - can be linked to userId later)
    const promptDoc = new Prompt({
      originalPrompt: prompt.trim(),
      analysis: analysis
    });
    await promptDoc.save();

    res.json({
      success: true,
      prompt: prompt.trim(),
      analysis: analysis,
      promptId: promptDoc._id
    });
  } catch (error) {
    console.error('Analyze endpoint error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

/**
 * POST /api/nlp/enhance
 * Enhance a prompt with artistic terminology
 */
router.post('/enhance', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid prompt',
        message: 'Prompt is required and must be a non-empty string'
      });
    }

    // Enhance the prompt
    const enhanced = await nlpService.enhancePrompt(prompt.trim());

    // Update or create prompt document
    const promptDoc = await Prompt.findOneAndUpdate(
      { originalPrompt: prompt.trim() },
      {
        originalPrompt: prompt.trim(),
        enhancedPrompt: enhanced.enhancedPrompt,
        $inc: { usageCount: 1 }
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      originalPrompt: prompt.trim(),
      enhancedPrompt: enhanced.enhancedPrompt,
      suggestions: enhanced.suggestions || [],
      promptId: promptDoc._id
    });
  } catch (error) {
    console.error('Enhance endpoint error:', error);
    res.status(500).json({
      error: 'Enhancement failed',
      message: error.message
    });
  }
});

/**
 * POST /api/nlp/keywords
 * Extract keywords from a prompt
 */
router.post('/keywords', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid prompt',
        message: 'Prompt is required and must be a non-empty string'
      });
    }

    const keywords = await nlpService.extractKeywords(prompt.trim());

    res.json({
      success: true,
      prompt: prompt.trim(),
      keywords: keywords
    });
  } catch (error) {
    console.error('Keywords endpoint error:', error);
    res.status(500).json({
      error: 'Keyword extraction failed',
      message: error.message
    });
  }
});

/**
 * POST /api/nlp/sentiment
 * Analyze sentiment of a prompt
 */
router.post('/sentiment', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid prompt',
        message: 'Prompt is required and must be a non-empty string'
      });
    }

    const sentiment = await nlpService.analyzeSentiment(prompt.trim());

    res.json({
      success: true,
      prompt: prompt.trim(),
      sentiment: sentiment
    });
  } catch (error) {
    console.error('Sentiment endpoint error:', error);
    res.status(500).json({
      error: 'Sentiment analysis failed',
      message: error.message
    });
  }
});

/**
 * GET /api/nlp/presets
 * Get predefined prompt templates
 */
router.get('/presets', (req, res) => {
  try {
    const presets = nlpService.getPromptPresets();
    res.json({
      success: true,
      presets: presets
    });
  } catch (error) {
    console.error('Presets endpoint error:', error);
    res.status(500).json({
      error: 'Failed to load presets',
      message: error.message
    });
  }
});

/**
 * GET /api/nlp/history
 * Get prompt history (recent prompts)
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const prompts = await Prompt.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('originalPrompt enhancedPrompt analysis createdAt usageCount isFavorite');

    res.json({
      success: true,
      prompts: prompts
    });
  } catch (error) {
    console.error('History endpoint error:', error);
    res.status(500).json({
      error: 'Failed to load history',
      message: error.message
    });
  }
});

/**
 * PUT /api/nlp/favorite/:id
 * Toggle favorite status of a prompt
 */
router.put('/favorite/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const prompt = await Prompt.findById(id);
    if (!prompt) {
      return res.status(404).json({
        error: 'Prompt not found'
      });
    }

    prompt.isFavorite = !prompt.isFavorite;
    await prompt.save();

    res.json({
      success: true,
      prompt: prompt
    });
  } catch (error) {
    console.error('Favorite endpoint error:', error);
    res.status(500).json({
      error: 'Failed to update favorite',
      message: error.message
    });
  }
});

module.exports = router;
