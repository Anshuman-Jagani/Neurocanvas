const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('Style Transfer Service', () => {
  const testImagePath = path.join(__dirname, '../../uploads/test_image.jpg');
  
  beforeAll(() => {
    // Ensure test image exists or create a dummy one
    if (!fs.existsSync(path.dirname(testImagePath))) {
      fs.mkdirSync(path.dirname(testImagePath), { recursive: true });
    }
  });

  describe('applyStyleTransfer', () => {
    test('should apply style transfer to image', async () => {
      // Skip if test image doesn't exist
      if (!fs.existsSync(testImagePath)) {
        console.log('Skipping test: test image not found');
        return;
      }

      const result = await executePythonScript('ml/style_transfer/style_transfer.py', {
        content_image: testImagePath,
        style: 'vangogh',
        num_steps: 50 // Reduced for testing
      });
      
      expect(result).toBeDefined();
      expect(result.output_path).toBeDefined();
      
      // Cleanup
      if (result.output_path && fs.existsSync(result.output_path)) {
        fs.unlinkSync(result.output_path);
      }
    }, 180000); // 3 minutes timeout

    test('should handle invalid style', async () => {
      if (!fs.existsSync(testImagePath)) {
        console.log('Skipping test: test image not found');
        return;
      }

      try {
        await executePythonScript('ml/style_transfer/style_transfer.py', {
          content_image: testImagePath,
          style: 'invalid_style',
          num_steps: 50
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle missing content image', async () => {
      try {
        await executePythonScript('ml/style_transfer/style_transfer.py', {
          content_image: '/nonexistent/path.jpg',
          style: 'vangogh',
          num_steps: 50
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('availableStyles', () => {
    test('should return list of available styles', async () => {
      const result = await executePythonScript('ml/style_transfer/style_transfer.py', {
        action: 'list_styles'
      });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result.styles)).toBe(true);
      expect(result.styles.length).toBeGreaterThan(0);
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
