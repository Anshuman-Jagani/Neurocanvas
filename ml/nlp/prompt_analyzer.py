#!/usr/bin/env python3
"""
Main Prompt Analyzer
Combines sentiment analysis, keyword extraction, and artistic concept detection
"""

import sys
import json
import warnings
warnings.filterwarnings('ignore')

# Import local modules
try:
    from sentiment_analyzer import analyze_sentiment
    from keyword_extractor import extract_keywords
except ImportError:
    # Fallback imports for when running as standalone
    import os
    sys.path.insert(0, os.path.dirname(__file__))
    from sentiment_analyzer import analyze_sentiment
    from keyword_extractor import extract_keywords

def detect_artistic_concepts(prompt, keywords):
    """
    Detect high-level artistic concepts from prompt and keywords
    
    Args:
        prompt (str): Original prompt
        keywords (dict): Extracted keywords
        
    Returns:
        list: Detected artistic concepts
    """
    concepts = []
    prompt_lower = prompt.lower()
    
    # Detect based on keywords
    keyword_list = keywords.get('keywords', [])
    
    # Nature/Landscape
    nature_keywords = ['mountain', 'ocean', 'forest', 'landscape', 'nature', 'tree', 'sky']
    if any(kw in keyword_list or kw in prompt_lower for kw in nature_keywords):
        concepts.append('nature/landscape')
    
    # Urban/Architecture
    urban_keywords = ['city', 'building', 'urban', 'street', 'architecture']
    if any(kw in keyword_list or kw in prompt_lower for kw in urban_keywords):
        concepts.append('urban/architecture')
    
    # Fantasy/Magical
    fantasy_keywords = ['fantasy', 'magical', 'mystical', 'ethereal', 'dragon', 'castle']
    if any(kw in keyword_list or kw in prompt_lower for kw in fantasy_keywords):
        concepts.append('fantasy/magical')
    
    # Sci-Fi/Futuristic
    scifi_keywords = ['scifi', 'futuristic', 'cyberpunk', 'space', 'robot', 'alien']
    if any(kw in keyword_list or kw in prompt_lower for kw in scifi_keywords):
        concepts.append('sci-fi/futuristic')
    
    # Portrait/Character
    portrait_keywords = ['portrait', 'face', 'person', 'character', 'woman', 'man']
    if any(kw in keyword_list or kw in prompt_lower for kw in portrait_keywords):
        concepts.append('portrait/character')
    
    # Abstract
    abstract_keywords = ['abstract', 'geometric', 'pattern', 'shapes']
    if any(kw in keyword_list or kw in prompt_lower for kw in abstract_keywords):
        concepts.append('abstract/geometric')
    
    return concepts if concepts else ['general']

def suggest_styles(sentiment, keywords, concepts):
    """
    Suggest artistic styles based on analysis
    
    Args:
        sentiment (dict): Sentiment analysis results
        keywords (dict): Extracted keywords
        concepts (list): Detected concepts
        
    Returns:
        list: Suggested artistic styles
    """
    suggestions = []
    
    # Based on sentiment
    if sentiment['label'] == 'positive':
        suggestions.extend(['impressionist', 'vibrant', 'cheerful'])
    elif sentiment['label'] == 'negative':
        suggestions.extend(['expressionist', 'dark', 'dramatic'])
    else:
        suggestions.extend(['realistic', 'balanced', 'neutral'])
    
    # Based on concepts
    if 'nature/landscape' in concepts:
        suggestions.extend(['landscape photography', 'romantic', 'naturalistic'])
    if 'fantasy/magical' in concepts:
        suggestions.extend(['fantasy art', 'surreal', 'dreamlike'])
    if 'sci-fi/futuristic' in concepts:
        suggestions.extend(['cyberpunk', 'futuristic', 'neon'])
    if 'abstract/geometric' in concepts:
        suggestions.extend(['abstract', 'minimalist', 'geometric'])
    
    # Based on keywords
    keyword_list = keywords.get('keywords', [])
    if 'dark' in keyword_list or 'gloomy' in keyword_list:
        suggestions.append('gothic')
    if 'vibrant' in keyword_list or 'colorful' in keyword_list:
        suggestions.append('pop art')
    
    # Return unique suggestions
    return list(set(suggestions))[:5]

