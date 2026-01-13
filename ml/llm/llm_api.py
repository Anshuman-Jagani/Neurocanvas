#!/usr/bin/env python3
"""
LLM API Bridge
Bridges Node.js backend to Python LLM services
"""

import sys
import json
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from llm_service import LLMService
from art_director import ArtDirector
from conversation_manager import ConversationManager

# Initialize services
llm_service = None
art_director = None
conversations = {}

def init_services():
    """Initialize LLM services"""
    global llm_service, art_director
    
    if llm_service is None:
        try:
            llm_service = LLMService()
            art_director = ArtDirector(llm_service)
            print(json.dumps({"status": "initialized"}), file=sys.stderr)
        except Exception as e:
            print(json.dumps({"error": str(e)}), file=sys.stderr)
            raise

def handle_chat(params):
    """Handle chat request"""
    conversation_id = params.get('conversation_id')
    message = params.get('message')
    
    # Get or create conversation
    if conversation_id not in conversations:
        conversations[conversation_id] = ConversationManager()
        conversations[conversation_id].set_system_prompt(
            art_director.system_prompt
        )
    
    conversation = conversations[conversation_id]
    
    # Get response
    response = art_director.chat(conversation, message)
    
    # Estimate tokens
    tokens = llm_service.count_tokens(message + response)
    
    return {
        "response": response,
        "tokens": tokens,
        "message_count": len(conversation.messages)
    }

def handle_refine(params):
    """Handle prompt refinement"""
    prompt = params.get('prompt')
    feedback = params.get('feedback')
    
    result = art_director.refine_prompt(prompt, feedback)
    
    return result

def handle_suggest(params):
    """Handle suggestions request"""
    prompt = params.get('prompt')
    
    suggestions = art_director.suggest_improvements(prompt)
    
    return {
        "suggestions": suggestions
    }

def handle_explain(params):
    """Handle concept explanation"""
    concept = params.get('concept')
    
    explanation = art_director.explain_concepts(concept)
    
    return {
        "explanation": explanation
    }

def handle_variations(params):
    """Handle variations request"""
    prompt = params.get('prompt')
    count = params.get('count', 3)
    
    variations = art_director.generate_variations(prompt, count)
    
    return {
        "variations": variations
    }

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='LLM API Bridge')
    parser.add_argument('--action', required=True, help='Action to perform')
    parser.add_argument('--params', required=True, help='Parameters as JSON')
    
    args = parser.parse_args()
    
    try:
        # Initialize services
        init_services()
        
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
