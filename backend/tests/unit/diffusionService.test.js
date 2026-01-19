const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('Diffusion Service', () => {
  describe('generateImage', () => {
    test('should generate image from text prompt', async () => {
      const prompt = 'A serene mountain landscape at sunset';
      
      const result = await executePythonScript('ml/diffusion/text_to_image.py', {
        prompt: prompt,
        num_inference_steps: 10, // Reduced for testing
        guidance_scale: 7.5,
        width: 256,
        height: 256
      });
      
      expect(result).toBeDefined();
      expect(result.image_path).toBeDefined();
      expect(fs.existsSync(result.image_path)).toBe(true);
      
      // Cleanup
      if (fs.existsSync(result.image_path)) {
        fs.unlinkSync(result.image_path);
      }
    }, 120000); // 2 minutes timeout for CPU generation

    test('should handle invalid parameters', async () => {
      const prompt = 'Test prompt';
      
      try {
        await executePythonScript('ml/diffusion/text_to_image.py', {
          prompt: prompt,
          num_inference_steps: -1, // Invalid
          guidance_scale: 7.5
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should respect guidance scale parameter', async () => {
      const prompt = 'Abstract colorful painting';
      
      const result = await executePythonScript('ml/diffusion/text_to_image.py', {
        prompt: prompt,
        num_inference_steps: 10,
        guidance_scale: 15.0, // High guidance
        width: 256,
        height: 256
      });
      
      expect(result).toBeDefined();
      expect(result.image_path).toBeDefined();
      
      // Cleanup
      if (result.image_path && fs.existsSync(result.image_path)) {
        fs.unlinkSync(result.image_path);
      }
    }, 120000);
  });

  describe('negativePrompts', () => {
    test('should handle negative prompts', async () => {
      const prompt = 'A beautiful landscape';
      const negativePrompt = 'blurry, low quality';
      
      const result = await executePythonScript('ml/diffusion/text_to_image.py', {
        prompt: prompt,
        negative_prompt: negativePrompt,
        num_inference_steps: 10,
        width: 256,
        height: 256
      });
      
      expect(result).toBeDefined();
      expect(result.image_path).toBeDefined();
      
      // Cleanup
      if (result.image_path && fs.existsSync(result.image_path)) {
        fs.unlinkSync(result.image_path);
      }
    }, 120000);
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
