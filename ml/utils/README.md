# Utils Module

Utility functions for machine learning operations.

## Files

- `image_utils.py` - Image loading, preprocessing, and conversion utilities
- `model_loader.py` - Model loading and feature extraction utilities

## Image Utils

Functions for working with images in PyTorch:
- `load_image()` - Load and resize images
- `normalize_batch()` - Normalize with ImageNet statistics
- `denormalize_batch()` - Reverse normalization
- `tensor_to_image()` - Convert tensors to PIL Images
- `save_image()` - Save tensors as image files

## Model Loader

Functions for loading and using VGG19:
- `load_vgg19()` - Load pretrained VGG19 model
- `get_features()` - Extract features from specific layers
- `gram_matrix()` - Calculate Gram matrix for style representation
- `VGG19FeatureExtractor` - Wrapper class for feature extraction
