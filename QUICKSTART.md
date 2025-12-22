# NeuroCanvas - Quick Start Guide

## 🚀 Running the Application

### 1. Install MongoDB (First Time Only)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### 2. Start Backend
```bash
cd backend
cp .env.example .env  # First time only
npm start
```
Backend runs on: `http://localhost:5000`

### 3. Start Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

### 4. Activate Python Environment (for ML scripts)
```bash
source venv/bin/activate
```

---

## 📂 Project Structure

```
neurocanvas/
├── backend/       # Express.js API
├── frontend/      # React UI
├── ml/           # Python ML scripts
├── models/       # Downloaded AI models
├── data/         # MongoDB data & cache
└── venv/         # Python environment
```

---

## 🛠️ Common Commands

### Backend
```bash
npm start          # Start server
npm run dev        # Start with nodemon (auto-reload)
npm test           # Run tests
```

### Frontend
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

### Python
```bash
source venv/bin/activate           # Activate environment
python test_setup.py               # Test dependencies
pip install -r requirements.txt    # Install dependencies
deactivate                         # Deactivate environment
```

---

## 🔍 Useful Endpoints

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health
- MongoDB: mongodb://localhost:27017/neurocanvas

---

## 📝 Environment Variables

Copy `.env.example` to `.env` in the backend directory and configure:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/neurocanvas
```

---

## 🐛 Troubleshooting

### MongoDB not starting
```bash
brew services restart mongodb-community
```

### Port already in use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Python dependencies issue
```bash
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 📚 Next Steps

1. ✅ Week 1: Setup complete
2. ✅ Week 2: Implement Neural Style Transfer
3. ✅ Week 3: Add Diffusion Models
4. 📅 Week 4: NLP Prompt Understanding

---

**Happy Coding! 🎨**
