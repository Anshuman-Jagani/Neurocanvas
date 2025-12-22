const express = require('express');
const router = express.Router();
const diffusionService = require('../services/diffusionService');

/**
 * GET /api/diffusion/presets
 * Get prompt templates and presets
 */
router.get('/presets', (req, res) => {
  try {
    const presets = diffusionService.getPresets();
    res.json(presets);
  } catch (error) {
    console.error('Error fetching presets:', error);
    res.status(500).json({ error: 'Failed to fetch presets' });
  }
});

/**
 * POST /api/diffusion/generate
 * Create a new diffusion generation job
 */
router.post('/generate', async (req, res) => {
  try {
    const { 
      prompt, 
      negativePrompt, 
      steps, 
      guidanceScale, 
      width, 
      height, 
      seed,
      userId 
    } = req.body;

    // Validate prompt
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // For now, use a default user ID (in production, get from auth middleware)
    const actualUserId = userId || '000000000000000000000000';

    // Create job
    const parameters = {
      negativePrompt: negativePrompt || '',
      steps: parseInt(steps) || 25,
      guidanceScale: parseFloat(guidanceScale) || 7.5,
      width: parseInt(width) || 512,
      height: parseInt(height) || 512,
      seed: seed ? parseInt(seed) : null
    };

    const { jobId, generationId } = await diffusionService.createJob(
      actualUserId,
      prompt,
      parameters
    );

    res.json({
      success: true,
      jobId,
      generationId,
      message: 'Diffusion generation job created successfully',
      estimatedTime: '2-5 minutes'
    });

  } catch (error) {
    console.error('Error creating diffusion job:', error);
    res.status(500).json({ 
      error: 'Failed to create diffusion job',
      message: error.message 
    });
  }
});

/**
 * GET /api/diffusion/status/:jobId
 * Get status of a diffusion generation job
 */
router.get('/status/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const status = diffusionService.getJobStatus(jobId);

    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(status);
  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

/**
 * GET /api/diffusion/history
 * Get user's generation history
 */
router.get('/history', async (req, res) => {
  try {
    // For now, use a default user ID (in production, get from auth middleware)
    const userId = req.query.userId || '000000000000000000000000';
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;

    const history = await diffusionService.getHistory(userId, limit, skip);

    res.json({ history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
