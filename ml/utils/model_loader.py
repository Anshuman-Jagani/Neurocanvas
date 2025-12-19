"""
Model loading utilities for Neural Style Transfer
"""

import torch
import torchvision.models as models
from collections import namedtuple


def load_vgg19(device='cpu'):
    """
    Load pretrained VGG19 model for feature extraction
    
    Args:
        device: Device to load the model on ('cpu' or 'cuda')
    
    Returns:
        VGG19 features model
    """
    print("Loading VGG19 model...")
    
    # Load pretrained VGG19
    vgg = models.vgg19(pretrained=True).features
    
    # Freeze all parameters (we don't train the model)
    for param in vgg.parameters():
        param.requires_grad_(False)
    
    # Move to device and set to evaluation mode
    vgg = vgg.to(device).eval()
    
    print(f"VGG19 model loaded successfully on {device}")
    
    return vgg


def get_features(image, model, layers=None):
    """
    Extract features from specific layers of VGG19
    
    Args:
        image: Input image tensor (normalized)
        model: VGG19 model
        layers: Dictionary mapping layer names to VGG layer indices
                If None, uses default layers for style transfer
    
    Returns:
        Dictionary of features from specified layers
    """
    if layers is None:
        # Default layers for neural style transfer
        layers = {
            'conv1_1': 0,
            'conv2_1': 5,
            'conv3_1': 10,
            'conv4_1': 19,
            'conv4_2': 21,  # Content layer
            'conv5_1': 28
        }
    
    features = {}
    x = image
    
    # Get features from each layer
    for name, layer_idx in layers.items():
        # Run through layers up to the target layer
        for i in range(len(model)):
            x = model[i](x)
            if i == layer_idx:
                features[name] = x
                break
        
        # Reset x for next layer extraction
        if name != list(layers.keys())[-1]:
            x = image
    
    return features


def gram_matrix(tensor):
    """
    Calculate Gram matrix for style representation
    
    The Gram matrix captures the correlations between feature maps,
    which represent the style of an image.
    
    Args:
        tensor: Feature tensor of shape (batch, channels, height, width)
    
    Returns:
        Gram matrix of shape (batch, channels, channels)
    """
    batch, channels, height, width = tensor.size()
    
    # Reshape to (batch, channels, height*width)
    features = tensor.view(batch, channels, height * width)
    
    # Calculate Gram matrix: features @ features^T
    gram = torch.bmm(features, features.transpose(1, 2))
    
    # Normalize by number of elements
    gram = gram / (channels * height * width)
    
    return gram


class VGG19FeatureExtractor:
    """
    Wrapper class for VGG19 feature extraction
    """
    
    def __init__(self, device='cpu'):
        self.device = device
        self.model = load_vgg19(device)
        
        # Define layer indices for feature extraction
        self.content_layers = {'conv4_2': 21}
        self.style_layers = {
            'conv1_1': 0,
            'conv2_1': 5,
            'conv3_1': 10,
            'conv4_1': 19,
            'conv5_1': 28
        }
        
        # Combine all layers
        self.all_layers = {**self.content_layers, **self.style_layers}
    
    def get_content_features(self, image):
        """Extract content features from image"""
        features = get_features(image, self.model, self.content_layers)
        return features
    
    def get_style_features(self, image):
        """Extract style features from image"""
        features = get_features(image, self.model, self.style_layers)
        return features
    
    def get_all_features(self, image):
        """Extract both content and style features"""
        features = get_features(image, self.model, self.all_layers)
        return features
    
    def get_style_grams(self, image):
        """Extract style features and compute Gram matrices"""
        style_features = self.get_style_features(image)
        style_grams = {layer: gram_matrix(features) 
                      for layer, features in style_features.items()}
        return style_grams


def verify_model():
    """
    Verify that VGG19 can be loaded and used
    
    Returns:
        True if successful, False otherwise
    """
    try:
        device = torch.device('cpu')
        model = load_vgg19(device)
        
        # Create a dummy input
        dummy_input = torch.randn(1, 3, 224, 224).to(device)
        
        # Try a forward pass
        with torch.no_grad():
            output = model(dummy_input)
        
        print(f"Model verification successful. Output shape: {output.shape}")
        return True
        
    except Exception as e:
        print(f"Model verification failed: {e}")
        return False


if __name__ == '__main__':
    # Test model loading
    verify_model()
