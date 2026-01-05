"""
Model Selector
Intelligently selects the best AI model(s) based on prompt analysis
"""

def select_models(prompt_analysis):
    """
    Analyzes prompt to determine best model(s)
    
    Args:
        prompt_analysis (dict): NLP analysis of the prompt containing:
            - keywords: dict with styles, moods, colors, lighting, textures, compositions
            - artisticConcepts: list of detected concepts
            - mood: detected mood
            - sentiment: sentiment analysis
            
    Returns:
        list: List of recommended models with confidence scores
        [
            {"model": "style-transfer", "confidence": 0.8, "reason": "..."},
            {"model": "diffusion", "confidence": 0.6, "reason": "..."}
        ]
    """
    recommendations = []
    
    # Extract features
    keywords = prompt_analysis.get('keywords', {})
    styles = keywords.get('styles', [])
    artistic_concepts = prompt_analysis.get('artisticConcepts', [])
    mood = prompt_analysis.get('mood', '')
    prompt_text = prompt_analysis.get('prompt', '')
    
    # Style Transfer scoring
    style_transfer_score = 0.0
    style_transfer_reasons = []
    
    # Check for specific artistic style references
    style_keywords = [
        'van gogh', 'monet', 'picasso', 'kandinsky', 'hokusai',
        'impressionist', 'cubist', 'surreal', 'abstract expressionism',
        'pop art', 'renaissance', 'baroque', 'art nouveau'
    ]
    
    has_style_reference = any(
        any(keyword in style.lower() for keyword in style_keywords)
        for style in styles
    )
    
    if has_style_reference:
        style_transfer_score += 0.4
        style_transfer_reasons.append("Specific artistic style detected")
    
    if len(styles) > 0:
        style_transfer_score += 0.2
        style_transfer_reasons.append("Style keywords present")
    
    if 'abstract' in [c.lower() for c in artistic_concepts]:
        style_transfer_score += 0.1
        style_transfer_reasons.append("Abstract concept detected")
    
    # Diffusion Model scoring
    diffusion_score = 0.0
    diffusion_reasons = []
    
    # Check for detailed descriptions (diffusion works well with detail)
    prompt_length = len(prompt_text)
    if prompt_length > 50:
        diffusion_score += 0.2
        diffusion_reasons.append("Detailed description")
    if prompt_length > 100:
        diffusion_score += 0.1
        diffusion_reasons.append("Very detailed description")
    
    # Check for concepts that work well with diffusion
    diffusion_concepts = ['portrait', 'landscape', 'fantasy', 'sci-fi', 'character', 'nature']
    has_diffusion_concept = any(
        concept.lower() in [c.lower() for c in artistic_concepts]
        for concept in diffusion_concepts
    )
    
    if has_diffusion_concept:
        diffusion_score += 0.3
        diffusion_reasons.append("Suitable concept for text-to-image")
    
    # Lighting, colors, and textures favor diffusion
    if keywords.get('lighting'):
        diffusion_score += 0.1
        diffusion_reasons.append("Lighting details specified")
    
    if keywords.get('colors'):
        diffusion_score += 0.1
        diffusion_reasons.append("Color palette specified")
    
    if keywords.get('textures'):
        diffusion_score += 0.1
        diffusion_reasons.append("Texture details specified")
    
    # Base scores to ensure both models are considered
    style_transfer_score += 0.3
    diffusion_score += 0.3
    
    # Normalize scores
    max_score = max(style_transfer_score, diffusion_score)
    if max_score > 0:
        style_transfer_score = min(style_transfer_score / max_score, 1.0)
        diffusion_score = min(diffusion_score / max_score, 1.0)
    
    # Add recommendations if score is above threshold
    threshold = 0.5
    
    if style_transfer_score >= threshold:
        recommendations.append({
            "model": "style-transfer",
            "confidence": round(style_transfer_score, 2),
            "reason": "; ".join(style_transfer_reasons) if style_transfer_reasons else "Default recommendation"
        })
    
    if diffusion_score >= threshold:
        recommendations.append({
            "model": "diffusion",
            "confidence": round(diffusion_score, 2),
            "reason": "; ".join(diffusion_reasons) if diffusion_reasons else "Default recommendation"
        })
    
    # If no strong recommendations, suggest both
    if len(recommendations) == 0:
        recommendations = [
            {
                "model": "style-transfer",
                "confidence": 0.5,
                "reason": "Default recommendation"
            },
            {
                "model": "diffusion",
                "confidence": 0.5,
                "reason": "Default recommendation"
            }
        ]
    
    # Sort by confidence
    recommendations.sort(key=lambda x: x['confidence'], reverse=True)
    
    return recommendations


if __name__ == "__main__":
    # Test the model selector
    import json
    import sys
    
    # Example prompt analysis
    test_analysis = {
        "prompt": "A serene mountain landscape at sunset with purple and orange skies in Van Gogh style",
        "keywords": {
            "styles": ["Van Gogh"],
            "moods": ["serene"],
            "colors": ["purple", "orange"],
            "lighting": ["sunset"]
        },
        "artisticConcepts": ["landscape", "nature"],
        "mood": "peaceful"
    }
    
    if len(sys.argv) > 1:
        # Read from stdin
        test_analysis = json.loads(sys.argv[1])
    
    recommendations = select_models(test_analysis)
    print(json.dumps(recommendations, indent=2))
