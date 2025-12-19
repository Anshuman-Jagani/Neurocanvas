# Neural Style Transfer Module

This module implements Neural Style Transfer using a pretrained VGG19 model.

## Files

- `neural_style_transfer.py` - Main script for running style transfer
- `../utils/image_utils.py` - Image processing utilities
- `../utils/model_loader.py` - VGG19 model loading and feature extraction

## Usage

```bash
python neural_style_transfer.py \
  --content /path/to/content.jpg \
  --style /path/to/style.jpg \
  --output /path/to/output.png \
  --iterations 300 \
  --size 512
```

## Parameters

- `--content`: Path to content image
- `--style`: Path to style image
- `--output`: Path to save output image
- `--iterations`: Number of optimization iterations (default: 300)
- `--content-weight`: Weight for content loss (default: 1)
- `--style-weight`: Weight for style loss (default: 1e6)
- `--tv-weight`: Weight for total variation loss (default: 1e-3)
- `--size`: Maximum image size (default: 512)
- `--device`: Device to run on - 'cpu' or 'cuda' (default: cpu)

## How it Works

1. Load content and style images
2. Extract features using VGG19 (pretrained on ImageNet)
3. Calculate content loss from conv4_2 layer
4. Calculate style loss using Gram matrices from multiple layers
5. Optimize target image using LBFGS to minimize combined loss
6. Save the stylized result
