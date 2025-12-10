#!/usr/bin/env python3
"""
Test script to verify Python environment and ML dependencies
"""

import sys

print("🔍 Testing NeuroCanvas Python Environment...\n")

# Test Python version
print(f"✅ Python version: {sys.version}")

# Test imports
try:
    import torch
    print(f"✅ PyTorch: {torch.__version__}")
    print(f"   CPU available: {torch.cuda.is_available() == False}")
    
    import torchvision
    print(f"✅ TorchVision: {torchvision.__version__}")
    
    import transformers
    print(f"✅ Transformers: {transformers.__version__}")
    
    import diffusers
    print(f"✅ Diffusers: {diffusers.__version__}")
    
    import cv2
    print(f"✅ OpenCV: {cv2.__version__}")
    
    import numpy as np
    print(f"✅ NumPy: {np.__version__}")
    
    import PIL
    print(f"✅ Pillow: {PIL.__version__}")
    
    import onnxruntime
    print(f"✅ ONNX Runtime: {onnxruntime.__version__}")
    
    print("\n🎉 All dependencies installed successfully!")
    print("✨ Ready to start building NeuroCanvas!")
    
except ImportError as e:
    print(f"\n❌ Import error: {e}")
    print("Please run: pip install -r requirements.txt")
    sys.exit(1)
