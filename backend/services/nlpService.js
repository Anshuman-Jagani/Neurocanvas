const { spawn } = require('child_process');
const path = require('path');

class NLPService {
  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || path.join(__dirname, '../../ml/venv/bin/python3');
    this.mlDir = path.join(__dirname, '../../ml/nlp');
  }

  /**
   * Execute a Python script and return the result
   * @param {string} scriptName - Name of the Python script
   * @param {object} data - Data to pass to the script
   * @returns {Promise<object>} - Parsed JSON result
   */
  async executePythonScript(scriptName, data) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.mlDir, scriptName);
      const python = spawn(this.pythonPath, [scriptPath]);

      let stdout = '';
      let stderr = '';

      // Send input data to Python script
      if (data) {
        python.stdin.write(JSON.stringify(data));
        python.stdin.end();
      }

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python script error: ${stderr}`);
          reject(new Error(`Script execution failed: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          console.error('Failed to parse Python output:', stdout);
          reject(new Error('Failed to parse script output'));
        }
      });

      // Set timeout for long-running scripts
      setTimeout(() => {
        python.kill();
        reject(new Error('Script execution timeout'));
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Analyze a prompt for sentiment, keywords, and artistic concepts
   * @param {string} prompt - User prompt to analyze
   * @returns {Promise<object>} - Analysis results
   */
  async analyzePrompt(prompt) {
    try {
      const result = await this.executePythonScript('prompt_analyzer.py', {
        prompt: prompt
      });
      return result;
    } catch (error) {
      console.error('Prompt analysis error:', error);
      throw error;
    }
  }

  /**
   * Enhance a prompt with artistic terminology
   * @param {string} prompt - Original prompt
   * @returns {Promise<object>} - Enhanced prompt and suggestions
   */
  async enhancePrompt(prompt) {
    try {
      const result = await this.executePythonScript('prompt_enhancer.py', {
        prompt: prompt
      });
      return result;
    } catch (error) {
      console.error('Prompt enhancement error:', error);
      throw error;
    }
  }

  /**
   * Extract keywords from a prompt
   * @param {string} prompt - Prompt text
   * @returns {Promise<object>} - Extracted keywords
   */
  async extractKeywords(prompt) {
    try {
      const result = await this.executePythonScript('keyword_extractor.py', {
        prompt: prompt
      });
      return result;
    } catch (error) {
      console.error('Keyword extraction error:', error);
      throw error;
    }
  }

  /**
   * Analyze sentiment of a prompt
   * @param {string} prompt - Prompt text
   * @returns {Promise<object>} - Sentiment analysis
   */
  async analyzeSentiment(prompt) {
    try {
      const result = await this.executePythonScript('sentiment_analyzer.py', {
        prompt: prompt
      });
      return result;
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      throw error;
    }
  }

  /**
   * Get predefined prompt templates
   * @returns {object} - Prompt presets by category
   */
  getPromptPresets() {
    // This will be loaded from a JSON file
    const presets = {
      landscape: [
        "A serene mountain landscape at golden hour with misty valleys",
        "Dramatic coastal cliffs under stormy skies with crashing waves",
        "Peaceful forest path with dappled sunlight filtering through trees"
      ],
      portrait: [
        "Ethereal portrait with soft lighting and dreamy atmosphere",
        "Bold and dramatic portrait with high contrast shadows",
        "Whimsical character portrait with vibrant colors and playful expression"
      ],
      abstract: [
        "Flowing abstract composition with vibrant gradients and organic shapes",
        "Geometric abstract with bold colors and sharp contrasts",
        "Minimalist abstract with subtle textures and muted tones"
      ],
      fantasy: [
        "Magical fantasy realm with floating islands and glowing crystals",
        "Mystical forest with bioluminescent plants and ethereal creatures",
        "Ancient fantasy castle perched on a cliff under aurora skies"
      ],
      scifi: [
        "Futuristic cityscape with neon lights and flying vehicles",
        "Alien planet landscape with multiple moons and strange flora",
        "Cyberpunk street scene with holographic advertisements and rain"
      ]
    };

    return presets;
  }
}

module.exports = new NLPService();
