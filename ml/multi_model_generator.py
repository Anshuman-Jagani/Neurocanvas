"""
Multi-Model Generator
Orchestrates multiple AI models for a single prompt
"""

import sys
import json
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))


def generate_with_models(prompt, models, params=None):
    """
    Orchestrates multiple models for a single prompt
    
    Args:
        prompt (str): The prompt to generate from
        models (list): List of model names ['style-transfer', 'diffusion']
        params (dict): Generation parameters
        
    Returns:
        dict: Results from each model
        {
            "results": [
                {
                    "model": "diffusion",
                    "imageUrl": "/generated/image.png",
                    "metadata": {...},
                    "success": True
                },
                ...
            ]
        }
    """
    if params is None:
        params = {}
    
    results = []
    
    for model in models:
        try:
            if model == 'diffusion':
                result = _generate_diffusion(prompt, params)
                results.append({
                    "model": "diffusion",
                    "imageUrl": result.get("imageUrl"),
                    "metadata": result.get("metadata", {}),
                    "success": True
                })
            elif model == 'style-transfer':
                result = _generate_style_transfer(prompt, params)
                results.append({
                    "model": "style-transfer",
                    "imageUrl": result.get("imageUrl"),
                    "metadata": result.get("metadata", {}),
                    "success": True
                })
            else:
                results.append({
                    "model": model,
                    "error": f"Unknown model: {model}",
                    "success": False
                })
        except Exception as e:
            results.append({
                "model": model,
                "error": str(e),
                "success": False
            })
    
    return {"results": results}


def _generate_diffusion(prompt, params):
    """
    Generate image using diffusion model
    """
    import subprocess
    import time
    import uuid
    
    steps = params.get('steps', 20)
    guidance = params.get('guidance', 7.5)
    width = params.get('width', 512)
    height = params.get('height', 512)
    output_dir = params.get('outputPath', 'data/generated')
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate unique filename
    job_id = str(uuid.uuid4())[:8]
    timestamp = int(time.time())
    output_filename = f"diffusion_{job_id}_{timestamp}.png"
    output_path = os.path.join(output_dir, output_filename)
    
    # Path to mock diffusion (lightweight, no model download needed)
    # To use real Stable Diffusion, change to: 'diffusion/stable_diffusion.py'
    script_path = os.path.join(os.path.dirname(__file__), 'diffusion', 'mock_diffusion.py')
    
    # Use virtual environment Python if available
    venv_python = os.path.join(os.path.dirname(__file__), '..', 'venv', 'bin', 'python3')
    python_cmd = venv_python if os.path.exists(venv_python) else 'python3'
    
    # Run the diffusion script
    cmd = [
        python_cmd,
        script_path,
        '--prompt', prompt,
        '--output', output_path,
        '--steps', str(steps),
        '--guidance-scale', str(guidance),
        '--width', str(width),
        '--height', str(height)
    ]
    
    try:
        # Increased timeout to 20 minutes to allow for model download on first run
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=1200)
        
        if result.returncode != 0:
            error_msg = result.stderr or "Unknown error"
            # Check for common errors
            if "No module named" in error_msg:
                raise Exception(f"Missing Python dependency: {error_msg}")
            elif "out of memory" in error_msg.lower():
                raise Exception("Out of memory. Try reducing image size or steps.")
            elif "model" in error_msg.lower() and "not found" in error_msg.lower():
                raise Exception("Model not downloaded. Run: python ml/utils/model_downloader.py")
            else:
                raise Exception(f"Diffusion generation failed: {error_msg}")
        
        # Check if file was created
        if not os.path.exists(output_path):
            raise Exception("Output image was not created")
        
        # Return result in expected format
        return {
            "imageUrl": f"/generated/{output_filename}",
            "metadata": {
                "model": "stable-diffusion-2-1-base",
                "steps": steps,
                "guidance": guidance,
                "width": width,
                "height": height
            }
        }
    except subprocess.TimeoutExpired:
        raise Exception("Diffusion generation timed out (20 minutes). Model may still be downloading.")
    except Exception as e:
        raise Exception(f"Diffusion generation error: {str(e)}")


def _generate_style_transfer(prompt, params):
    """
    Generate image using style transfer
    Note: Style transfer requires a base image
    """
    # Style transfer needs a base image
    # For now, we'll return an error if no base image is provided
    base_image = params.get('baseImage')
    
    if not base_image:
        raise ValueError("Style transfer requires a base image")
    
    from style_transfer.style_transfer import apply_style_transfer
    
    style = params.get('style', 'starry_night')
    output_dir = params.get('outputPath', 'data/generated')
    
    result = apply_style_transfer(
        content_image_path=base_image,
        style_name=style,
        output_dir=output_dir
    )
    
    return result


if __name__ == "__main__":
    # Test the multi-model generator
    if len(sys.argv) > 1:
        # Read from command line arguments
        config = json.loads(sys.argv[1])
        prompt = config.get('prompt')
        models = config.get('models', ['diffusion'])
        params = config.get('params', {})
    else:
        # Default test
        prompt = "A serene mountain landscape at sunset"
        models = ['diffusion']
        params = {
            'steps': 20,
            'guidance': 7.5,
            'width': 512,
            'height': 512
        }
    
    print(f"Generating with models: {models}", file=sys.stderr)
    print(f"Prompt: {prompt}", file=sys.stderr)
    
    results = generate_with_models(prompt, models, params)
    print(json.dumps(results, indent=2))
