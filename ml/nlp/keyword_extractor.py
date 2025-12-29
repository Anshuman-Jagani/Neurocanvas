#!/usr/bin/env python3
"""
Keyword Extractor for Art Prompts
Extracts artistic keywords and concepts from prompts
"""

import sys
import json
import re
import warnings
warnings.filterwarnings('ignore')

# Artistic keyword categories
ARTISTIC_KEYWORDS = {
    'styles': [
        'abstract', 'realistic', 'surreal', 'impressionist', 'expressionist',
        'minimalist', 'baroque', 'renaissance', 'modern', 'contemporary',
        'cubist', 'pop art', 'art nouveau', 'art deco', 'gothic', 'romantic',
        'futuristic', 'retro', 'vintage', 'cyberpunk', 'steampunk'
    ],
    'moods': [
        'serene', 'peaceful', 'calm', 'tranquil', 'dramatic', 'intense',
        'mysterious', 'ethereal', 'whimsical', 'playful', 'dark', 'gloomy',
        'bright', 'cheerful', 'melancholic', 'nostalgic', 'dreamy', 'energetic',
        'somber', 'joyful', 'ominous', 'hopeful'
    ],
    'colors': [
        'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black',
        'white', 'gray', 'brown', 'gold', 'silver', 'bronze', 'crimson',
        'azure', 'emerald', 'amber', 'violet', 'magenta', 'cyan', 'turquoise',
        'vibrant', 'muted', 'pastel', 'neon', 'monochrome', 'colorful'
    ],
    'lighting': [
        'golden hour', 'sunset', 'sunrise', 'twilight', 'dusk', 'dawn',
        'moonlight', 'candlelight', 'dramatic lighting', 'soft lighting',
        'harsh lighting', 'backlit', 'silhouette', 'chiaroscuro', 'rim light',
        'ambient', 'natural light', 'studio lighting', 'neon lights'
    ],
    'textures': [
        'smooth', 'rough', 'glossy', 'matte', 'metallic', 'organic', 'geometric',
        'flowing', 'sharp', 'soft', 'hard', 'fluid', 'crystalline', 'grainy',
        'silky', 'weathered', 'polished', 'textured'
    ],
    'compositions': [
        'symmetrical', 'asymmetrical', 'balanced', 'dynamic', 'static',
        'centered', 'rule of thirds', 'diagonal', 'vertical', 'horizontal',
        'spiral', 'radial', 'pattern', 'layered', 'minimalist', 'complex'
    ]
}

def extract_keywords(prompt):
    """
    Extract artistic keywords from a prompt
    
    Args:
        prompt (str): Input prompt text
        
    Returns:
        dict: Extracted keywords by category
    """
    prompt_lower = prompt.lower()
    
    extracted = {
        'styles': [],
        'moods': [],
        'colors': [],
        'lighting': [],
        'textures': [],
        'compositions': [],
        'subjects': []
    }
    
    # Extract keywords from predefined categories
    for category, keywords in ARTISTIC_KEYWORDS.items():
        for keyword in keywords:
            if keyword in prompt_lower:
                extracted[category].append(keyword)
    
    # Extract potential subjects (nouns)
    # Simple extraction - words that might be subjects
    words = re.findall(r'\b[a-z]+\b', prompt_lower)
    common_subjects = [
        'landscape', 'portrait', 'person', 'face', 'mountain', 'ocean', 'forest',
        'city', 'building', 'sky', 'cloud', 'tree', 'flower', 'animal', 'bird',
        'castle', 'house', 'river', 'lake', 'beach', 'desert', 'space', 'planet',
        'galaxy', 'star', 'moon', 'sun', 'character', 'creature', 'dragon',
        'fantasy', 'scifi', 'nature', 'urban', 'rural', 'abstract'
    ]
    
    for subject in common_subjects:
        if subject in words:
            extracted['subjects'].append(subject)
    
    # Get all unique keywords
    all_keywords = []
    for category_keywords in extracted.values():
        all_keywords.extend(category_keywords)
    
    return {
        'keywords': list(set(all_keywords)),
        'by_category': {k: v for k, v in extracted.items() if v},
        'count': len(set(all_keywords))
    }

def extract_with_embeddings(prompt):
    """
    Extract keywords using sentence transformers (more advanced)
    Falls back to simple extraction if model not available
    """
    try:
        from sentence_transformers import SentenceTransformer, util
        import numpy as np
        
        # Load lightweight model
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Create embeddings for prompt
        prompt_embedding = model.encode(prompt, convert_to_tensor=True)
        
        # Get all possible keywords
        all_keywords = []
        for keywords in ARTISTIC_KEYWORDS.values():
            all_keywords.extend(keywords)
        
        # Create embeddings for keywords
        keyword_embeddings = model.encode(all_keywords, convert_to_tensor=True)
        
        # Calculate similarities
        similarities = util.cos_sim(prompt_embedding, keyword_embeddings)[0]
        
        # Get top keywords
        top_indices = similarities.argsort(descending=True)[:10]
        top_keywords = [(all_keywords[i], float(similarities[i])) for i in top_indices if similarities[i] > 0.3]
        
        return {
            'keywords': [kw for kw, score in top_keywords],
            'scores': {kw: round(score, 4) for kw, score in top_keywords},
            'method': 'embeddings'
        }
        
    except Exception as e:
        # Fallback to simple extraction
        return extract_keywords(prompt)

def main():
    """Main function to handle stdin/stdout communication"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        prompt = input_data.get('prompt', '')
        use_embeddings = input_data.get('use_embeddings', False)
        
        if not prompt:
            raise ValueError("Prompt is required")
        
        # Extract keywords
        if use_embeddings:
            result = extract_with_embeddings(prompt)
        else:
            result = extract_keywords(prompt)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'keywords': [],
            'count': 0
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    # Test mode
    if '--test' in sys.argv:
        test_prompts = [
            "A serene mountain landscape at golden hour with misty valleys",
            "Dark and mysterious gothic castle under moonlight",
            "Abstract geometric composition with vibrant neon colors"
        ]
        
        print("Testing Keyword Extractor...")
        for prompt in test_prompts:
            result = extract_keywords(prompt)
            print(f"\nPrompt: {prompt}")
            print(f"Keywords: {', '.join(result['keywords'])}")
            print(f"Categories: {list(result['by_category'].keys())}")
    else:
        main()
