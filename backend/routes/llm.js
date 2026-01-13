const express = require('express');
const router = express.Router();
const llmService = require('../services/llmService');
const Conversation = require('../models/Conversation');

/**
 * POST /api/llm/chat
 * Chat with the art director
 */
router.post('/chat', async (req, res) => {
  try {
    const { conversationId, message, stream = false } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }
    } else {
      conversation = new Conversation({
        status: 'active'
      });
      await conversation.save();
    }

    // Handle streaming
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const streamEmitter = llmService.streamChat(conversation._id.toString(), message);

      let fullResponse = '';

      streamEmitter.on('token', (token) => {
        fullResponse += token;
        res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
      });

      streamEmitter.on('done', async (data) => {
        // Save messages to conversation
        await conversation.addMessage('user', message);
        await conversation.addMessage('assistant', fullResponse, {
          tokens: data.tokens,
          responseTime: data.responseTime
        });

        res.write(`data: ${JSON.stringify({ 
          type: 'done', 
          conversationId: conversation._id,
          tokens: data.tokens,
          responseTime: data.responseTime
        })}\n\n`);
        res.end();
      });

      streamEmitter.on('error', (error) => {
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
      });

    } else {
      // Non-streaming response
      const result = await llmService.chat(conversation._id.toString(), message);

      if (result.success) {
        // Save messages
        await conversation.addMessage('user', message);
        await conversation.addMessage('assistant', result.message, {
          tokens: result.tokens,
          responseTime: result.responseTime
        });

        res.json({
          success: true,
          conversationId: conversation._id,
          message: result.message,
          tokens: result.tokens,
          responseTime: result.responseTime
        });
      } else {
        res.status(500).json(result);
      }
    }

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/llm/refine
 * Refine a prompt
 */
router.post('/refine', async (req, res) => {
  try {
    const { prompt, feedback } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const result = await llmService.refinePrompt(prompt, feedback);
    res.json(result);

  } catch (error) {
    console.error('Refine error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/llm/suggest
 * Get creative suggestions
 */
router.post('/suggest', async (req, res) => {
  try {
    const { prompt, count = 5 } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const result = await llmService.getSuggestions(prompt, count);
    res.json(result);

  } catch (error) {
    console.error('Suggest error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/llm/explain
 * Explain an artistic concept
 */
router.post('/explain', async (req, res) => {
  try {
    const { concept } = req.body;

    if (!concept) {
      return res.status(400).json({
        success: false,
        error: 'Concept is required'
      });
    }

    const result = await llmService.explainConcept(concept);
    res.json(result);

  } catch (error) {
    console.error('Explain error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/llm/variations
 * Generate prompt variations
 */
router.post('/variations', async (req, res) => {
  try {
    const { prompt, count = 3 } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const result = await llmService.generateVariations(prompt, count);
    res.json(result);

  } catch (error) {
    console.error('Variations error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/llm/conversation/:id
 * Get a conversation
 */
router.get('/conversation/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      conversation
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/llm/conversations
 * Get all conversations
 */
router.get('/conversations', async (req, res) => {
  try {
    const { limit = 20, status = 'active' } = req.query;

    const conversations = await Conversation.find({ status })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      conversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/llm/conversation/:id
 * Delete a conversation
 */
router.delete('/conversation/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndDelete(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      message: 'Conversation deleted'
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/llm/conversation/:id/status
 * Update conversation status
 */
router.put('/conversation/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'completed', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      conversation
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
