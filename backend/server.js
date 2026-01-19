const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./db/mongoose');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security middleware
const {
  helmetConfig,
  limiter,
  generationLimiter,
  corsOptions,
  sanitizeData,
  preventXSS
} = require('./middleware/security');

// Apply security middleware
app.use(helmetConfig); // Set security HTTP headers
app.use(cors(corsOptions)); // CORS with whitelist
app.use(express.json({ limit: '10mb' })); // Body parser with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeData); // Sanitize data against NoSQL injection
app.use(preventXSS); // Prevent XSS attacks
app.use(limiter); // Apply rate limiting to all requests

// Static file serving for generated images and styles
app.use('/generated', express.static(path.join(__dirname, '../data/generated')));
app.use('/styles', express.static(path.join(__dirname, '../data/styles')));

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to NeuroCanvas API',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// API routes
app.use('/api/style-transfer', require('./routes/style_transfer'));
app.use('/api/nlp', require('./routes/nlp'));

// Apply stricter rate limiting to generation endpoints
const { generationLimiter: genLimiter } = require('./middleware/security');
app.use('/api/diffusion', genLimiter, require('./routes/diffusion'));
app.use('/api/generate', genLimiter, require('./routes/generation'));

app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/llm', require('./routes/llm'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NeuroCanvas API server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});

module.exports = app;
