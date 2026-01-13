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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/style-transfer', require('./routes/style_transfer'));
app.use('/api/nlp', require('./routes/nlp'));
app.use('/api/generate', require('./routes/generation'));
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
