#!/usr/bin/env python3
"""
Stable Diffusion Text-to-Image Generation
CPU-optimized implementation using Hugging Face Diffusers
"""

import argparse
import sys
import os
import torch
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
from PIL import Image


def load_pipeline(model_id="runwayml/stable-diffusion-v1-5", device="cpu"):
    """
    Load Stable Diffusion pipeline with CPU optimizations
    
    Args:
        model_id: Hugging Face model identifier
        device: Device to run on ('cpu' or 'cuda')
    
    Returns:
        Configured pipeline
    """
    print(f"Loading Stable Diffusion model: {model_id}")
    print("This may take a few minutes on first run...")
    
    # Load pipeline
    pipe = StableDiffusionPipeline.from_pretrained(
        model_id,
        torch_dtype=torch.float32,  # Use float32 for CPU
        safety_checker=None,  # Disable safety checker for faster inference
        requires_safety_checker=False
    )
    
    # Use DPMSolver for faster inference (fewer steps needed)
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
    
    # Move to device
    pipe = pipe.to(device)
    
    # CPU optimizations
    if device == "cpu":
        print("Applying CPU optimizations...")
        # Enable attention slicing to reduce memory usage
        pipe.enable_attention_slicing(1)
        # Enable VAE slicing for large images
        pipe.enable_vae_slicing()
    
    print(f"Model loaded successfully on {device}")
    
    return pipe


def generate_image(
    pipe,
    prompt,
    negative_prompt="",
    num_inference_steps=25,
    guidance_scale=7.5,
    width=512,
    height=512,
    seed=None
):
    """
    Generate image from text prompt
    
    Args:
        pipe: Stable Diffusion pipeline
        prompt: Text description of desired image
        negative_prompt: Things to avoid in the image
        num_inference_steps: Number of denoising steps (10-50)
        guidance_scale: How closely to follow the prompt (1-20)
        width: Image width in pixels
        height: Image height in pixels
        seed: Random seed for reproducibility
    
    Returns:
        Generated PIL Image
    """
    print(f"\nGenerating image...")
    print(f"Prompt: \"{prompt}\"")
    if negative_prompt:
        print(f"Negative prompt: \"{negative_prompt}\"")
    print(f"Steps: {num_inference_steps}, Guidance: {guidance_scale}, Size: {width}x{height}")
    
    # Set seed for reproducibility
    generator = None
    if seed is not None:
        generator = torch.Generator(device=pipe.device).manual_seed(seed)
        print(f"Seed: {seed}")
    
    # Progress callback
    def progress_callback(step, timestep, latents):
        progress = int((step / num_inference_steps) * 100)
        print(f"Progress: {progress}% | Step {step}/{num_inference_steps}")
    
    # Generate image
    with torch.no_grad():
        result = pipe(
            prompt=prompt,
            negative_prompt=negative_prompt if negative_prompt else None,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            width=width,
            height=height,
            generator=generator,
            callback=progress_callback,
            callback_steps=1
        )
    
    image = result.images[0]
    
    print("Progress: 100%")
    print("Generation complete!")
    
    return image


def main():
    """Main function to parse arguments and generate image"""
    parser = argparse.ArgumentParser(description='Stable Diffusion Text-to-Image Generation')
    parser.add_argument('--prompt', type=str, required=True,
                       help='Text description of the image to generate')
    parser.add_argument('--negative-prompt', type=str, default='',
                       help='Things to avoid in the image')
    parser.add_argument('--output', type=str, required=True,
                       help='Path to save the generated image')
    parser.add_argument('--steps', type=int, default=25,
                       help='Number of inference steps (default: 25)')
    parser.add_argument('--guidance-scale', type=float, default=7.5,
                       help='Guidance scale (default: 7.5)')
    parser.add_argument('--width', type=int, default=512,
                       help='Image width (default: 512)')
    parser.add_argument('--height', type=int, default=512,
                       help='Image height (default: 512)')
    parser.add_argument('--seed', type=int, default=None,
                       help='Random seed for reproducibility')
    parser.add_argument('--model', type=str, 
                       default='runwayml/stable-diffusion-v1-5',
                       help='Model to use (default: runwayml/stable-diffusion-v1-5)')
    parser.add_argument('--device', type=str, default='cpu',
                       choices=['cpu', 'cuda'],
                       help='Device to run on (default: cpu)')
    
    args = parser.parse_args()
    
    # Validate parameters
    if args.steps < 10 or args.steps > 50:
        print("Warning: Steps should be between 10 and 50. Adjusting...")
        args.steps = max(10, min(50, args.steps))
    
    if args.guidance_scale < 1 or args.guidance_scale > 20:
        print("Warning: Guidance scale should be between 1 and 20. Adjusting...")
        args.guidance_scale = max(1, min(20, args.guidance_scale))
    
    # Ensure output directory exists
    output_dir = os.path.dirname(args.output)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    try:
        # Load pipeline
        pipe = load_pipeline(args.model, args.device)
        
        # Generate image
        image = generate_image(
            pipe=pipe,
            prompt=args.prompt,
            negative_prompt=args.negative_prompt,
            num_inference_steps=args.steps,
            guidance_scale=args.guidance_scale,
            width=args.width,
            height=args.height,
            seed=args.seed
        )
        
        # Save image
        image.save(args.output, 'PNG')
        print(f"\n✅ Image saved to {args.output}")
        
    except Exception as e:
        print(f"\n❌ Error during generation: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
