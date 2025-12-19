#!/usr/bin/env python3
"""
Neural Style Transfer using VGG19
Implements the algorithm from Gatys et al. (2016)
"""

import argparse
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import torch
import torch.optim as optim
from utils.image_utils import load_image, save_image, normalize_batch, denormalize_batch
from utils.model_loader import VGG19FeatureExtractor, gram_matrix


def content_loss(target_features, content_features):
    """
    Calculate content loss (MSE between feature maps)
    """
    loss = torch.mean((target_features - content_features) ** 2)
    return loss


def style_loss(target_grams, style_grams, style_weights=None):
    """
    Calculate style loss (MSE between Gram matrices)
    """
    if style_weights is None:
        # Equal weights for all layers
        style_weights = {layer: 1.0 for layer in style_grams.keys()}
    
    loss = 0
    for layer in style_grams.keys():
        target_gram = target_grams[layer]
        style_gram = style_grams[layer]
        layer_loss = torch.mean((target_gram - style_gram) ** 2)
        loss += style_weights[layer] * layer_loss
    
    return loss


def total_variation_loss(image):
    """
    Calculate total variation loss for smoothness
    Helps reduce noise in the generated image
    """
    # Calculate differences in horizontal and vertical directions
    diff_i = torch.mean(torch.abs(image[:, :, :, :-1] - image[:, :, :, 1:]))
    diff_j = torch.mean(torch.abs(image[:, :, :-1, :] - image[:, :, 1:, :]))
    
    return diff_i + diff_j


def run_style_transfer(content_path, style_path, output_path, 
                      iterations=300, content_weight=1, style_weight=1e6,
                      tv_weight=1e-3, image_size=512, device='cpu'):
    """
    Run neural style transfer
    
    Args:
        content_path: Path to content image
        style_path: Path to style image
        output_path: Path to save output image
        iterations: Number of optimization iterations
        content_weight: Weight for content loss
        style_weight: Weight for style loss
        tv_weight: Weight for total variation loss
        image_size: Maximum size for images
        device: Device to run on ('cpu' or 'cuda')
    """
    print(f"Starting Neural Style Transfer")
    print(f"Content: {content_path}")
    print(f"Style: {style_path}")
    print(f"Output: {output_path}")
    print(f"Iterations: {iterations}")
    print(f"Device: {device}")
    print("-" * 50)
    
    # Load images
    print("Loading images...")
    content_img = load_image(content_path, max_size=image_size).to(device)
    style_img = load_image(style_path, max_size=image_size, 
                          shape=content_img.shape[-2:]).to(device)
    
    print(f"Content image shape: {content_img.shape}")
    print(f"Style image shape: {style_img.shape}")
    
    # Normalize images
    content_img = normalize_batch(content_img)
    style_img = normalize_batch(style_img)
    
    # Initialize target image (start with content image)
    target_img = content_img.clone().requires_grad_(True)
    
    # Load VGG19 feature extractor
    print("Loading VGG19 model...")
    feature_extractor = VGG19FeatureExtractor(device=device)
    
    # Extract features
    print("Extracting features...")
    with torch.no_grad():
        content_features = feature_extractor.get_content_features(content_img)
        style_grams = feature_extractor.get_style_grams(style_img)
    
    # Use LBFGS optimizer (works better for style transfer)
    optimizer = optim.LBFGS([target_img], max_iter=20)
    
    print("Starting optimization...")
    print("-" * 50)
    
    iteration = [0]  # Use list to modify in closure
    
    def closure():
        """Optimization closure function"""
        optimizer.zero_grad()
        
        # Clamp target image to valid range
        target_img.data.clamp_(
            (0 - IMAGENET_MEAN.to(device)) / IMAGENET_STD.to(device),
            (1 - IMAGENET_MEAN.to(device)) / IMAGENET_STD.to(device)
        )
        
        # Extract features from target image
        target_features_all = feature_extractor.get_all_features(target_img)
        
        # Calculate content loss
        target_content = {k: v for k, v in target_features_all.items() 
                         if k in feature_extractor.content_layers}
        c_loss = content_loss(target_content['conv4_2'], 
                             content_features['conv4_2'])
        
        # Calculate style loss
        target_style = {k: v for k, v in target_features_all.items() 
                       if k in feature_extractor.style_layers}
        target_grams = {layer: gram_matrix(features) 
                       for layer, features in target_style.items()}
        s_loss = style_loss(target_grams, style_grams)
        
        # Calculate total variation loss
        tv_loss = total_variation_loss(target_img)
        
        # Total loss
        total_loss = (content_weight * c_loss + 
                     style_weight * s_loss + 
                     tv_weight * tv_loss)
        
        total_loss.backward()
        
        # Print progress
        iteration[0] += 1
        if iteration[0] % 10 == 0 or iteration[0] == 1:
            progress = int((iteration[0] / iterations) * 100)
            print(f"Iteration {iteration[0]}/{iterations} | "
                  f"Progress: {progress}% | "
                  f"Total Loss: {total_loss.item():.4f} | "
                  f"Content: {c_loss.item():.4f} | "
                  f"Style: {s_loss.item():.4f}")
        
        return total_loss
    
    # Import ImageNet constants
    from utils.image_utils import IMAGENET_MEAN, IMAGENET_STD
    
    # Run optimization
    num_steps = iterations // 20  # LBFGS does ~20 iterations per step
    for step in range(num_steps):
        optimizer.step(closure)
        
        # Early stopping if we've done enough iterations
        if iteration[0] >= iterations:
            break
    
    # Final cleanup
    print("-" * 50)
    print("Optimization complete!")
    
    # Denormalize and save result
    print("Saving result...")
    final_img = denormalize_batch(target_img)
    save_image(final_img, output_path)
    
    print(f"✅ Style transfer complete! Saved to {output_path}")
    print(f"Progress: 100%")


