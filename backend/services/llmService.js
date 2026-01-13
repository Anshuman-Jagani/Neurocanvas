const { spawn } = require('child_process');
const path = require('path');
const EventEmitter = require('events');

class LLMService extends EventEmitter {
  constructor() {
    super();
    this.pythonPath = 'python3';
    this.scriptPath = path.join(__dirname, '../../ml/llm');
    this.activeProcesses = new Map();
  }

  /**
   * Chat with the art director
   */
  async chat(conversationId, message, options = {}) {
    const {
      stream = false,
      temperature = 0.7,
      maxTokens = 512
    } = options;

    try {
      const result = await this._executePython('chat', {
        conversation_id: conversationId,
        message,
        temperature,
        max_tokens: maxTokens,
        stream
      });

      return {
        success: true,
        conversationId,
        message: result.response,
        tokens: result.tokens,
        responseTime: result.response_time
      };

    } catch (error) {
      console.error('❌ Chat error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stream chat response
   */
  streamChat(conversationId, message, options = {}) {
    const emitter = new EventEmitter();
    
    const {
      temperature = 0.7,
      maxTokens = 512
    } = options;

    // Execute Python script with streaming
    const python = spawn(this.pythonPath, [
      path.join(this.scriptPath, 'stream_chat.py'),
      '--conversation-id', conversationId,
      '--message', message,
      '--temperature', temperature.toString(),
      '--max-tokens', maxTokens.toString()
    ]);

    let buffer = '';

    python.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'token') {
              emitter.emit('token', parsed.content);
            } else if (parsed.type === 'done') {
              emitter.emit('done', parsed.data);
            } else if (parsed.type === 'error') {
              emitter.emit('error', new Error(parsed.message));
            }
          } catch (e) {
            // Not JSON, emit as token
            emitter.emit('token', line);
          }
        }
      }
    });

    python.stderr.on('data', (data) => {
      console.error('Python stderr:', data.toString());
    });

    python.on('close', (code) => {
      if (code !== 0) {
        emitter.emit('error', new Error(`Python process exited with code ${code}`));
      }
    });

    return emitter;
  }

  /**
   * Refine a prompt
   */
  async refinePrompt(prompt, feedback = null) {
    try {
      const result = await this._executePython('refine', {
        prompt,
        feedback
      });

      return {
        success: true,
        refined: result.refined_prompt,
        explanation: result.explanation,
        alternatives: result.alternatives || []
      };

    } catch (error) {
      console.error('❌ Refine error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get creative suggestions
   */
  async getSuggestions(prompt, count = 5) {
    try {
      const result = await this._executePython('suggest', {
        prompt,
        count
      });

      return {
        success: true,
        suggestions: result.suggestions || []
      };

    } catch (error) {
      console.error('❌ Suggestions error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Explain an artistic concept
   */
  async explainConcept(concept) {
    try {
      const result = await this._executePython('explain', {
        concept
      });

      return {
        success: true,
        explanation: result.explanation
      };

    } catch (error) {
      console.error('❌ Explain error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate prompt variations
   */
  async generateVariations(prompt, count = 3) {
    try {
      const result = await this._executePython('variations', {
        prompt,
        count
      });

      return {
        success: true,
        variations: result.variations || []
      };

    } catch (error) {
      console.error('❌ Variations error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute Python script
   */
  _executePython(action, params) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const python = spawn(this.pythonPath, [
        path.join(this.scriptPath, 'llm_api.py'),
        '--action', action,
        '--params', JSON.stringify(params)
      ]);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        const responseTime = Date.now() - startTime;

        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            result.response_time = responseTime;
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse Python output: ${error.message}`));
          }
        } else {
          reject(new Error(`Python process failed (code ${code}): ${stderr}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }
}

module.exports = new LLMService();
