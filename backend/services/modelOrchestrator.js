const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * Model Orchestrator Service
 * Intelligently selects and orchestrates multiple AI models based on prompt analysis
 */
class ModelOrchestrator {
  constructor() {
    this.modelStats = {
      'style-transfer': { totalRuns: 0, avgScore: 0, avgTime: 0 },
      'diffusion': { totalRuns: 0, avgScore: 0, avgTime: 0 }
    };
  }

  /**
   * Intelligently select models based on prompt analysis
   * @param {Object} promptAnalysis - NLP analysis of the prompt
   * @returns {Array} - Array of recommended model names with confidence scores
   */
  selectModels(promptAnalysis) {
    const recommendations = [];
    
    // Extract relevant features from analysis
    const keywords = promptAnalysis.keywords || {};
    const styles = keywords.styles || [];
    const artisticConcepts = promptAnalysis.artisticConcepts || [];
    const mood = promptAnalysis.mood || '';
    
    // Style Transfer scoring
    let styleTransferScore = 0;
    
    // Check for specific artistic style references
    const styleKeywords = ['van gogh', 'monet', 'picasso', 'kandinsky', 'impressionist', 
                          'cubist', 'surreal', 'abstract expressionism', 'pop art'];
    const hasStyleReference = styles.some(style => 
      styleKeywords.some(keyword => style.toLowerCase().includes(keyword))
    );
    
    if (hasStyleReference) styleTransferScore += 0.4;
    if (styles.length > 0) styleTransferScore += 0.2;
    if (artisticConcepts.includes('abstract')) styleTransferScore += 0.1;
    
    // Diffusion Model scoring
    let diffusionScore = 0;
    
    // Check for detailed descriptions
    const promptLength = promptAnalysis.prompt?.length || 0;
    if (promptLength > 50) diffusionScore += 0.2;
    if (promptLength > 100) diffusionScore += 0.1;
    
    // Check for concepts that work well with diffusion
    const diffusionConcepts = ['portrait', 'landscape', 'fantasy', 'sci-fi', 'character'];
    const hasDiffusionConcept = artisticConcepts.some(concept => 
      diffusionConcepts.includes(concept.toLowerCase())
    );
    
    if (hasDiffusionConcept) diffusionScore += 0.3;
    if (keywords.lighting?.length > 0) diffusionScore += 0.1;
    if (keywords.colors?.length > 0) diffusionScore += 0.1;
    if (keywords.textures?.length > 0) diffusionScore += 0.1;
    
    // Base scores to ensure both models are considered
    styleTransferScore += 0.3;
    diffusionScore += 0.3;
    
    // Normalize scores
    const maxScore = Math.max(styleTransferScore, diffusionScore);
    styleTransferScore = Math.min(styleTransferScore / maxScore, 1.0);
    diffusionScore = Math.min(diffusionScore / maxScore, 1.0);
    
    // Add recommendations if score is above threshold
    if (styleTransferScore >= 0.5) {
      recommendations.push({
        model: 'style-transfer',
        confidence: styleTransferScore,
        reason: hasStyleReference ? 'Specific artistic style detected' : 'Style-based generation recommended'
      });
    }
    
    if (diffusionScore >= 0.5) {
      recommendations.push({
        model: 'diffusion',
        confidence: diffusionScore,
        reason: hasDiffusionConcept ? 'Complex scene generation recommended' : 'Text-to-image generation recommended'
      });
    }
    
    // For now, only recommend diffusion (style transfer needs base image)
    // Always recommend diffusion for text-to-image generation
    recommendations.push({
      model: 'diffusion',
      confidence: 1.0,
      reason: 'Text-to-image generation'
    });
    
    return recommendations;
  }

