#!/bin/bash

# NeuroCanvas Installation Script
# This script automates the setup of NeuroCanvas AI Art Director

set -e  # Exit on error

echo "🎨 NeuroCanvas AI Art Director - Installation Script"
echo "=================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check prerequisites
echo "Step 1: Checking prerequisites..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js $NODE_VERSION installed"
else
    print_error "Node.js is not installed"
    echo "Please install Node.js v18 or higher from https://nodejs.org/"
    exit 1
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "$PYTHON_VERSION installed"
else
    print_error "Python 3 is not installed"
    echo "Please install Python 3.8+ from https://www.python.org/"
    exit 1
fi

# Check MongoDB
if command -v mongod &> /dev/null; then
    print_success "MongoDB installed"
else
    print_info "MongoDB not found. You can install it or use Docker."
fi

# Check Git
if command -v git &> /dev/null; then
    print_success "Git installed"
else
    print_error "Git is not installed"
    exit 1
fi

echo ""
echo "Step 2: Installing backend dependencies..."
cd backend
npm install
print_success "Backend dependencies installed"

echo ""
echo "Step 3: Installing frontend dependencies..."
cd ../frontend
npm install
print_success "Frontend dependencies installed"

echo ""
echo "Step 4: Setting up Python environment..."
cd ..

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_success "Virtual environment created"
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
if [ -f "ml/requirements.txt" ]; then
    pip install -r ml/requirements.txt
    print_success "Python dependencies installed"
else
    print_info "ml/requirements.txt not found, skipping Python dependencies"
fi

echo ""
echo "Step 5: Creating necessary directories..."
mkdir -p data/generated data/styles backend/uploads models
print_success "Directories created"

echo ""
echo "Step 6: Setting up environment variables..."
if [ ! -f "backend/.env" ]; then
    cat > backend/.env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/neurocanvas
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
MAX_FILE_SIZE=10485760
EOF
    print_success "Backend .env file created"
else
    print_info "Backend .env file already exists"
fi

if [ ! -f "frontend/.env" ]; then
    cat > frontend/.env << EOF
VITE_API_URL=http://localhost:5000
EOF
    print_success "Frontend .env file created"
else
    print_info "Frontend .env file already exists"
fi

echo ""
echo "Step 7: Downloading AI models (this may take a while)..."
print_info "Models will be downloaded on first use to save time"

echo ""
echo "=================================================="
echo "✨ Installation Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start MongoDB:"
echo "   mongod --dbpath ./data/db"
echo ""
echo "2. Start the backend (in a new terminal):"
echo "   cd backend"
echo "   npm start"
echo ""
echo "3. Start the frontend (in another terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Open your browser to:"
echo "   http://localhost:5173"
echo ""
echo "For Docker deployment, see docs/DEPLOYMENT.md"
echo ""
