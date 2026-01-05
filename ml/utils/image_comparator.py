"""
Image Comparator
Compares and ranks generated images using CLIP for semantic similarity
"""

import sys
import json
import os
from pathlib import Path
from PIL import Image
import torch

# Check if transformers is available
try:
    from transformers import CLIPProcessor, CLIPModel
    CLIP_AVAILABLE = True
except ImportError:
    CLIP_AVAILABLE = False
    print("Warning: transformers not installed. Install with: pip install transformers", file=sys.stderr)


class ImageComparator:
    """
    Compares images using CLIP model for semantic similarity
    """
    
    def __init__(self):
        self.model = None
        self.processor = None
        self.device = "cpu"
        
        if CLIP_AVAILABLE:
            try:
                print("Loading CLIP model...", file=sys.stderr)
                self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
                self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
                self.model.to(self.device)
                self.model.eval()
                print("CLIP model loaded successfully", file=sys.stderr)
            except Exception as e:
                print(f"Failed to load CLIP model: {e}", file=sys.stderr)
                self.model = None
    
    def compare_images(self, image_paths, prompt):
        """
        Compares images and ranks them based on semantic similarity to prompt
        
        Args:
            image_paths (list): List of image file paths
            prompt (str): The text prompt to compare against
            
        Returns:
            list: Ranked results with scores
        """
        if not self.model:
            # Fallback to simple ranking if CLIP not available
            return self._simple_ranking(image_paths)
        
        results = []
        
        try:
            # Process prompt
            text_inputs = self.processor(
                text=[prompt],
                return_tensors="pt",
                padding=True
            ).to(self.device)
            
            # Process each image
            for img_path in image_paths:
                try:
                    # Load image
                    image = Image.open(img_path).convert("RGB")
                    
                    # Process image
                    image_inputs = self.processor(
                        images=image,
                        return_tensors="pt"
                    ).to(self.device)
                    
                    # Get embeddings
                    with torch.no_grad():
                        image_features = self.model.get_image_features(**image_inputs)
                        text_features = self.model.get_text_features(**text_inputs)
                        
                        # Normalize features
                        image_features = image_features / image_features.norm(dim=-1, keepdim=True)
                        text_features = text_features / text_features.norm(dim=-1, keepdim=True)
                        
                        # Calculate similarity
                        similarity = (image_features @ text_features.T).item()
                    
                    # Convert to 0-1 score
                    score = (similarity + 1) / 2
                    
                    results.append({
                        "imagePath": img_path,
                        "score": round(score, 3),
                        "similarity": round(similarity, 3)
                    })
                    
                except Exception as e:
                    print(f"Error processing {img_path}: {e}", file=sys.stderr)
                    results.append({
                        "imagePath": img_path,
                        "score": 0.5,
                        "error": str(e)
                    })
            
            # Sort by score (highest first)
            results.sort(key=lambda x: x.get('score', 0), reverse=True)
            
        except Exception as e:
            print(f"Comparison error: {e}", file=sys.stderr)
            return self._simple_ranking(image_paths)
        
        return results
    
    def _simple_ranking(self, image_paths):
        """
        Simple fallback ranking when CLIP is not available
        Just assigns equal scores
        """
        return [
            {
                "imagePath": path,
                "score": 0.5,
                "method": "fallback"
            }
            for path in image_paths
        ]


def compare_images(image_paths, prompt):
    """
    Standalone function to compare images
    
    Args:
        image_paths (list): List of image file paths
        prompt (str): The text prompt
        
    Returns:
        list: Ranked results
    """
    comparator = ImageComparator()
    return comparator.compare_images(image_paths, prompt)


if __name__ == "__main__":
    # Test the image comparator
    if len(sys.argv) > 1:
        config = json.loads(sys.argv[1])
        image_paths = config.get('images', [])
        prompt = config.get('prompt', '')
    else:
        # Default test
        print("Usage: python image_comparator.py '{\"images\": [\"path1.png\", \"path2.png\"], \"prompt\": \"description\"}'")
        sys.exit(1)
    
    results = compare_images(image_paths, prompt)
    print(json.dumps(results, indent=2))
