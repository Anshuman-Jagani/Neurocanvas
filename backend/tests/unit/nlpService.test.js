const { spawn } = require('child_process');
const path = require('path');

describe('NLP Service', () => {
  describe('analyzePrompt', () => {
    test('should analyze a simple prompt', async () => {
      const prompt = 'A beautiful sunset over mountains';
      
      // Mock Python script execution
      const result = await executePythonScript('ml/nlp/prompt_analyzer.py', {
        text: prompt,
        action: 'analyze'
      });
      
      expect(result).toBeDefined();
      expect(result.sentiment).toBeDefined();
      expect(result.keywords).toBeDefined();
      expect(result.artistic_concepts).toBeDefined();
    }, 30000);

    test('should handle empty prompt', async () => {
      const prompt = '';
      
      try {
        await executePythonScript('ml/nlp/prompt_analyzer.py', {
          text: prompt,
          action: 'analyze'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should extract keywords from prompt', async () => {
      const prompt = 'Vibrant abstract painting with warm colors';
      
      const result = await executePythonScript('ml/nlp/keyword_extractor.py', {
        text: prompt
      });
      
      expect(result.keywords).toBeDefined();
      expect(Array.isArray(result.keywords)).toBe(true);
      expect(result.keywords.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('enhancePrompt', () => {
    test('should enhance a basic prompt', async () => {
      const prompt = 'A cat';
      
      const result = await executePythonScript('ml/nlp/prompt_enhancer.py', {
        text: prompt,
        action: 'enhance'
      });
      
      expect(result.enhanced_prompt).toBeDefined();
      expect(result.enhanced_prompt.length).toBeGreaterThan(prompt.length);
    }, 30000);

    test('should preserve original intent when enhancing', async () => {
      const prompt = 'A peaceful forest scene';
      
      const result = await executePythonScript('ml/nlp/prompt_enhancer.py', {
        text: prompt,
        action: 'enhance'
      });
      
      expect(result.enhanced_prompt).toContain('forest');
      expect(result.enhanced_prompt).toContain('peaceful');
    }, 30000);
  });

  describe('sentimentAnalysis', () => {
    test('should detect positive sentiment', async () => {
      const prompt = 'Beautiful happy joyful wonderful scene';
      
      const result = await executePythonScript('ml/nlp/sentiment_analyzer.py', {
        text: prompt
      });
      
      expect(result.sentiment).toBe('positive');
      expect(result.confidence).toBeGreaterThan(0.5);
    }, 30000);

    test('should detect negative sentiment', async () => {
      const prompt = 'Dark gloomy sad depressing atmosphere';
      
      const result = await executePythonScript('ml/nlp/sentiment_analyzer.py', {
        text: prompt
      });
      
      expect(result.sentiment).toBe('negative');
    }, 30000);
  });
});

// Helper function to execute Python scripts
function executePythonScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || 'python3';
    const fullPath = path.join(__dirname, '../../..', scriptPath);
    
    const python = spawn(pythonPath, [fullPath, JSON.stringify(args)]);
    
    let dataString = '';
    let errorString = '';
    
    python.stdout.on('data', (data) => {
      dataString += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      errorString += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed: ${errorString}`));
      } else {
        try {
          const result = JSON.parse(dataString);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${dataString}`));
        }
      }
    });
  });
}
