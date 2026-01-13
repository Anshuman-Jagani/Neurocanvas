"""
LLM Model Downloader
Downloads Llama 2 7B quantized model from HuggingFace
"""

import os
import sys
import requests
from pathlib import Path
from tqdm import tqdm
import hashlib

# Model configuration
MODEL_URL = "https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf"
MODEL_NAME = "llama-2-7b-chat.Q4_K_M.gguf"
MODEL_SIZE = 4_000_000_000  # ~4GB
CHUNK_SIZE = 8192

def download_file(url, destination, expected_size=None):
    """
    Download file with progress bar
    """
    print(f"📥 Downloading {MODEL_NAME}...")
    print(f"📍 URL: {url}")
    print(f"💾 Destination: {destination}")
    
    # Create directory if it doesn't exist
    destination.parent.mkdir(parents=True, exist_ok=True)
    
    # Check if file already exists
    if destination.exists():
        file_size = destination.stat().st_size
        if expected_size and file_size == expected_size:
            print(f"✅ Model already downloaded ({file_size / 1e9:.2f} GB)")
            return True
        else:
            print(f"⚠️  Existing file size mismatch. Re-downloading...")
            destination.unlink()
    
    try:
        # Start download with streaming
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        
        # Progress bar
        with open(destination, 'wb') as f:
            with tqdm(total=total_size, unit='B', unit_scale=True, desc=MODEL_NAME) as pbar:
                for chunk in response.iter_content(chunk_size=CHUNK_SIZE):
                    if chunk:
                        f.write(chunk)
                        pbar.update(len(chunk))
        
        print(f"✅ Download complete! ({total_size / 1e9:.2f} GB)")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Download failed: {e}")
        if destination.exists():
            destination.unlink()
        return False
    except KeyboardInterrupt:
        print(f"\n⚠️  Download interrupted by user")
        if destination.exists():
            destination.unlink()
        sys.exit(1)

def verify_model(model_path):
    """
    Verify model file integrity
    """
    if not model_path.exists():
        return False
    
    file_size = model_path.stat().st_size
    print(f"📊 Model size: {file_size / 1e9:.2f} GB")
    
    # Basic size check (should be around 4GB)
    if file_size < 3_500_000_000 or file_size > 4_500_000_000:
        print(f"⚠️  Warning: Model size seems incorrect")
        return False
    
    print(f"✅ Model verification passed")
    return True

def download_llama_model():
    """
    Main function to download Llama 2 model
    """
    print("=" * 60)
    print("🦙 Llama 2 7B Chat Model Downloader")
    print("=" * 60)
    print()
    
    # Determine model path
    script_dir = Path(__file__).parent
    models_dir = script_dir.parent.parent / "models"
    model_path = models_dir / MODEL_NAME
    
    print(f"📁 Models directory: {models_dir}")
    print(f"📄 Model file: {MODEL_NAME}")
    print(f"📦 Expected size: ~{MODEL_SIZE / 1e9:.1f} GB")
    print()
    
    # Download model
    success = download_file(MODEL_URL, model_path, MODEL_SIZE)
    
    if not success:
        print("❌ Failed to download model")
        return False
    
    # Verify model
    if not verify_model(model_path):
        print("❌ Model verification failed")
        return False
    
    print()
    print("=" * 60)
    print("✅ Llama 2 model ready!")
    print("=" * 60)
    print(f"📍 Model location: {model_path}")
    print()
    print("Next steps:")
    print("1. Install llama-cpp-python: pip install llama-cpp-python")
    print("2. Test the model: python ml/llm/llm_service.py")
    print()
    
    return True

if __name__ == "__main__":
    try:
        success = download_llama_model()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
