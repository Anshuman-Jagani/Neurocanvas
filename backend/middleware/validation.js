const Joi = require('joi');

/**
 * Input validation schemas using Joi
 */

// NLP validation schemas
const nlpSchemas = {
  analyzePrompt: Joi.object({
    prompt: Joi.string().min(1).max(2000).required()
  }),
  
  enhancePrompt: Joi.object({
    prompt: Joi.string().min(1).max(2000).required(),
    style: Joi.string().optional()
  }),
  
  extractKeywords: Joi.object({
    prompt: Joi.string().min(1).max(2000).required()
  })
};

// Diffusion validation schemas
const diffusionSchemas = {
  generateImage: Joi.object({
    prompt: Joi.string().min(1).max(2000).required(),
    negative_prompt: Joi.string().max(2000).optional(),
    num_inference_steps: Joi.number().integer().min(1).max(150).default(50),
    guidance_scale: Joi.number().min(1).max(20).default(7.5),
    width: Joi.number().integer().valid(256, 512, 768, 1024).default(512),
    height: Joi.number().integer().valid(256, 512, 768, 1024).default(512),
    seed: Joi.number().integer().optional()
  })
};

// Style transfer validation schemas
const styleTransferSchemas = {
  transfer: Joi.object({
    style: Joi.string().valid(
      'vangogh', 'monet', 'picasso', 'kandinsky', 
      'munch', 'cezanne', 'ukiyoe', 'abstract'
    ).required(),
    num_steps: Joi.number().integer().min(50).max(500).default(300),
    style_weight: Joi.number().min(1).max(1000000).default(100000),
    content_weight: Joi.number().min(1).max(10).default(1)
  })
};

// LLM validation schemas
const llmSchemas = {
  chat: Joi.object({
    message: Joi.string().min(1).max(2000).required(),
    conversationId: Joi.string().optional(),
    temperature: Joi.number().min(0).max(2).default(0.7),
    max_tokens: Joi.number().integer().min(1).max(2048).default(512)
  }),
  
  refinePrompt: Joi.object({
    prompt: Joi.string().min(1).max(2000).required(),
    feedback: Joi.string().min(1).max(1000).required()
  })
};

// Feedback validation schemas
const feedbackSchemas = {
  rate: Joi.object({
    imageId: Joi.string().required(),
    userId: Joi.string().required(),
    rating: Joi.number().integer().min(1).max(5).required()
  }),
  
  like: Joi.object({
    imageId: Joi.string().required(),
    userId: Joi.string().required()
  }),
  
  favorite: Joi.object({
    imageId: Joi.string().required(),
    userId: Joi.string().required()
  })
};

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

module.exports = {
  validate,
  nlpSchemas,
  diffusionSchemas,
  styleTransferSchemas,
  llmSchemas,
  feedbackSchemas
};
