const request = require('supertest');
const path = require('path');

// Note: This will require the server to be running or we need to import the app
// For now, we'll test against localhost
const BASE_URL = process.env.API_URL || 'http://localhost:5000';

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    test('GET /api/health should return 200', async () => {
      const response = await request(BASE_URL)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.status).toBe('ok');
    });
  });

  describe('NLP Endpoints', () => {
    test('POST /api/nlp/analyze should analyze prompt', async () => {
      const response = await request(BASE_URL)
        .post('/api/nlp/analyze')
        .send({ prompt: 'A beautiful sunset over mountains' })
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toBeDefined();
      expect(response.body.sentiment).toBeDefined();
      expect(response.body.keywords).toBeDefined();
    });

    test('POST /api/nlp/enhance should enhance prompt', async () => {
      const response = await request(BASE_URL)
        .post('/api/nlp/enhance')
        .send({ prompt: 'A cat' })
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.enhanced_prompt).toBeDefined();
      expect(response.body.enhanced_prompt.length).toBeGreaterThan(5);
    });

    test('GET /api/nlp/presets should return presets', async () => {
      const response = await request(BASE_URL)
        .get('/api/nlp/presets')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /api/nlp/analyze with empty prompt should return 400', async () => {
      await request(BASE_URL)
        .post('/api/nlp/analyze')
        .send({ prompt: '' })
        .expect(400);
    });
  });

  describe('Diffusion Endpoints', () => {
    test('POST /api/diffusion/generate should generate image', async () => {
      const response = await request(BASE_URL)
        .post('/api/diffusion/generate')
        .send({
          prompt: 'A test image',
          num_inference_steps: 10,
          width: 256,
          height: 256
        })
        .timeout(120000) // 2 minutes
        .expect('Content-Type', /json/);
      
      // May return 200 or 202 depending on implementation
      expect([200, 202]).toContain(response.status);
    }, 120000);

    test('GET /api/diffusion/presets should return presets', async () => {
      const response = await request(BASE_URL)
        .get('/api/diffusion/presets')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toBeDefined();
    });
  });

  describe('Style Transfer Endpoints', () => {
    test('POST /api/style-transfer/transfer should require image', async () => {
      await request(BASE_URL)
        .post('/api/style-transfer/transfer')
        .send({ style: 'vangogh' })
        .expect(400);
    });

    test('GET /api/style-transfer/styles should return available styles', async () => {
      const response = await request(BASE_URL)
        .get('/api/style-transfer/styles')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('LLM Endpoints', () => {
    test('POST /api/llm/chat should handle chat message', async () => {
      const response = await request(BASE_URL)
        .post('/api/llm/chat')
        .send({
          message: 'Help me create a prompt for a landscape',
          conversationId: 'test-conversation'
        })
        .timeout(60000)
        .expect('Content-Type', /json/);
      
      expect([200, 202]).toContain(response.status);
    }, 60000);

    test('POST /api/llm/refine should refine prompt', async () => {
      const response = await request(BASE_URL)
        .post('/api/llm/refine')
        .send({
          prompt: 'A cat',
          feedback: 'Make it more detailed'
        })
        .timeout(60000)
        .expect('Content-Type', /json/);
      
      expect([200, 202]).toContain(response.status);
    }, 60000);
  });

  describe('Feedback Endpoints', () => {
    test('POST /api/feedback/rate should accept rating', async () => {
      const response = await request(BASE_URL)
        .post('/api/feedback/rate')
        .send({
          imageId: 'test-image-id',
          rating: 5,
          userId: 'test-user'
        })
        .expect('Content-Type', /json/);
      
      expect([200, 201]).toContain(response.status);
    });

    test('POST /api/feedback/like should toggle like', async () => {
      const response = await request(BASE_URL)
        .post('/api/feedback/like')
        .send({
          imageId: 'test-image-id',
          userId: 'test-user'
        })
        .expect('Content-Type', /json/);
      
      expect([200, 201]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    test('GET /api/nonexistent should return 404', async () => {
      await request(BASE_URL)
        .get('/api/nonexistent')
        .expect(404);
    });

    test('POST with invalid JSON should return 400', async () => {
      await request(BASE_URL)
        .post('/api/nlp/analyze')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });
  });
});
