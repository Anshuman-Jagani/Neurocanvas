"""
Prompt processing utilities for Stable Diffusion
"""

import re


def enhance_prompt(prompt, style=None):
    """
    Enhance a basic prompt with quality modifiers
    
    Args:
        prompt: Base prompt text
        style: Optional style modifier (realistic, artistic, anime, etc.)
    
    Returns:
        Enhanced prompt
    """
    # Quality modifiers
    quality_terms = "high quality, detailed, professional"
    
    # Style-specific enhancements
    style_modifiers = {
        'realistic': 'photorealistic, 8k, ultra detailed, professional photography',
        'artistic': 'artistic, beautiful, masterpiece, trending on artstation',
        'anime': 'anime style, high quality anime art, detailed',
        'fantasy': 'fantasy art, epic, dramatic lighting, highly detailed',
        'sci-fi': 'sci-fi, futuristic, cinematic, highly detailed',
        'portrait': 'portrait, professional lighting, high detail, sharp focus',
        'landscape': 'landscape photography, beautiful scenery, high detail'
    }
    
    enhanced = prompt.strip()
    
    # Add style modifiers if specified
    if style and style.lower() in style_modifiers:
        enhanced = f"{enhanced}, {style_modifiers[style.lower()]}"
    else:
        enhanced = f"{enhanced}, {quality_terms}"
    
    return enhanced


def get_default_negative_prompt():
    """
    Get default negative prompt to improve quality
    
    Returns:
        Default negative prompt string
    """
    return (
        "low quality, blurry, distorted, deformed, ugly, bad anatomy, "
        "bad proportions, watermark, signature, text, cropped, "
        "out of frame, worst quality, low res, jpeg artifacts"
    )


def sanitize_prompt(prompt, max_length=500):
    """
    Sanitize and validate prompt
    
    Args:
        prompt: Input prompt
        max_length: Maximum allowed length
    
    Returns:
        Sanitized prompt
    """
    # Remove excessive whitespace
    prompt = re.sub(r'\s+', ' ', prompt.strip())
    
    # Truncate if too long
    if len(prompt) > max_length:
        prompt = prompt[:max_length].rsplit(' ', 1)[0]  # Cut at word boundary
        prompt += '...'
    
    return prompt


def extract_style_keywords(prompt):
    """
    Extract style keywords from prompt
    
    Args:
        prompt: Input prompt
    
    Returns:
        List of detected style keywords
    """
    style_keywords = [
        'realistic', 'photorealistic', 'photo',
        'artistic', 'painting', 'oil painting', 'watercolor',
        'anime', 'manga', 'cartoon',
        'fantasy', 'magical', 'epic',
        'sci-fi', 'futuristic', 'cyberpunk',
        'portrait', 'landscape', 'still life',
        'abstract', 'surreal', 'impressionist'
    ]
    
    prompt_lower = prompt.lower()
    detected = []
    
    for keyword in style_keywords:
        if keyword in prompt_lower:
            detected.append(keyword)
    
    return detected


def combine_prompts(main_prompt, additional_prompts):
    """
    Combine multiple prompt components
    
    Args:
        main_prompt: Primary prompt
        additional_prompts: List of additional prompt components
    
    Returns:
        Combined prompt
    """
    components = [main_prompt.strip()]
    
    for additional in additional_prompts:
        if additional and additional.strip():
            components.append(additional.strip())
    
    return ', '.join(components)


def validate_prompt(prompt):
    """
    Validate prompt and return any issues
    
    Args:
        prompt: Prompt to validate
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not prompt or not prompt.strip():
        return False, "Prompt cannot be empty"
    
    if len(prompt.strip()) < 3:
        return False, "Prompt is too short (minimum 3 characters)"
    
    if len(prompt) > 1000:
        return False, "Prompt is too long (maximum 1000 characters)"
    
    return True, None


def suggest_improvements(prompt):
    """
    Suggest improvements to a prompt
    
    Args:
        prompt: Input prompt
    
    Returns:
        List of suggestions
    """
    suggestions = []
    
    prompt_lower = prompt.lower()
    
    # Check for quality modifiers
    quality_terms = ['high quality', 'detailed', 'professional', '8k', '4k']
    has_quality = any(term in prompt_lower for term in quality_terms)
    
    if not has_quality:
        suggestions.append("Add quality modifiers like 'high quality', 'detailed', or 'professional'")
    
    # Check for style specification
    style_terms = ['style', 'art', 'painting', 'photo', 'realistic', 'artistic']
    has_style = any(term in prompt_lower for term in style_terms)
    
    if not has_style:
        suggestions.append("Specify an art style (e.g., 'oil painting', 'photorealistic', 'anime style')")
    
    # Check for lighting/atmosphere
    lighting_terms = ['lighting', 'light', 'sunset', 'golden hour', 'dramatic']
    has_lighting = any(term in prompt_lower for term in lighting_terms)
    
    if not has_lighting:
        suggestions.append("Add lighting description (e.g., 'soft lighting', 'dramatic lighting', 'golden hour')")
    
    return suggestions


if __name__ == '__main__':
    # Test prompt utilities
    test_prompt = "a cat sitting on a table"
    
    print("Original prompt:", test_prompt)
    print("\nEnhanced (realistic):", enhance_prompt(test_prompt, 'realistic'))
    print("\nEnhanced (artistic):", enhance_prompt(test_prompt, 'artistic'))
    print("\nDefault negative prompt:", get_default_negative_prompt())
    print("\nSuggestions:", suggest_improvements(test_prompt))
