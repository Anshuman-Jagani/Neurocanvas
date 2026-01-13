#!/usr/bin/env python3
"""
Mock LLM API for testing without downloading the 4GB model
This allows testing the integration without llama-cpp-python
"""

import sys
import json
import argparse
import time

def handle_chat(params):
    """Mock chat response"""
    message = params.get('message', '')
    
    # Simulate processing time
    time.sleep(0.5)
    
    response = f"[MOCK] I understand you said: '{message}'. This is a mock response. To use the real LLM, install llama-cpp-python and download the Llama 2 model."
    
    return {
        "response": response,
        "tokens": len(message.split()) + len(response.split()),
        "message_count": 1
    }

def handle_refine(params):
    """Mock refinement"""
    prompt = params.get('prompt', '')
    feedback = params.get('feedback', 'Make it more detailed')
    
    refined = f"{prompt}, with enhanced artistic details, vivid colors, and dramatic lighting"
    
    return {
        "refined_prompt": refined,
        "explanation": f"Added artistic enhancements based on: {feedback}",
        "alternatives": [
            f"{prompt} in impressionist style",
            f"{prompt} with cinematic composition"
        ]
    }

def handle_suggest(params):
    """Mock suggestions"""
    return {
        "suggestions": [
            "Add specific lighting details (golden hour, dramatic shadows)",
            "Include artistic style (impressionist, surreal, photorealistic)",
            "Specify color palette (vibrant, muted, monochrome)",
            "Add composition details (rule of thirds, symmetrical)",
            "Include mood descriptors (peaceful, energetic, mysterious)"
        ]
    }

def handle_explain(params):
    """Mock explanation"""
    concept = params.get('concept', 'art')
    
    return {
        "explanation": f"[MOCK] {concept.title()} is an artistic concept that involves... (This is a mock explanation. Install the full LLM for detailed explanations.)"
    }

def handle_variations(params):
    """Mock variations"""
    prompt = params.get('prompt', '')
    count = params.get('count', 3)
    
    variations = [
        f"{prompt} in watercolor style",
        f"{prompt} with dramatic lighting and shadows",
        f"{prompt} as a digital art masterpiece"
    ]
    
    return {
        "variations": variations[:count]
    }

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Mock LLM API for testing')
    parser.add_argument('--action', required=True, help='Action to perform')
    parser.add_argument('--params', required=True, help='Parameters as JSON')
    
    args = parser.parse_args()
    
    try:
        # Parse parameters
        params = json.loads(args.params)
        
        # Handle action
        handlers = {
            'chat': handle_chat,
            'refine': handle_refine,
            'suggest': handle_suggest,
            'explain': handle_explain,
            'variations': handle_variations
        }
        
        if args.action not in handlers:
            raise ValueError(f"Unknown action: {args.action}")
        
        result = handlers[args.action](params)
        
        # Output result
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
