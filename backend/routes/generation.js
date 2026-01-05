const express = require('express');
const router = express.Router();
const generationQueue = require('../services/generationQueue');
const modelOrchestrator = require('../services/modelOrchestrator');
const Generation = require('../models/Generation');
const axios = require('axios');

/**
 * POST /api/generate
 * Unified generation endpoint
 * Supports auto model selection or manual model specification
 */
router.post('/', async (req, res) => {
  try {
    const { prompt, models, params, userId = 'anonymous', priority = 0 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    let selectedModels = models || ['auto'];
    let analysis = null;
    let enhancedPrompt = prompt;
    
    // If auto mode, get NLP analysis and select models
    if (selectedModels.includes('auto') || selectedModels.length === 0) {
      try {
        // Get NLP analysis
        const nlpResponse = await axios.post('http://localhost:5001/api/nlp/analyze', {
          prompt
        });
        analysis = nlpResponse.data;
        
        // Get enhanced prompt
        const enhanceResponse = await axios.post('http://localhost:5001/api/nlp/enhance', {
          prompt
        });
        enhancedPrompt = enhanceResponse.data.enhancedPrompt || prompt;
        
        // Select models based on analysis
        const recommendations = modelOrchestrator.selectModels(analysis);
        selectedModels = recommendations.map(r => r.model);
        
        console.log(`🤖 Auto-selected models: ${selectedModels.join(', ')}`);
        
      } catch (error) {
        console.error('NLP analysis failed, using default models:', error.message);
        selectedModels = ['diffusion']; // Default to diffusion
      }
    }
    
    // Create database record
    const generation = new Generation({
      userId,
      prompt,
      enhancedPrompt,
      analysis,
      models: selectedModels,
      status: 'pending',
      priority,
      progress: 0
    });
    
    await generation.save();
    
    // Add to queue
    const jobId = generationQueue.addJob(
      userId,
      enhancedPrompt,
      selectedModels,
      priority,
      { ...params, generationId: generation._id }
    );
    
    // Update generation with job ID
    generation.metadata = { jobId };
    await generation.save();
    
    res.json({
      success: true,
      jobId,
      generationId: generation._id,
      selectedModels,
      enhancedPrompt,
      queuePosition: generationQueue.getQueuePosition(jobId),
      message: 'Generation job queued successfully'
    });
    
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/generate/:id/status
 * Get job status
 */
router.get('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const status = generationQueue.getJobStatus(id);
    
    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(status);
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/generate/:id/result
 * Get job result
 */
router.get('/:id/result', async (req, res) => {
  try {
    const { id } = req.params;
    const result = generationQueue.getJobResult(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Job not found or not completed' });
    }
    
    // Also fetch from database if available
    const generation = await Generation.findOne({ 'metadata.jobId': id });
    
    res.json({
      ...result,
      generation: generation ? {
        id: generation._id,
        prompt: generation.prompt,
        enhancedPrompt: generation.enhancedPrompt,
        analysis: generation.analysis,
        userFeedback: generation.userFeedback
      } : null
    });
    
  } catch (error) {
    console.error('Result fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/generate/:id
 * Cancel a job
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cancelled = generationQueue.cancelJob(id);
    
    if (!cancelled) {
      return res.status(400).json({ 
        error: 'Job not found or cannot be cancelled (already processing or completed)' 
      });
    }
    
    // Update database record
    await Generation.updateOne(
      { 'metadata.jobId': id },
      { status: 'cancelled' }
    );
    
    res.json({ 
      success: true, 
      message: 'Job cancelled successfully' 
    });
    
  } catch (error) {
    console.error('Cancellation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/generate/history
 * Get user's generation history
 */
router.get('/history', async (req, res) => {
  try {
    const { userId = 'anonymous', limit = 20 } = req.query;
    
    // Get from queue (recent/active jobs)
    const queueJobs = generationQueue.getUserJobs(userId, parseInt(limit));
    
    // Get from database (historical jobs)
    const dbGenerations = await Generation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('-__v')
      .lean();
    
    // Merge and deduplicate
    const jobMap = new Map();
    
    queueJobs.forEach(job => {
      jobMap.set(job.id, job);
    });
    
    dbGenerations.forEach(gen => {
      const jobId = gen.metadata?.jobId;
      if (jobId && !jobMap.has(jobId)) {
        jobMap.set(gen._id.toString(), {
          id: gen._id,
          prompt: gen.prompt,
          enhancedPrompt: gen.enhancedPrompt,
          models: gen.models,
          status: gen.status,
          createdAt: gen.createdAt,
          completedAt: gen.updatedAt,
          results: gen.results,
          userFeedback: gen.userFeedback
        });
      }
    });
    
    const history = Array.from(jobMap.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit));
    
    res.json({
      history,
      total: history.length
    });
    
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/generate/stats
 * Get queue statistics
 */
router.get('/stats', (req, res) => {
  try {
    const queueStats = generationQueue.getQueueStats();
    const modelStats = modelOrchestrator.getModelStats();
    
    res.json({
      queue: queueStats,
      models: modelStats
    });
    
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/generate/:id/feedback
 * Submit feedback for a generation
 */
router.post('/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, liked, favorited } = req.body;
    
    const generation = await Generation.findById(id);
    
    if (!generation) {
      return res.status(404).json({ error: 'Generation not found' });
    }
    
    // Update feedback
    generation.userFeedback = {
      rating: rating !== undefined ? rating : generation.userFeedback?.rating,
      liked: liked !== undefined ? liked : generation.userFeedback?.liked,
      favorited: favorited !== undefined ? favorited : generation.userFeedback?.favorited
    };
    
    await generation.save();
    
    // Update model stats if rating provided
    if (rating && generation.models) {
      generation.models.forEach(model => {
        modelOrchestrator.updateModelStats(model, {
          score: rating / 5, // Normalize to 0-1
          time: generation.metadata?.generationTime || 0
        });
      });
    }
    
    res.json({
      success: true,
      feedback: generation.userFeedback
    });
    
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Listen to queue events and update database
generationQueue.on('jobCompleted', async (job) => {
  try {
    const generation = await Generation.findOne({ 'metadata.jobId': job.id });
    if (generation) {
      generation.status = 'completed';
      generation.progress = 100;
      generation.results = job.result;
      await generation.save();
      console.log(`✅ Updated database for job ${job.id}`);
    }
  } catch (error) {
    console.error('Failed to update database:', error);
  }
});

generationQueue.on('jobFailed', async (job) => {
  try {
    const generation = await Generation.findOne({ 'metadata.jobId': job.id });
    if (generation) {
      generation.status = 'failed';
      generation.error = job.error;
      await generation.save();
      console.log(`❌ Updated database for failed job ${job.id}`);
    }
  } catch (error) {
    console.error('Failed to update database:', error);
  }
});

generationQueue.on('jobProgress', async (job) => {
  try {
    const generation = await Generation.findOne({ 'metadata.jobId': job.id });
    if (generation) {
      generation.progress = job.progress;
      generation.status = job.status;
      await generation.save();
    }
  } catch (error) {
    console.error('Failed to update progress:', error);
  }
});

module.exports = router;
