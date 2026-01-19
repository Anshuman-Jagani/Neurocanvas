#!/usr/bin/env python3
"""
NeuroCanvas - Comprehensive Feature Testing Script
Tests all ML/Python components and backend API endpoints
"""

import sys
import os
import json
import requests
from pathlib import Path

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

# Test results tracker
test_results = {
    'passed': 0,
    'failed': 0,
    'skipped': 0,
    'errors': []
}

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text.center(60)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_test(name, status, message=""):
    if status == "PASS":
        test_results['passed'] += 1
        print(f"{Colors.GREEN}✓{Colors.END} {name}")
        if message:
            print(f"  {Colors.GREEN}{message}{Colors.END}")
    elif status == "FAIL":
        test_results['failed'] += 1
        print(f"{Colors.RED}✗{Colors.END} {name}")
        if message:
            print(f"  {Colors.RED}{message}{Colors.END}")
        test_results['errors'].append(f"{name}: {message}")
    elif status == "SKIP":
        test_results['skipped'] += 1
        print(f"{Colors.YELLOW}⊘{Colors.END} {name} (skipped)")
        if message:
            print(f"  {Colors.YELLOW}{message}{Colors.END}")

# Backend API base URL
API_BASE = "http://localhost:5001"

def test_backend_health():
    """Test 1: Backend Health Check"""
    print_header("TEST 1: Backend Health Check")
    
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_test("Backend health endpoint", "PASS", f"Status: {data.get('status')}")
            return True
        else:
            print_test("Backend health endpoint", "FAIL", f"Status code: {response.status_code}")
            return False
    except Exception as e:
        print_test("Backend health endpoint", "FAIL", str(e))
        return False

