#!/usr/bin/env python3
"""
Mock Diffusion Generator for Development
Creates placeholder images without requiring large models
"""

import argparse
import sys
import os
from PIL import Image, ImageDraw, ImageFont
import random
import time


def generate_mock_image(prompt, width=512, height=512, output_path=None):
    """
    Generate a mock image with the prompt text
    
    Args:
        prompt: Text prompt
        width: Image width
        height: Image height
        output_path: Where to save the image
    
    Returns:
        PIL Image
    """
    print(f"🎨 Generating mock image for: '{prompt}'", file=sys.stderr)
    print(f"📐 Size: {width}x{height}", file=sys.stderr)
    
    # Create a colorful gradient background
    image = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(image)
    
    # Generate random gradient colors based on prompt
    random.seed(hash(prompt) % 10000)
    color1 = (random.randint(50, 200), random.randint(50, 200), random.randint(50, 200))
    color2 = (random.randint(50, 200), random.randint(50, 200), random.randint(50, 200))
    
    # Draw gradient
    for y in range(height):
        ratio = y / height
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
        draw.rectangle([(0, y), (width, y + 1)], fill=(r, g, b))
    
    # Add some decorative elements
    for _ in range(20):
        x = random.randint(0, width)
        y = random.randint(0, height)
        size = random.randint(10, 50)
        color = (random.randint(100, 255), random.randint(100, 255), random.randint(100, 255))
        draw.ellipse([(x, y), (x + size, y + size)], fill=color, outline=None)
    
    # Add text overlay
    try:
        # Try to use a nice font
        font_size = 24
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    # Add "MOCK" watermark
    draw.text((10, 10), "🎨 MOCK GENERATION", fill=(255, 255, 255), font=font)
    
    # Add prompt text (wrapped)
    max_width = width - 40
    words = prompt.split()
    lines = []
    current_line = []
    
    for word in words:
        current_line.append(word)
        test_line = ' '.join(current_line)
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] - bbox[0] > max_width:
            if len(current_line) > 1:
                current_line.pop()
                lines.append(' '.join(current_line))
                current_line = [word]
            else:
                lines.append(word)
                current_line = []
    
    if current_line:
        lines.append(' '.join(current_line))
    
    # Draw wrapped text
    y_text = height // 2 - (len(lines) * 30) // 2
    for line in lines[:5]:  # Max 5 lines
        bbox = draw.textbbox((0, 0), line, font=font)
        text_width = bbox[2] - bbox[0]
        x_text = (width - text_width) // 2
        # Draw text with shadow
        draw.text((x_text + 2, y_text + 2), line, fill=(0, 0, 0), font=font)
        draw.text((x_text, y_text), line, fill=(255, 255, 255), font=font)
        y_text += 35
    
    # Simulate processing time
    time.sleep(random.uniform(1, 3))
    
    # Save if output path provided
    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        image.save(output_path, 'PNG')
        print(f"✅ Mock image saved to: {output_path}", file=sys.stderr)
    
    return image


def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Mock Diffusion Generator')
    parser.add_argument('--prompt', type=str, required=True, help='Text prompt')
    parser.add_argument('--output', type=str, required=True, help='Output path')
    parser.add_argument('--steps', type=int, default=20, help='Ignored (for compatibility)')
    parser.add_argument('--guidance-scale', type=float, default=7.5, help='Ignored (for compatibility)')
    parser.add_argument('--width', type=int, default=512, help='Image width')
    parser.add_argument('--height', type=int, default=512, help='Image height')
    parser.add_argument('--seed', type=int, default=None, help='Random seed')
    parser.add_argument('--model', type=str, default='mock', help='Ignored (for compatibility)')
    parser.add_argument('--device', type=str, default='cpu', help='Ignored (for compatibility)')
    
    args = parser.parse_args()
    
    try:
        generate_mock_image(
            prompt=args.prompt,
            width=args.width,
            height=args.height,
            output_path=args.output
        )
        print(f"✅ Mock generation complete!", file=sys.stderr)
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
