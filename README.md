# NeuroCanvas: AI Art Director

A multimodal AI art generation system that combines multiple AI approaches including Neural Style Transfer, Diffusion Models, NLP, and Reinforcement Learning for personalized art creation.

## 🎨 Features

- **Multi-Model Generation**: Combines Style Transfer, Diffusion Models, and GANs
- **Personalization**: Learns user preferences using Multi-Armed Bandit algorithms
- **Conversational AI**: Local LLM for iterative refinement
- **CPU-Optimized**: Runs entirely on CPU without GPU requirements
- **Zero Cost**: No cloud services or paid APIs required

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Python ML scripts

### Frontend
- React.js + Vite
- Tailwind CSS
- Zustand (state management)

### AI/ML
- PyTorch (CPU)
- Hugging Face Transformers & Diffusers
- Neural Style Transfer
- Local LLM (Llama 2 via llama.cpp)

## 📋 Prerequisites

- Node.js v18+ (you have v24.4.1 ✅)
- Python 3.10+ (you have 3.13.1 ✅)
- Git (you have 2.50.1 ✅)
- MongoDB Community Edition
- ~15GB disk space for models

## 🚀 Getting Started

### 1. Install MongoDB

```bash
# Install MongoDB Community Edition (using Homebrew on Mac)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify MongoDB is running
mongosh --eval "db.version()"
```

### 2. Set Up Python Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Mac/Linux

# Install PyTorch (CPU version)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install ML dependencies
pip install transformers diffusers pillow opencv-python numpy scipy

# Install optimization libraries
pip install onnxruntime optimum

# Install Flask (optional, for Python backend)
pip install flask flask-cors
```

### 3. Set Up Backend

```bash
cd backend
npm install
```

### 4. Set Up Frontend

```bash
cd frontend
npm install
```

### 5. Download Models

Models will be downloaded automatically on first run, or you can pre-download them:

```bash
# Style transfer models (~500MB)
# Diffusion models (~2-4GB)
# NLP models (~300MB)
# Local LLM (~4GB)
```

### 6. Run the Application

```bash
# Terminal 1: Start MongoDB (if not running as service)
mongod --dbpath ./data/mongodb

# Terminal 2: Start Backend
cd backend
npm run dev

# Terminal 3: Start Frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173` to use the application!

## 📁 Project Structure

```
neurocanvas/
├── backend/          # Node.js + Express API
├── frontend/         # React application
├── ml/              # Python ML scripts
├── models/          # Downloaded AI models
├── data/            # MongoDB data & cache
├── tests/           # Test files
└── docs/            # Documentation
```

## 🎯 Development Roadmap

- **Month 1**: Core models (Style Transfer, Diffusion, NLP)
- **Month 2**: Multi-model integration & Backend API
- **Month 3**: Frontend & Local LLM
- **Month 4**: Polish, optimization & documentation

## 📚 Documentation

- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [User Guide](docs/USER_GUIDE.md)

## 🤝 Contributing

This is an academic project for SEM-8. Contributions and suggestions are welcome!

## 📄 License

MIT License - feel free to use for learning and academic purposes.

## 🙏 Acknowledgments

- Hugging Face for model hosting
- PyTorch team for the framework
- Open-source AI community

---

**Built with ❤️ for learning multimodal AI**
