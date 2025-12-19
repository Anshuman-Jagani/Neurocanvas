const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../config/uploadMiddleware');
const styleTransferService = require('../services/styleTransferService');

// Predefined styles directory
const stylesDir = path.join(__dirname, '../../data/styles');

/**
 * GET /api/style-transfer/styles
 * Get list of available predefined styles
 */
router.get('/styles', (req, res) => {
  try {
    if (!fs.existsSync(stylesDir)) {
      return res.json({ styles: [] });
    }

    const styleFiles = fs.readdirSync(stylesDir)
      .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
      .map(file => ({
        id: path.basename(file, path.extname(file)),
        name: path.basename(file, path.extname(file))
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase()),
        thumbnail: `/styles/${file}`,
        path: path.join(stylesDir, file)
      }));

    res.json({ styles: styleFiles });
  } catch (error) {
    console.error('Error fetching styles:', error);
    res.status(500).json({ error: 'Failed to fetch styles' });
  }
});

/**
 * POST /api/style-transfer/generate
 * Create a new style transfer job
 */
router.post('/generate', upload.single('content'), async (req, res) => {
  try {
    // Validate content image upload
    if (!req.file) {
      return res.status(400).json({ error: 'Content image is required' });
    }

    // Validate style selection
    const { styleId, iterations, contentWeight, styleWeight, imageSize } = req.body;
    if (!styleId) {
      return res.status(400).json({ error: 'Style selection is required' });
    }

    // Get style image path
    const styleImagePath = path.join(stylesDir, `${styleId}.jpg`);
    const styleImagePathPng = path.join(stylesDir, `${styleId}.png`);
    
    let finalStylePath;
    if (fs.existsSync(styleImagePath)) {
      finalStylePath = styleImagePath;
    } else if (fs.existsSync(styleImagePathPng)) {
      finalStylePath = styleImagePathPng;
    } else {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Selected style not found' });
    }

    // For now, use a default user ID (in production, get from auth middleware)
    const userId = req.body.userId || '000000000000000000000000';

    // Create job
    const parameters = {
      iterations: parseInt(iterations) || 300,
      contentWeight: parseFloat(contentWeight) || 1,
      styleWeight: parseFloat(styleWeight) || 1000000,
      imageSize: parseInt(imageSize) || 512
    };

    const { jobId, generationId } = await styleTransferService.createJob(
      userId,
      req.file.path,
      finalStylePath,
      parameters
    );

    res.json({
      success: true,
      jobId,
      generationId,
      message: 'Style transfer job created successfully'
    });

  } catch (error) {
    console.error('Error creating style transfer job:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to create style transfer job' });
  }
});

/**
 * GET /api/style-transfer/status/:jobId
 * Get status of a style transfer job
 */
router.get('/status/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const status = styleTransferService.getJobStatus(jobId);

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
 * GET /api/style-transfer/history
 * Get user's generation history
 */
router.get('/history', async (req, res) => {
  try {
    // For now, use a default user ID (in production, get from auth middleware)
    const userId = req.query.userId || '000000000000000000000000';
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;

    const history = await styleTransferService.getHistory(userId, limit, skip);

    res.json({ history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
