#!/usr/bin/env python3
"""
Prompt Enhancer for Art Generation
Enhances user prompts with artistic terminology and suggestions
"""

import sys
import json
import random
import warnings
warnings.filterwarnings('ignore')

# Enhancement templates and modifiers
ARTISTIC_MODIFIERS = {
    'quality': [
        'highly detailed', 'masterpiece', 'professional', 'award-winning',
        'stunning', 'breathtaking', 'exquisite', 'intricate', 'refined'
    ],
    'style_modifiers': [
        'in the style of', 'reminiscent of', 'inspired by', 'with elements of'
    ],
    'technical': [
        '4k', '8k', 'ultra HD', 'high resolution', 'sharp focus',
        'professional photography', 'digital art', 'concept art'
    ],
    'lighting_enhance': [
        'cinematic lighting', 'volumetric lighting', 'dramatic shadows',
        'soft ambient light', 'ray tracing', 'global illumination'
    ],
    'composition_enhance': [
        'rule of thirds', 'dynamic composition', 'balanced framing',
        'depth of field', 'bokeh', 'wide angle', 'close-up'
    ]
}

FAMOUS_ARTISTS = [
    'Van Gogh', 'Monet', 'Picasso', 'Dali', 'Rembrandt', 'Michelangelo',
    'Leonardo da Vinci', 'Banksy', 'Warhol', 'Klimt', 'Hokusai'
]

def enhance_prompt_simple(prompt):
    """
    Enhance prompt with artistic terminology (rule-based)
    
    Args:
        prompt (str): Original prompt
        
    Returns:
        dict: Enhanced prompt and suggestions
    """
    enhanced = prompt.strip()
    
    # Add quality modifiers if not present
    has_quality = any(mod in enhanced.lower() for mod in ARTISTIC_MODIFIERS['quality'])
    if not has_quality and len(enhanced.split()) > 3:
        quality_mod = random.choice(ARTISTIC_MODIFIERS['quality'])
        enhanced = f"{quality_mod}, {enhanced}"
    
    # Add technical details if prompt is short
    if len(enhanced.split()) < 10:
        technical_mod = random.choice(ARTISTIC_MODIFIERS['technical'])
        enhanced = f"{enhanced}, {technical_mod}"
    
    # Generate alternative suggestions
    suggestions = []
    
    # Suggestion 1: Add lighting
    lighting = random.choice(ARTISTIC_MODIFIERS['lighting_enhance'])
    suggestions.append(f"{prompt}, {lighting}")
    
    # Suggestion 2: Add artist style
    artist = random.choice(FAMOUS_ARTISTS)
    suggestions.append(f"{prompt}, in the style of {artist}")
    
    # Suggestion 3: Add composition
    composition = random.choice(ARTISTIC_MODIFIERS['composition_enhance'])
    suggestions.append(f"{prompt}, {composition}")
    
    return {
        'enhancedPrompt': enhanced,
        'suggestions': suggestions[:3],
        'modifications': {
            'added_quality': not has_quality,
            'added_technical': len(prompt.split()) < 10
        }
    }

def enhance_with_model(prompt):
    """
    Enhance prompt using GPT-2 model (more advanced)
    Falls back to simple enhancement if model not available
    """
    try:
        from transformers import pipeline
        
        # Load text generation pipeline
        generator = pipeline(
            'text-generation',
            model='distilgpt2',
            device=-1  # CPU
        )
        
        # Create enhancement prompt
        enhancement_prompt = f"Artistic prompt: {prompt}\nEnhanced version:"
        
        # Generate enhancement
        result = generator(
            enhancement_prompt,
            max_length=len(enhancement_prompt.split()) + 30,
            num_return_sequences=3,
            temperature=0.8,
            do_sample=True
        )
        
        # Extract generated text
        suggestions = []
        for gen in result:
            text = gen['generated_text'].replace(enhancement_prompt, '').strip()
            if text and len(text) > 10:
                suggestions.append(text[:200])  # Limit length
        
        # Use simple enhancement as base
        simple_result = enhance_prompt_simple(prompt)
        
        return {
            'enhancedPrompt': simple_result['enhancedPrompt'],
            'suggestions': suggestions if suggestions else simple_result['suggestions'],
            'method': 'model-based'
        }
        
    except Exception as e:
        # Fallback to simple enhancement
        return enhance_prompt_simple(prompt)

def get_prompt_variations(prompt):
    """
    Generate multiple variations of a prompt
    """
    variations = []
    
    # Variation 1: Different quality modifier
    for quality in random.sample(ARTISTIC_MODIFIERS['quality'], 2):
        variations.append(f"{quality}, {prompt}")
    
    # Variation 2: Different artists
    for artist in random.sample(FAMOUS_ARTISTS, 2):
        variations.append(f"{prompt}, in the style of {artist}")
    
    # Variation 3: Different lighting
    for lighting in random.sample(ARTISTIC_MODIFIERS['lighting_enhance'], 2):
        variations.append(f"{prompt}, {lighting}")
    
    return variations[:5]

def main():
    """Main function to handle stdin/stdout communication"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        prompt = input_data.get('prompt', '')
        use_model = input_data.get('use_model', False)
        get_variations = input_data.get('variations', False)
        
        if not prompt:
            raise ValueError("Prompt is required")
        
        # Enhance prompt
        if use_model:
            result = enhance_with_model(prompt)
        else:
            result = enhance_prompt_simple(prompt)
        
        # Add variations if requested
        if get_variations:
            result['variations'] = get_prompt_variations(prompt)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'enhancedPrompt': prompt if 'prompt' in locals() else '',
            'suggestions': []
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    # Test mode
    if '--test' in sys.argv:
        test_prompts = [
            "mountain landscape",
            "portrait of a woman",
            "abstract shapes"
        ]
        
        print("Testing Prompt Enhancer...")
        for prompt in test_prompts:
            result = enhance_prompt_simple(prompt)
            print(f"\nOriginal: {prompt}")
            print(f"Enhanced: {result['enhancedPrompt']}")
            print(f"Suggestions: {len(result['suggestions'])}")
    else:
        main()
