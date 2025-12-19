const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Generation = require('../models/Generation');

// In-memory job queue
const jobQueue = new Map();

class StyleTransferService {
  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.scriptPath = path.join(__dirname, '../../ml/style_transfer/neural_style_transfer.py');
    this.generatedDir = process.env.GENERATED_DIR || path.join(__dirname, '../../data/generated');
    
    // Ensure generated directory exists
    if (!fs.existsSync(this.generatedDir)) {
      fs.mkdirSync(this.generatedDir, { recursive: true });
    }
  }

  /**
   * Create a new style transfer job
   */
  async createJob(userId, contentImagePath, styleImagePath, parameters = {}) {
    const jobId = this.generateJobId();
    const outputPath = path.join(this.generatedDir, `${jobId}.png`);

    // Create generation record in database
    const generation = new Generation({
      user: userId,
      prompt: `Style: ${path.basename(styleImagePath)}`,
      model: 'style_transfer',
      style: path.basename(styleImagePath, path.extname(styleImagePath)),
      parameters: {
        iterations: parameters.iterations || 300,
        contentWeight: parameters.contentWeight || 1,
        styleWeight: parameters.styleWeight || 1000000,
        imageSize: parameters.imageSize || 512
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
      contentImagePath,
      styleImagePath,
      outputPath,
      parameters,
      createdAt: new Date()
    });

    // Start processing
    this.processJob(jobId);

    return { jobId, generationId: generation._id };
  }

  /**
   * Process a style transfer job
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
      '--content', job.contentImagePath,
      '--style', job.styleImagePath,
      '--output', job.outputPath,
      '--iterations', job.parameters.iterations || 300,
      '--content-weight', job.parameters.contentWeight || 1,
      '--style-weight', job.parameters.styleWeight || 1000000,
      '--size', job.parameters.imageSize || 512
    ];

    console.log(`Starting style transfer job ${jobId}`);
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

        // Clean up uploaded content image after successful processing
        if (fs.existsSync(job.contentImagePath)) {
          fs.unlinkSync(job.contentImagePath);
        }
      } else {
        job.status = 'failed';
        job.error = errorBuffer || 'Style transfer failed';

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
      error: job.error || null
    };
  }

  /**
   * Get user's generation history
   */
  async getHistory(userId, limit = 20, skip = 0) {
    const generations = await Generation.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-__v');

    return generations.map(gen => ({
      id: gen._id,
      style: gen.style,
      status: gen.status,
      imagePath: gen.status === 'completed' ? `/generated/${path.basename(gen.imagePath)}` : null,
      createdAt: gen.createdAt,
      generationTime: gen.metadata?.generationTime
    }));
  }

  /**
   * Generate unique job ID
   */
  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old jobs from memory (keep last 100)
   */
  cleanupOldJobs() {
    if (jobQueue.size > 100) {
      const sortedJobs = Array.from(jobQueue.entries())
        .sort((a, b) => b[1].createdAt - a[1].createdAt);
      
      // Keep only the 100 most recent jobs
      const toDelete = sortedJobs.slice(100);
      toDelete.forEach(([jobId]) => jobQueue.delete(jobId));
      
      console.log(`Cleaned up ${toDelete.length} old jobs from memory`);
    }
  }
}

module.exports = new StyleTransferService();
