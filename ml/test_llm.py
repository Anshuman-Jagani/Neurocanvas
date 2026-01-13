#!/usr/bin/env python3
"""
Quick test of LLM service
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from llm.llm_service import LLMService

print("=" * 60)
print("🧪 Testing LLM Service")
print("=" * 60)
print()

try:
    # Initialize service
    print("📥 Loading Llama 2 model...")
    llm = LLMService()
    print()
    
    # Test simple generation
    print("📝 Test: Simple generation")
    prompt = "What is art in one sentence?"
    print(f"Prompt: {prompt}")
    print("Response: ", end="", flush=True)
    
    response = llm.generate(prompt, max_tokens=50)
    print(response)
    print()
    
    print("✅ LLM service working!")
    
except Exception as e:
    print(f"❌ Test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