def detect_mood(sentiment, keywords):
    """
    Detect overall mood of the prompt
    """
    keyword_list = keywords.get('keywords', [])
    
    # Check for mood keywords
    if any(kw in keyword_list for kw in ['serene', 'peaceful', 'calm', 'tranquil']):
        return 'peaceful'
    elif any(kw in keyword_list for kw in ['dramatic', 'intense', 'powerful']):
        return 'dramatic'
    elif any(kw in keyword_list for kw in ['mysterious', 'dark', 'ominous']):
        return 'mysterious'
    elif any(kw in keyword_list for kw in ['whimsical', 'playful', 'cheerful']):
        return 'playful'
    elif any(kw in keyword_list for kw in ['ethereal', 'dreamy', 'magical']):
        return 'ethereal'
    else:
        # Based on sentiment
        if sentiment['label'] == 'positive':
            return 'uplifting'
        elif sentiment['label'] == 'negative':
            return 'somber'
        else:
            return 'neutral'

def detect_color_palette(keywords):
    """
    Suggest color palette based on keywords
    """
    keyword_list = keywords.get('keywords', [])
    by_category = keywords.get('by_category', {})
    
    # Get color keywords
    color_keywords = by_category.get('colors', [])
    
    if color_keywords:
        return color_keywords[:5]
    
    # Suggest based on other keywords
    if 'sunset' in keyword_list or 'golden hour' in keyword_list:
        return ['orange', 'gold', 'warm tones']
    elif 'ocean' in keyword_list or 'water' in keyword_list:
        return ['blue', 'turquoise', 'aqua']
    elif 'forest' in keyword_list or 'nature' in keyword_list:
        return ['green', 'brown', 'earth tones']
    elif 'dark' in keyword_list or 'night' in keyword_list:
        return ['black', 'dark blue', 'deep purple']
    else:
        return ['balanced', 'natural']

def analyze_prompt(prompt):
    """
    Comprehensive prompt analysis
    
    Args:
        prompt (str): Input prompt text
        
    Returns:
        dict: Complete analysis results
    """
    try:
        # Analyze sentiment
        sentiment = analyze_sentiment(prompt)
        
        # Extract keywords
        keywords = extract_keywords(prompt)
        
        # Detect concepts
        concepts = detect_artistic_concepts(prompt, keywords)
        
        # Suggest styles
        styles = suggest_styles(sentiment, keywords, concepts)
        
        # Detect mood
        mood = detect_mood(sentiment, keywords)
        
        # Suggest color palette
        colors = detect_color_palette(keywords)
        
        return {
            'sentiment': sentiment,
            'keywords': keywords.get('keywords', [])[:10],
            'artisticConcepts': concepts,
            'suggestedStyles': styles,
            'mood': mood,
            'colorPalette': colors,
            'keywordsByCategory': keywords.get('by_category', {})
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'sentiment': {'label': 'neutral', 'score': 0.5},
            'keywords': [],
            'artisticConcepts': ['general'],
            'suggestedStyles': ['realistic'],
            'mood': 'neutral',
            'colorPalette': ['balanced']
        }

def main():
    """Main function to handle stdin/stdout communication"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        prompt = input_data.get('prompt', '')
        
        if not prompt:
            raise ValueError("Prompt is required")
        
        # Analyze prompt
        result = analyze_prompt(prompt)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'sentiment': {'label': 'neutral', 'score': 0.5},
            'keywords': [],
            'artisticConcepts': ['general'],
            'suggestedStyles': ['realistic'],
            'mood': 'neutral',
            'colorPalette': ['balanced']
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    # Test mode
    if '--test' in sys.argv:
        test_prompts = [
            "A serene mountain landscape at golden hour with misty valleys",
            "Dark and mysterious gothic castle under moonlight",
            "Vibrant abstract geometric composition with neon colors",
            "Ethereal portrait of a woman in a dreamy forest"
        ]
        
        print("Testing Prompt Analyzer...")
        for prompt in test_prompts:
            print(f"\n{'='*60}")
            print(f"Prompt: {prompt}")
            print('='*60)
            result = analyze_prompt(prompt)
            print(f"Sentiment: {result['sentiment']['label']} ({result['sentiment']['score']})")
            print(f"Mood: {result['mood']}")
            print(f"Keywords: {', '.join(result['keywords'][:5])}")
            print(f"Concepts: {', '.join(result['artisticConcepts'])}")
            print(f"Suggested Styles: {', '.join(result['suggestedStyles'][:3])}")
            print(f"Color Palette: {', '.join(result['colorPalette'][:3])}")
    else:
        main()
