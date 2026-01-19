const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Generation = require('../models/Generation');

// In-memory job queue
const jobQueue = new Map();

class DiffusionService {
  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || path.join(__dirname, '../../ml/venv/bin/python3');
    this.scriptPath = path.join(__dirname, '../../ml/diffusion/stable_diffusion.py');
    this.generatedDir = process.env.GENERATED_DIR || path.join(__dirname, '../../data/generated');
    
    // Ensure generated directory exists
    if (!fs.existsSync(this.generatedDir)) {
      fs.mkdirSync(this.generatedDir, { recursive: true });
    }
  }

  /**
   * Create a new diffusion generation job
   */
  async createJob(userId, prompt, parameters = {}) {
    const jobId = this.generateJobId();
    const outputPath = path.join(this.generatedDir, `${jobId}.png`);

    // Validate prompt
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt is required');
    }

    // Truncate very long prompts
    const maxPromptLength = 500;
    const truncatedPrompt = prompt.length > maxPromptLength 
      ? prompt.substring(0, maxPromptLength) 
      : prompt;

    // Create generation record in database
    const generation = new Generation({
      userId: userId,
      prompt: truncatedPrompt,
      model: 'diffusion',
      parameters: {
        negativePrompt: parameters.negativePrompt || '',
        steps: Math.min(Math.max(parameters.steps || 25, 10), 50),
        guidanceScale: Math.min(Math.max(parameters.guidanceScale || 7.5, 1), 20),
        width: parameters.width || 512,
        height: parameters.height || 512,
        seed: parameters.seed || null
      },
      imagePath: outputPath,
      status: 'pending'
    });

    await generation.save();

    // Add to job queue
    jobQueue.set(jobId, {
      id: jobId,
      generationId: generation._id,
      status: 'pending',
      progress: 0,
      prompt: truncatedPrompt,
      outputPath,
      parameters: generation.parameters,
      createdAt: new Date()
    });

    // Start processing
    this.processJob(jobId);

    return { jobId, generationId: generation._id };
  }

  /**
   * Process a diffusion generation job
   */
  async processJob(jobId) {
    const job = jobQueue.get(jobId);
    if (!job) {
      console.error(`Job ${jobId} not found`);
      return;
    }

    job.status = 'processing';
    job.startTime = new Date();

    // Update database status
    await Generation.findByIdAndUpdate(job.generationId, { status: 'processing' });

    const args = [
      this.scriptPath,
      '--prompt', job.prompt,
      '--output', job.outputPath,
      '--steps', job.parameters.steps,
      '--guidance-scale', job.parameters.guidanceScale,
      '--width', job.parameters.width,
      '--height', job.parameters.height
    ];

    // Add optional parameters
    if (job.parameters.negativePrompt) {
      args.push('--negative-prompt', job.parameters.negativePrompt);
    }

    if (job.parameters.seed !== null && job.parameters.seed !== undefined) {
      args.push('--seed', job.parameters.seed);
    }

    console.log(`Starting diffusion job ${jobId}`);
    console.log(`Prompt: "${job.prompt}"`);
    console.log(`Command: ${this.pythonPath} ${args.join(' ')}`);

    const pythonProcess = spawn(this.pythonPath, args);

    let outputBuffer = '';
    let errorBuffer = '';

    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      outputBuffer += output;
      
      // Parse progress from output
      const progressMatch = output.match(/Progress: (\d+)%/);
      if (progressMatch) {
        job.progress = parseInt(progressMatch[1]);
      }
      
      // Parse step information
      const stepMatch = output.match(/Step (\d+)\/(\d+)/);
      if (stepMatch) {
        const currentStep = parseInt(stepMatch[1]);
        const totalSteps = parseInt(stepMatch[2]);
        job.progress = Math.floor((currentStep / totalSteps) * 100);
      }
      
      console.log(`Job ${jobId}: ${output.trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      errorBuffer += data.toString();
      console.error(`Job ${jobId} error: ${data.toString()}`);
    });

    pythonProcess.on('close', async (code) => {
      const endTime = new Date();
      const generationTime = (endTime - job.startTime) / 1000; // in seconds

      if (code === 0) {
        job.status = 'completed';
        job.progress = 100;
        job.completedAt = endTime;

        // Update database
        await Generation.findByIdAndUpdate(job.generationId, {
          status: 'completed',
          'metadata.generationTime': generationTime,
          'metadata.fileSize': fs.existsSync(job.outputPath) ? fs.statSync(job.outputPath).size : 0
        });

        console.log(`Job ${jobId} completed successfully in ${generationTime}s`);
      } else {
        job.status = 'failed';
        job.error = errorBuffer || 'Diffusion generation failed';

        // Update database
        await Generation.findByIdAndUpdate(job.generationId, {
          status: 'failed'
        });

        console.error(`Job ${jobId} failed with code ${code}`);
      }
    });
  }

  /**
   * Get job status
   */
  getJobStatus(jobId) {
    const job = jobQueue.get(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      status: job.status,
      progress: job.progress,
      outputPath: job.status === 'completed' ? `/generated/${path.basename(job.outputPath)}` : null,
      error: job.error || null,
      estimatedTimeRemaining: this.estimateTimeRemaining(job)
    };
  }

  /**
   * Estimate remaining time based on progress
   */
  estimateTimeRemaining(job) {
    if (job.status !== 'processing' || !job.startTime || job.progress === 0) {
      return null;
    }

    const elapsed = (new Date() - job.startTime) / 1000; // seconds
    const estimatedTotal = (elapsed / job.progress) * 100;
    const remaining = Math.max(0, estimatedTotal - elapsed);

    return Math.round(remaining);
  }

  /**
   * Get user's generation history
   */
  async getHistory(userId, limit = 20, skip = 0) {
    const generations = await Generation.find({ 
      userId: userId,
      model: 'diffusion'
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-__v');

    return generations.map(gen => ({
      id: gen._id,
      prompt: gen.prompt,
      status: gen.status,
      imagePath: gen.status === 'completed' ? `/generated/${path.basename(gen.imagePath)}` : null,
      createdAt: gen.createdAt,
      generationTime: gen.metadata?.generationTime,
      parameters: gen.parameters
    }));
  }

  /**
   * Get prompt presets
   */
  getPresets() {
    const presetsPath = path.join(__dirname, '../../data/prompts/presets.json');
    
    if (fs.existsSync(presetsPath)) {
      try {
        const data = fs.readFileSync(presetsPath, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        console.error('Error reading presets:', error);
      }
    }

    // Default presets if file doesn't exist
    return {
      categories: [
        {
          name: 'Realistic',
          prompts: [
            'Professional photo of a coffee cup on wooden table, natural lighting',
            'Portrait of a person in golden hour light, shallow depth of field',
            'Modern architecture building, blue sky, professional photography'
          ]
        },
        {
          name: 'Artistic',
          prompts: [
            'Abstract watercolor painting of city skyline at sunset',
            'Oil painting of mountain landscape in impressionist style',
            'Digital art of futuristic cityscape with neon lights'
          ]
        },
        {
          name: 'Fantasy',
          prompts: [
            'Dragon flying over medieval castle, epic fantasy art',
            'Magical forest with glowing mushrooms and fairy lights',
            'Ancient wizard tower on floating island in the clouds'
          ]
        }
      ]
    };
  }

  /**
   * Generate unique job ID
   */
  generateJobId() {
    return `diff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old jobs from memory (keep last 100)
   */
  cleanupOldJobs() {
    if (jobQueue.size > 100) {
      const sortedJobs = Array.from(jobQueue.entries())
        .sort((a, b) => b[1].createdAt - a[1].createdAt);
      
      const toDelete = sortedJobs.slice(100);
      toDelete.forEach(([jobId]) => jobQueue.delete(jobId));
      
      console.log(`Cleaned up ${toDelete.length} old diffusion jobs from memory`);
    }
  }
}

module.exports = new DiffusionService();