def main():
    """Main function to parse arguments and run style transfer"""
    parser = argparse.ArgumentParser(description='Neural Style Transfer')
    parser.add_argument('--content', type=str, required=True,
                       help='Path to content image')
    parser.add_argument('--style', type=str, required=True,
                       help='Path to style image')
    parser.add_argument('--output', type=str, required=True,
                       help='Path to save output image')
    parser.add_argument('--iterations', type=int, default=300,
                       help='Number of optimization iterations (default: 300)')
    parser.add_argument('--content-weight', type=float, default=1,
                       help='Weight for content loss (default: 1)')
    parser.add_argument('--style-weight', type=float, default=1e6,
                       help='Weight for style loss (default: 1e6)')
    parser.add_argument('--tv-weight', type=float, default=1e-3,
                       help='Weight for total variation loss (default: 1e-3)')
    parser.add_argument('--size', type=int, default=512,
                       help='Maximum image size (default: 512)')
    parser.add_argument('--device', type=str, default='cpu',
                       choices=['cpu', 'cuda'],
                       help='Device to run on (default: cpu)')
    
    args = parser.parse_args()
    
    # Check if files exist
    if not os.path.exists(args.content):
        print(f"Error: Content image not found: {args.content}")
        sys.exit(1)
    
    if not os.path.exists(args.style):
        print(f"Error: Style image not found: {args.style}")
        sys.exit(1)
    
    # Create output directory if it doesn't exist
    output_dir = os.path.dirname(args.output)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    # Run style transfer
    try:
        run_style_transfer(
            content_path=args.content,
            style_path=args.style,
            output_path=args.output,
            iterations=args.iterations,
            content_weight=args.content_weight,
            style_weight=args.style_weight,
            tv_weight=args.tv_weight,
            image_size=args.size,
            device=args.device
        )
    except Exception as e:
        print(f"Error during style transfer: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