  /**
   * Execute multiple models in parallel for the same prompt
   * @param {String} prompt - The prompt to generate from
   * @param {Array} models - Array of model names to use
   * @param {Object} params - Generation parameters
   * @returns {Promise<Array>} - Array of results from each model
   */
  async generateWithModels(prompt, models, params = {}) {
    const results = [];
    const startTime = Date.now();
    
    console.log(`🎨 Generating with models: ${models.join(', ')}`);
    
    // Execute each model
    for (const modelName of models) {
      try {
        const modelStartTime = Date.now();
        let result;
        
        if (modelName === 'style-transfer') {
          result = await this._executeStyleTransfer(prompt, params);
        } else if (modelName === 'diffusion') {
          result = await this._executeDiffusion(prompt, params);
        } else {
          throw new Error(`Unknown model: ${modelName}`);
        }
        
        const modelTime = Date.now() - modelStartTime;
        
        results.push({
          model: modelName,
          imageUrl: result.imageUrl,
          score: 0, // Will be set by ranking
          metadata: {
            ...result.metadata,
            generationTime: modelTime
          },
          generatedAt: new Date()
        });
        
        console.log(`✅ ${modelName} completed in ${modelTime}ms`);
        
      } catch (error) {
        console.error(`❌ ${modelName} failed:`, error.message);
        results.push({
          model: modelName,
          error: error.message,
          generatedAt: new Date()
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`🎉 All models completed in ${totalTime}ms`);
    
    return results;
  }

  /**
   * Execute style transfer model
   * @private
   */
  async _executeStyleTransfer(prompt, params) {
    // For style transfer, we need a base image
    // For now, we'll skip this if no base image is provided
    if (!params.baseImage) {
      throw new Error('Style transfer requires a base image');
    }
    
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, '../../ml/style_transfer/style_transfer.py');
      const args = [
        pythonScript,
        '--content', params.baseImage,
        '--style', params.style || 'starry_night',
        '--output', params.outputPath || path.join(__dirname, '../../data/generated')
      ];
      
      const python = spawn('python3', args);
      let output = '';
      let error = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(error || 'Style transfer failed'));
        } else {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            reject(new Error('Failed to parse style transfer output'));
          }
        }
      });
    });
  }

  /**
   * Execute diffusion model
   * @private
   */
  async _executeDiffusion(prompt, params) {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, '../../ml/multi_model_generator.py');
      
      // Use virtual environment Python if available
      const venvPython = path.join(__dirname, '../../venv/bin/python3');
      const pythonCmd = require('fs').existsSync(venvPython) ? venvPython : 'python3';
      
      // Prepare config for multi_model_generator
      const config = JSON.stringify({
        prompt: prompt,
        models: ['diffusion'],
        params: {
          steps: params.steps || 20,
          guidance: params.guidance || 7.5,
          width: params.width || 512,
          height: params.height || 512,
          outputPath: params.outputPath || path.join(__dirname, '../../data/generated')
        }
      });
      
      const python = spawn(pythonCmd, [pythonScript, config]);
      let output = '';
      let error = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(error || 'Diffusion generation failed'));
        } else {
          try {
            const result = JSON.parse(output);
            // Extract the first (and only) result
            if (result.results && result.results.length > 0) {
              const diffusionResult = result.results[0];
              if (diffusionResult.success) {
                resolve({
                  imageUrl: diffusionResult.imageUrl,
                  metadata: diffusionResult.metadata || {}
                });
              } else {
                reject(new Error(diffusionResult.error || 'Diffusion failed'));
              }
            } else {
              reject(new Error('No results from diffusion'));
            }
          } catch (e) {
            reject(new Error(`Failed to parse diffusion output: ${e.message}`));
          }
        }
      });
    });
  }

  /**
   * Rank and score results
   * @param {Array} results - Array of generation results
   * @param {String} prompt - Original prompt for comparison
   * @returns {Array} - Ranked results with scores
   */
  async rankResults(results, prompt) {
    // Filter out failed results
    const validResults = results.filter(r => !r.error && r.imageUrl);
    
    if (validResults.length === 0) {
      return results;
    }
    
    // For now, use simple heuristics for ranking
    // In the future, we'll use CLIP for semantic similarity
    validResults.forEach((result, index) => {
      let score = 0.5; // Base score
      
      // Prefer faster generation
      const time = result.metadata?.generationTime || 0;
      if (time > 0) {
        score += Math.max(0, (60000 - time) / 60000) * 0.2; // Bonus for speed
      }
      
      // Use model stats
      const modelStat = this.modelStats[result.model];
      if (modelStat && modelStat.avgScore > 0) {
        score += modelStat.avgScore * 0.3;
      }
      
      result.score = Math.min(score, 1.0);
    });
    
    // Sort by score
    validResults.sort((a, b) => b.score - a.score);
    
    return validResults;
  }

  /**
   * Update model performance statistics
   * @param {String} model - Model name
   * @param {Object} performance - Performance metrics
   */
  updateModelStats(model, performance) {
    if (!this.modelStats[model]) {
      this.modelStats[model] = { totalRuns: 0, avgScore: 0, avgTime: 0 };
    }
    
    const stats = this.modelStats[model];
    const n = stats.totalRuns;
    
    // Update running averages
    stats.avgScore = (stats.avgScore * n + performance.score) / (n + 1);
    stats.avgTime = (stats.avgTime * n + performance.time) / (n + 1);
    stats.totalRuns += 1;
    
    console.log(`📊 Updated stats for ${model}:`, stats);
  }

  /**
   * Get model statistics
   * @returns {Object} - Model statistics
   */
  getModelStats() {
    return this.modelStats;
  }
}

module.exports = new ModelOrchestrator();
