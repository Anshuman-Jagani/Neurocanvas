const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

/**
 * Generation Queue System
 * Manages generation jobs with priority queue and sequential processing
 */
class GenerationQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = []; // Array of jobs
    this.processing = false;
    this.currentJob = null;
    this.completedJobs = new Map(); // jobId -> result
    this.maxCompletedJobs = 100; // Keep last 100 completed jobs
  }

  /**
   * Add a job to the queue
   * @param {String} userId - User ID
   * @param {String} prompt - Generation prompt
   * @param {Array} models - Models to use
   * @param {Number} priority - Priority (higher = more important)
   * @param {Object} params - Additional parameters
   * @returns {String} - Job ID
   */
  addJob(userId, prompt, models, priority = 0, params = {}) {
    const jobId = uuidv4();
    
    const job = {
      id: jobId,
      userId,
      prompt,
      models,
      priority,
      params,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      result: null,
      error: null
    };
    
    // Insert job based on priority (higher priority first)
    let inserted = false;
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority < priority) {
        this.queue.splice(i, 0, job);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      this.queue.push(job);
    }
    
    console.log(`📝 Job ${jobId} added to queue (priority: ${priority}, position: ${this.getQueuePosition(jobId)})`);
    
    // Emit event
    this.emit('jobAdded', job);
    
    // Start processing if not already processing
    if (!this.processing) {
      this.processQueue();
    }
    
    return jobId;
  }

  /**
   * Process the queue sequentially
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    console.log(`🔄 Starting queue processing (${this.queue.length} jobs)`);
    
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      this.currentJob = job;
      
      try {
        job.status = 'processing';
        job.startedAt = new Date();
        this.emit('jobStarted', job);
        
        console.log(`⚙️  Processing job ${job.id}`);
        
        // Import orchestrator here to avoid circular dependency
        const modelOrchestrator = require('./modelOrchestrator');
        
        // Update progress
        job.progress = 10;
        this.emit('jobProgress', job);
        
        // Generate with models
        const results = await modelOrchestrator.generateWithModels(
          job.prompt,
          job.models,
          job.params
        );
        
        job.progress = 80;
        this.emit('jobProgress', job);
        
        // Rank results
        const rankedResults = await modelOrchestrator.rankResults(results, job.prompt);
        
        job.progress = 100;
        job.status = 'completed';
        job.completedAt = new Date();
        job.result = rankedResults;
        
        // Store completed job
        this.completedJobs.set(job.id, job);
        this._cleanupCompletedJobs();
        
        console.log(`✅ Job ${job.id} completed`);
        this.emit('jobCompleted', job);
        
      } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error.message);
        
        job.status = 'failed';
        job.error = error.message;
        job.completedAt = new Date();
        
        // Store failed job
        this.completedJobs.set(job.id, job);
        this._cleanupCompletedJobs();
        
        this.emit('jobFailed', job);
      }
      
      this.currentJob = null;
    }
    
    this.processing = false;
    console.log(`✨ Queue processing completed`);
  }

  /**
   * Get job status
   * @param {String} jobId - Job ID
   * @returns {Object|null} - Job status or null if not found
   */
  getJobStatus(jobId) {
    // Check current job
    if (this.currentJob && this.currentJob.id === jobId) {
      return {
        id: this.currentJob.id,
        status: this.currentJob.status,
        progress: this.currentJob.progress,
        queuePosition: 0,
        createdAt: this.currentJob.createdAt,
        startedAt: this.currentJob.startedAt
      };
    }
    
    // Check queue
    const queueIndex = this.queue.findIndex(job => job.id === jobId);
    if (queueIndex !== -1) {
      const job = this.queue[queueIndex];
      return {
        id: job.id,
        status: job.status,
        progress: job.progress,
        queuePosition: queueIndex + 1,
        createdAt: job.createdAt
      };
    }
    
    // Check completed jobs
    const completedJob = this.completedJobs.get(jobId);
    if (completedJob) {
      return {
        id: completedJob.id,
        status: completedJob.status,
        progress: completedJob.progress,
        createdAt: completedJob.createdAt,
        startedAt: completedJob.startedAt,
        completedAt: completedJob.completedAt,
        error: completedJob.error
      };
    }
    
    return null;
  }

  /**
   * Get job result
   * @param {String} jobId - Job ID
   * @returns {Object|null} - Job result or null if not found/completed
   */
  getJobResult(jobId) {
    const completedJob = this.completedJobs.get(jobId);
    
    if (!completedJob) {
      return null;
    }
    
    return {
      id: completedJob.id,
      status: completedJob.status,
      prompt: completedJob.prompt,
      models: completedJob.models,
      result: completedJob.result,
      error: completedJob.error,
      createdAt: completedJob.createdAt,
      completedAt: completedJob.completedAt,
      duration: completedJob.completedAt - completedJob.startedAt
    };
  }

  /**
   * Cancel a job
   * @param {String} jobId - Job ID
   * @returns {Boolean} - True if cancelled, false if not found or already processing
   */
  cancelJob(jobId) {
    // Can't cancel current job
    if (this.currentJob && this.currentJob.id === jobId) {
      console.log(`⚠️  Cannot cancel job ${jobId} - already processing`);
      return false;
    }
    
    // Find and remove from queue
    const queueIndex = this.queue.findIndex(job => job.id === jobId);
    if (queueIndex !== -1) {
      const job = this.queue.splice(queueIndex, 1)[0];
      job.status = 'cancelled';
      job.completedAt = new Date();
      
      this.completedJobs.set(job.id, job);
      this._cleanupCompletedJobs();
      
      console.log(`🚫 Job ${jobId} cancelled`);
      this.emit('jobCancelled', job);
      
      return true;
    }
    
    return false;
  }

  /**
   * Get queue position for a job
   * @param {String} jobId - Job ID
   * @returns {Number} - Position in queue (0 if processing, -1 if not found)
   */
  getQueuePosition(jobId) {
    if (this.currentJob && this.currentJob.id === jobId) {
      return 0;
    }
    
    const index = this.queue.findIndex(job => job.id === jobId);
    return index === -1 ? -1 : index + 1;
  }

  /**
   * Get queue statistics
   * @returns {Object} - Queue stats
   */
  getQueueStats() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      currentJob: this.currentJob ? {
        id: this.currentJob.id,
        status: this.currentJob.status,
        progress: this.currentJob.progress
      } : null,
      completedJobsCount: this.completedJobs.size
    };
  }

  /**
   * Get all jobs for a user
   * @param {String} userId - User ID
   * @param {Number} limit - Maximum number of jobs to return
   * @returns {Array} - Array of jobs
   */
  getUserJobs(userId, limit = 20) {
    const jobs = [];
    
    // Add current job if it belongs to user
    if (this.currentJob && this.currentJob.userId === userId) {
      jobs.push({
        id: this.currentJob.id,
        prompt: this.currentJob.prompt,
        models: this.currentJob.models,
        status: this.currentJob.status,
        progress: this.currentJob.progress,
        createdAt: this.currentJob.createdAt,
        startedAt: this.currentJob.startedAt
      });
    }
    
    // Add queued jobs
    this.queue
      .filter(job => job.userId === userId)
      .forEach(job => {
        jobs.push({
          id: job.id,
          prompt: job.prompt,
          models: job.models,
          status: job.status,
          progress: job.progress,
          createdAt: job.createdAt,
          queuePosition: this.getQueuePosition(job.id)
        });
      });
    
    // Add completed jobs
    for (const [jobId, job] of this.completedJobs.entries()) {
      if (job.userId === userId) {
        jobs.push({
          id: job.id,
          prompt: job.prompt,
          models: job.models,
          status: job.status,
          createdAt: job.createdAt,
          completedAt: job.completedAt,
          hasResult: job.status === 'completed'
        });
      }
    }
    
    // Sort by creation date (newest first)
    jobs.sort((a, b) => b.createdAt - a.createdAt);
    
    return jobs.slice(0, limit);
  }

  /**
   * Clean up old completed jobs to prevent memory leak
   * @private
   */
  _cleanupCompletedJobs() {
    if (this.completedJobs.size > this.maxCompletedJobs) {
      // Convert to array and sort by completion time
      const jobs = Array.from(this.completedJobs.entries())
        .sort((a, b) => a[1].completedAt - b[1].completedAt);
      
      // Remove oldest jobs
      const toRemove = jobs.slice(0, jobs.length - this.maxCompletedJobs);
      toRemove.forEach(([jobId]) => {
        this.completedJobs.delete(jobId);
      });
      
      console.log(`🧹 Cleaned up ${toRemove.length} old jobs`);
    }
  }
}

// Export singleton instance
module.exports = new GenerationQueue();