def test_backend_root():
    """Test 2: Backend Root Endpoint"""
    print_header("TEST 2: Backend Root Endpoint")
    
    try:
        response = requests.get(f"{API_BASE}/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_test("Root endpoint", "PASS", f"Version: {data.get('version')}")
            return True
        else:
            print_test("Root endpoint", "FAIL", f"Status code: {response.status_code}")
            return False
    except Exception as e:
        print_test("Root endpoint", "FAIL", str(e))
        return False

def test_nlp_endpoints():
    """Test 3: NLP API Endpoints"""
    print_header("TEST 3: NLP API Endpoints")
    
    test_prompt = "A serene landscape with mountains at sunset, vibrant colors, peaceful atmosphere"
    
    # Test analyze endpoint
    try:
        response = requests.post(
            f"{API_BASE}/api/nlp/analyze",
            json={"prompt": test_prompt},
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            print_test("NLP Analyze endpoint", "PASS", f"Sentiment: {data.get('sentiment', {}).get('label', 'N/A')}")
        else:
            print_test("NLP Analyze endpoint", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        print_test("NLP Analyze endpoint", "FAIL", str(e))
    
    # Test enhance endpoint
    try:
        response = requests.post(
            f"{API_BASE}/api/nlp/enhance",
            json={"prompt": test_prompt},
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            print_test("NLP Enhance endpoint", "PASS", f"Enhanced prompt generated")
        else:
            print_test("NLP Enhance endpoint", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        print_test("NLP Enhance endpoint", "FAIL", str(e))
    
    # Test presets endpoint
    try:
        response = requests.get(f"{API_BASE}/api/nlp/presets", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print_test("NLP Presets endpoint", "PASS", f"Found {len(data.get('presets', {}))} categories")
        else:
            print_test("NLP Presets endpoint", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        print_test("NLP Presets endpoint", "FAIL", str(e))

def test_python_imports():
    """Test 4: Python ML Module Imports"""
    print_header("TEST 4: Python ML Module Imports")
    
    # Test PyTorch
    try:
        import torch
        print_test("PyTorch import", "PASS", f"Version: {torch.__version__}")
    except Exception as e:
        print_test("PyTorch import", "FAIL", str(e))
    
    # Test Transformers
    try:
        import transformers
        print_test("Transformers import", "PASS", f"Version: {transformers.__version__}")
    except Exception as e:
        print_test("Transformers import", "FAIL", str(e))
    
    # Test Diffusers
    try:
        import diffusers
        print_test("Diffusers import", "PASS", f"Version: {diffusers.__version__}")
    except Exception as e:
        print_test("Diffusers import", "FAIL", str(e))
    
    # Test Sentence Transformers
    try:
        import sentence_transformers
        print_test("Sentence Transformers import", "PASS", f"Version: {sentence_transformers.__version__}")
    except Exception as e:
        print_test("Sentence Transformers import", "FAIL", str(e))
    
    # Test PIL
    try:
        from PIL import Image
        print_test("Pillow (PIL) import", "PASS")
    except Exception as e:
        print_test("Pillow (PIL) import", "FAIL", str(e))
    
    # Test OpenCV
    try:
        import cv2
        print_test("OpenCV import", "PASS", f"Version: {cv2.__version__}")
    except Exception as e:
        print_test("OpenCV import", "FAIL", str(e))

def test_ml_scripts_exist():
    """Test 5: ML Script Files Existence"""
    print_header("TEST 5: ML Script Files Existence")
    
    ml_files = [
        "ml/style_transfer/style_transfer.py",
        "ml/diffusion/text_to_image.py",
        "ml/nlp/prompt_analyzer.py",
        "ml/nlp/keyword_extractor.py",
        "ml/nlp/sentiment_analyzer.py",
        "ml/nlp/prompt_enhancer.py",
        "ml/multi_model_generator.py",
        "ml/rl/multi_armed_bandit.py",
        "ml/rl/preference_learner.py",
        "ml/llm/llm_service.py",
        "ml/llm/conversation_manager.py",
        "ml/llm/art_director.py",
    ]
    
    for file_path in ml_files:
        full_path = Path(file_path)
        if full_path.exists():
            print_test(f"File: {file_path}", "PASS")
        else:
            print_test(f"File: {file_path}", "FAIL", "File not found")

def test_backend_routes_exist():
    """Test 6: Backend Route Files Existence"""
    print_header("TEST 6: Backend Route Files Existence")
    
    route_files = [
        "backend/routes/style_transfer.js",
        "backend/routes/nlp.js",
        "backend/routes/generation.js",
        "backend/routes/feedback.js",
        "backend/routes/llm.js",
    ]
    
    for file_path in route_files:
        full_path = Path(file_path)
        if full_path.exists():
            print_test(f"Route: {file_path}", "PASS")
        else:
            print_test(f"Route: {file_path}", "FAIL", "File not found")

def test_frontend_components_exist():
    """Test 7: Frontend Component Files Existence"""
    print_header("TEST 7: Frontend Component Files Existence")
    
    component_files = [
        "frontend/src/App.jsx",
        "frontend/src/components/StyleTransfer.jsx",
        "frontend/src/components/PromptInput.jsx",
        "frontend/src/components/PromptAnalysis.jsx",
        "frontend/src/components/PromptSuggestions.jsx",
        "frontend/src/components/GenerationDashboard.jsx",
        "frontend/src/components/ImageGallery.jsx",
        "frontend/src/components/ChatInterface.jsx",
        "frontend/src/components/FeedbackPanel.jsx",
    ]
    
    for file_path in component_files:
        full_path = Path(file_path)
        if full_path.exists():
            print_test(f"Component: {file_path}", "PASS")
        else:
            print_test(f"Component: {file_path}", "FAIL", "File not found")

def test_data_directories():
    """Test 8: Data Directories Structure"""
    print_header("TEST 8: Data Directories Structure")
    
    directories = [
        "data",
        "models",
        "backend/uploads",
    ]
    
    for dir_path in directories:
        full_path = Path(dir_path)
        if full_path.exists() and full_path.is_dir():
            print_test(f"Directory: {dir_path}", "PASS")
        else:
            print_test(f"Directory: {dir_path}", "FAIL", "Directory not found")

def print_summary():
    """Print test summary"""
    print_header("TEST SUMMARY")
    
    total = test_results['passed'] + test_results['failed'] + test_results['skipped']
    
    print(f"Total Tests: {Colors.BOLD}{total}{Colors.END}")
    print(f"Passed: {Colors.GREEN}{test_results['passed']}{Colors.END}")
    print(f"Failed: {Colors.RED}{test_results['failed']}{Colors.END}")
    print(f"Skipped: {Colors.YELLOW}{test_results['skipped']}{Colors.END}")
    
    if test_results['failed'] > 0:
        print(f"\n{Colors.RED}{Colors.BOLD}ERRORS FOUND:{Colors.END}")
        for error in test_results['errors']:
            print(f"  {Colors.RED}• {error}{Colors.END}")
    
    print(f"\n{Colors.BOLD}Overall Status: ", end="")
    if test_results['failed'] == 0:
        print(f"{Colors.GREEN}✓ ALL TESTS PASSED{Colors.END}")
    else:
        print(f"{Colors.RED}✗ SOME TESTS FAILED{Colors.END}")
    
    print()

def main():
    """Main test execution"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║     NeuroCanvas - Comprehensive Feature Testing           ║")
    print("║     Testing All Components (Weeks 1-7)                     ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Colors.END}\n")
    
    # Run all tests
    test_backend_health()
    test_backend_root()
    test_nlp_endpoints()
    test_python_imports()
    test_ml_scripts_exist()
    test_backend_routes_exist()
    test_frontend_components_exist()
    test_data_directories()
    
    # Print summary
    print_summary()
    
    # Exit with appropriate code
    sys.exit(0 if test_results['failed'] == 0 else 1)

if __name__ == "__main__":
    main()
