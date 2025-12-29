#!/usr/bin/env python3
"""
Sentiment Analyzer for Art Prompts
Uses DistilBERT for sentiment classification
"""

import sys
import json
import warnings
warnings.filterwarnings('ignore')

def analyze_sentiment(prompt):
    """
    Analyze sentiment of a prompt
    
    Args:
        prompt (str): Input prompt text
        
    Returns:
        dict: Sentiment analysis results
    """
    try:
        from transformers import pipeline
        
        # Load sentiment analysis pipeline (CPU-optimized)
        sentiment_analyzer = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            device=-1  # CPU
        )
        
        # Analyze sentiment
        result = sentiment_analyzer(prompt[:512])[0]  # Limit to 512 tokens
        
        # Map to more descriptive labels
        sentiment_map = {
            'POSITIVE': 'positive',
            'NEGATIVE': 'negative',
            'NEUTRAL': 'neutral'
        }
        
        return {
            'label': sentiment_map.get(result['label'], result['label'].lower()),
            'score': round(result['score'], 4),
            'confidence': 'high' if result['score'] > 0.8 else 'medium' if result['score'] > 0.6 else 'low'
        }
        
    except Exception as e:
        return {
            'label': 'neutral',
            'score': 0.5,
            'confidence': 'low',
            'error': str(e)
        }

def main():
    """Main function to handle stdin/stdout communication"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        prompt = input_data.get('prompt', '')
        
        if not prompt:
            raise ValueError("Prompt is required")
        
        # Analyze sentiment
        result = analyze_sentiment(prompt)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'label': 'neutral',
            'score': 0.5,
            'confidence': 'low'
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    # Test mode
    if '--test' in sys.argv:
        test_prompts = [
            "A beautiful sunset over the ocean",
            "Dark and gloomy abandoned castle",
            "A simple geometric pattern"
        ]
        
        print("Testing Sentiment Analyzer...")
        for prompt in test_prompts:
            result = analyze_sentiment(prompt)
            print(f"\nPrompt: {prompt}")
            print(f"Sentiment: {result['label']} (score: {result['score']})")
    else:
        main()
