"""
Utility functions for image processing in Neural Style Transfer
"""

import torch
from PIL import Image
import torchvision.transforms as transforms
import numpy as np

# ImageNet normalization values (VGG19 was trained on ImageNet)
IMAGENET_MEAN = torch.tensor([0.485, 0.456, 0.406]).view(-1, 1, 1)
IMAGENET_STD = torch.tensor([0.229, 0.224, 0.225]).view(-1, 1, 1)


def load_image(image_path, max_size=512, shape=None):
    """
    Load an image and convert it to a tensor
    
    Args:
        image_path: Path to the image file
        max_size: Maximum size for the longest dimension
        shape: Optional tuple (height, width) to resize to
    
    Returns:
        Tensor of shape (1, 3, H, W)
    """
    image = Image.open(image_path).convert('RGB')
    
    if shape is not None:
        size = shape
    else:
        # Resize while maintaining aspect ratio
        size = get_resize_dimensions(image.size, max_size)
    
    # Transform pipeline
    transform = transforms.Compose([
        transforms.Resize(size),
        transforms.ToTensor()
    ])
    
    # Add batch dimension and return
    image_tensor = transform(image).unsqueeze(0)
    
    return image_tensor


def get_resize_dimensions(original_size, max_size):
    """
    Calculate new dimensions while preserving aspect ratio
    
    Args:
        original_size: Tuple of (width, height)
        max_size: Maximum size for the longest dimension
    
    Returns:
        Tuple of (height, width) for resizing
    """
    width, height = original_size
    
    if max(width, height) > max_size:
        if width > height:
            new_width = max_size
            new_height = int(height * (max_size / width))
        else:
            new_height = max_size
            new_width = int(width * (max_size / height))
    else:
        new_width, new_height = width, height
    
    return (new_height, new_width)


def normalize_batch(batch):
    """
    Normalize a batch of images using ImageNet statistics
    
    Args:
        batch: Tensor of shape (N, 3, H, W) with values in [0, 1]
    
    Returns:
        Normalized tensor
    """
    mean = IMAGENET_MEAN.to(batch.device)
    std = IMAGENET_STD.to(batch.device)
    return (batch - mean) / std


def denormalize_batch(batch):
    """
    Denormalize a batch of images (reverse ImageNet normalization)
    
    Args:
        batch: Normalized tensor of shape (N, 3, H, W)
    
    Returns:
        Denormalized tensor with values in [0, 1]
    """
    mean = IMAGENET_MEAN.to(batch.device)
    std = IMAGENET_STD.to(batch.device)
    return batch * std + mean


def tensor_to_image(tensor):
    """
    Convert a tensor to a PIL Image
    
    Args:
        tensor: Tensor of shape (1, 3, H, W) or (3, H, W)
    
    Returns:
        PIL Image
    """
    # Remove batch dimension if present
    if tensor.dim() == 4:
        tensor = tensor.squeeze(0)
    
    # Denormalize if needed (check if values are in normalized range)
    if tensor.min() < 0:
        tensor = denormalize_batch(tensor.unsqueeze(0)).squeeze(0)
    
    # Clamp values to [0, 1]
    tensor = torch.clamp(tensor, 0, 1)
    
    # Convert to numpy and transpose to (H, W, C)
    image_np = tensor.cpu().detach().numpy()
    image_np = np.transpose(image_np, (1, 2, 0))
    
    # Convert to uint8
    image_np = (image_np * 255).astype(np.uint8)
    
    return Image.fromarray(image_np)


def save_image(tensor, output_path, quality=95):
    """
    Save a tensor as an image file
    
    Args:
        tensor: Tensor of shape (1, 3, H, W) or (3, H, W)
        output_path: Path to save the image
        quality: JPEG quality (1-100)
    """
    image = tensor_to_image(tensor)
    
    # Save with high quality
    if output_path.lower().endswith('.jpg') or output_path.lower().endswith('.jpeg'):
        image.save(output_path, 'JPEG', quality=quality)
    else:
        image.save(output_path, 'PNG')
    
    print(f"Image saved to {output_path}")


def match_size(content_tensor, style_tensor):
    """
    Resize style tensor to match content tensor dimensions
    
    Args:
        content_tensor: Content image tensor
        style_tensor: Style image tensor
    
    Returns:
        Resized style tensor
    """
    _, _, h, w = content_tensor.shape
    
    transform = transforms.Compose([
        transforms.Resize((h, w))
    ])
    
    # Convert to PIL, resize, and convert back
    style_image = tensor_to_image(style_tensor)
    resized = transform(style_image)
    
    # Convert back to tensor
    return transforms.ToTensor()(resized).unsqueeze(0)
