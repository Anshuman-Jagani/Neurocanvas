# NeuroCanvas: AI Art Director 🎨

A production-ready multimodal AI art generation system that combines Neural Style Transfer, Diffusion Models, NLP, and Reinforcement Learning for personalized art creation - all running locally on CPU.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/python-%3E%3D3.8-blue)](https://www.python.org/)

## ✨ Features

- 🎨 **Multi-Model Generation** - Style Transfer, Diffusion Models, and GANs
- 🧠 **NLP Understanding** - Intelligent prompt analysis and enhancement
- 🤖 **Conversational AI** - Local LLM for iterative refinement
- 🎯 **Personalization** - Multi-Armed Bandit algorithm for learning preferences
- 💻 **CPU-Optimized** - No GPU required
- 💰 **Zero Cost** - No cloud services or paid APIs
- 🔒 **Secure** - Rate limiting, input validation, XSS/injection prevention
- 🐳 **Docker Ready** - One-command deployment

## 🚀 Quick Start

### Option 1: Automated Installation (Recommended)

```bash
git clone https://github.com/Anshuman-Jagani/Neurocanvas.git
cd neurocanvas
chmod +x install.sh
./install.sh
```

### Option 2: Docker Deployment

```bash
git clone https://github.com/Anshuman-Jagani/Neurocanvas.git
cd neurocanvas
cp .env.example .env
# Edit .env with your configuration
docker-compose up -d
```

Visit `http://localhost` (Docker) or `http://localhost:5173` (local)

## 📋 Prerequisites

- **Node.js** v18 or higher
- **Python** 3.8 or higher  
- **MongoDB** 6.0 or higher
- **Git**
- **~15GB** disk space for AI models

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Redis (caching)
- Security: Helmet, rate limiting, input validation

### Frontend
- React.js + Vite
- Tailwind CSS
- Zustand (state management)

### AI/ML
- PyTorch (CPU)
- Hugging Face Transformers & Diffusers
- Neural Style Transfer (VGG19)
- Stable Diffusion 2.1
- DistilBERT (NLP)
- Local LLM (Llama 2)

### DevOps
- Docker & Docker Compose
- Nginx
- Jest & Supertest (testing)
- PM2 (process management)

## 📁 Project Structure

```
neurocanvas/
├── backend/              # Node.js + Express API
│   ├── middleware/       # Security & validation
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   └── tests/           # Unit & integration tests
├── frontend/            # React application
├── ml/                  # Python ML scripts
│   ├── diffusion/       # Text-to-image generation
│   ├── style_transfer/  # Neural style transfer
│   ├── nlp/            # Prompt analysis
│   └── llm/            # Local LLM integration
├── docs/               # Documentation
├── docker-compose.yml  # Docker orchestration
└── install.sh         # Automated setup

```

## 🎯 Core Capabilities

### 1. Neural Style Transfer
Transform images with artistic styles (Van Gogh, Monet, Picasso, etc.)
- VGG19-based implementation
- CPU-optimized inference
- Multiple style presets

### 2. Text-to-Image Generation
Generate images from text prompts using Stable Diffusion
- Stable Diffusion 2.1 base model
- Configurable parameters (steps, guidance, size)
- Negative prompts support

### 3. NLP Prompt Understanding
Intelligent prompt analysis and enhancement
- Sentiment analysis (DistilBERT)
- Keyword extraction (6 categories)
- Automatic prompt enhancement
- Style suggestions

### 4. Conversational AI
Iterative refinement with local LLM
- Llama 2 7B (quantized)
- Prompt refinement
- Creative suggestions
- Concept explanations

### 5. Personalization
Learn user preferences with Multi-Armed Bandit
- Epsilon-greedy algorithm
- UCB (Upper Confidence Bound)
- Thompson Sampling
- Personalized recommendations

## 📚 Documentation

- [🚀 Deployment Guide](docs/DEPLOYMENT.md) - Local, Docker, and production setup
- [🔒 Security Guide](docs/SECURITY.md) - Security features and best practices
- [🧪 Testing Guide](docs/TESTING.md) - Running and writing tests
- [📖 Master Plan](MASTER_PLAN.md) - Complete 8-week implementation plan

## 🧪 Testing

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test -- nlpService.test.js
```

## 🔒 Security Features

- **HTTP Security Headers** - Helmet (CSP, XSS protection, frame options)
- **Rate Limiting** - 100 req/15min general, 20 req/hour for generation
- **Input Validation** - Joi schemas for all endpoints
- **Data Sanitization** - NoSQL injection & XSS prevention
- **CORS** - Whitelist-based origin control
- **Request Limits** - 10MB payload size limit

## 🐳 Docker Deployment

The project includes a complete Docker setup:

```bash
# Start all services (MongoDB, Redis, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- **Frontend**: http://localhost (Nginx)
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## 📊 Development Progress

- ✅ **Week 1**: Project Setup
- ✅ **Week 2**: Neural Style Transfer
- ✅ **Week 3**: Diffusion Models
- ✅ **Week 4**: NLP Prompt Understanding
- ✅ **Week 5**: Multi-Model Integration
- ✅ **Week 6**: Reinforcement Learning & Personalization
- ✅ **Week 7**: Local LLM Integration
- ✅ **Week 8**: Testing, Security, Docker & Deployment

## 🤝 Contributing

This is an academic project for SEM-8. Contributions and suggestions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use for learning and academic purposes.

## 🙏 Acknowledgments

- Hugging Face for model hosting
- PyTorch team for the framework
- Stability AI for Stable Diffusion
- Meta AI for Llama 2
- Open-source AI community

---

**Built with ❤️ for learning multimodal AI**

*NeuroCanvas - Where AI meets creativity*
