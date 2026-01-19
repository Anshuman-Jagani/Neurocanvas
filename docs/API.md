# NeuroCanvas API Documentation

## Base URL
```
Development: http://localhost:5000
Production: https://api.yourdomain.com
```

## Authentication
Currently, the API does not require authentication. Future versions will implement JWT-based authentication.

## Rate Limiting
- **General endpoints**: 100 requests per 15 minutes per IP
- **Generation endpoints**: 20 requests per hour per IP

## Common Headers
```http
Content-Type: application/json
Accept: application/json
```

---

## Health Check

### GET /api/health
Check API health status and system metrics.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-19T10:30:00.000Z",
  "uptime": 3600.5,
  "memory": {
    "rss": 123456789,
    "heapTotal": 98765432,
    "heapUsed": 87654321,
    "external": 1234567
  }
}
```

---

## NLP Endpoints

### POST /api/nlp/analyze
Analyze a text prompt for sentiment, keywords, and artistic concepts.

**Request:**
```json
{
  "prompt": "A beautiful sunset over mountains"
}
```

**Response:**
```json
{
  "sentiment": {
    "label": "positive",
    "score": 0.95
  },
  "keywords": {
    "styles": ["landscape", "realistic"],
    "moods": ["peaceful", "serene"],
    "colors": ["warm", "orange", "purple"],
    "lighting": ["sunset", "golden hour"],
    "textures": ["smooth"],
    "compositions": ["panoramic"]
  },
  "artistic_concepts": ["nature", "landscape"],
  "color_palette": ["#FF6B35", "#F7931E", "#9B59B6"],
  "style_suggestions": ["impressionist", "realistic"]
}
```

### POST /api/nlp/enhance
Enhance a prompt with artistic terminology and quality modifiers.

**Request:**
```json
{
  "prompt": "A cat",
  "style": "realistic" // optional
}
```

**Response:**
```json
{
  "original_prompt": "A cat",
  "enhanced_prompt": "A highly detailed, photorealistic portrait of a cat, professional photography, sharp focus, 8k resolution, masterpiece",
  "improvements": [
    "Added quality modifiers",
    "Enhanced with technical terms",
    "Specified artistic style"
  ]
}
```

### POST /api/nlp/keywords
Extract keywords from a prompt.

**Request:**
```json
{
  "prompt": "Vibrant abstract painting with warm colors"
}
```

**Response:**
```json
{
  "keywords": ["vibrant", "abstract", "painting", "warm", "colors"],
  "categories": {
    "styles": ["abstract"],
    "moods": ["vibrant"],
    "colors": ["warm"]
  }
}
```

### GET /api/nlp/presets
Get predefined prompt templates by category.

**Response:**
```json
{
  "landscape": [
    "A serene mountain landscape at sunset",
    "Misty forest with rays of sunlight"
  ],
  "portrait": [
    "Professional portrait photography",
    "Character concept art"
  ],
  "abstract": [
    "Colorful abstract expressionism",
    "Geometric abstract composition"
  ]
}
```

### GET /api/nlp/history
Get user's prompt history.

**Query Parameters:**
- `limit` (optional): Number of results (default: 20)
- `skip` (optional): Number to skip for pagination (default: 0)

**Response:**
```json
{
  "prompts": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "text": "A beautiful sunset",
      "enhanced": "A stunning sunset over the ocean...",
      "favorite": true,
      "createdAt": "2024-01-19T10:00:00.000Z"
    }
  ],
  "total": 50
}
```

---

## Diffusion Endpoints

### POST /api/diffusion/generate
Generate an image from a text prompt using Stable Diffusion.

**Request:**
```json
{
  "prompt": "A serene mountain landscape at sunset",
  "negative_prompt": "blurry, low quality, distorted",
  "num_inference_steps": 50,
  "guidance_scale": 7.5,
  "width": 512,
  "height": 512,
  "seed": 42
}
```

**Parameters:**
- `prompt` (required): Text description of the image
- `negative_prompt` (optional): What to avoid in the image
- `num_inference_steps` (optional): 1-150, default 50
- `guidance_scale` (optional): 1-20, default 7.5
- `width` (optional): 256|512|768|1024, default 512
- `height` (optional): 256|512|768|1024, default 512
- `seed` (optional): Random seed for reproducibility

**Response:**
```json
{
  "success": true,
  "image_url": "/generated/image_123456.png",
  "metadata": {
    "prompt": "A serene mountain landscape at sunset",
    "steps": 50,
    "guidance_scale": 7.5,
    "size": "512x512",
    "seed": 42,
    "model": "stabilityai/stable-diffusion-2-1-base"
  },
  "generation_time": 45.2
}
```

### GET /api/diffusion/presets
Get prompt presets for different categories.

**Response:**
```json
{
  "landscape": {
    "prompts": ["Mountain vista", "Ocean sunset"],
    "settings": {
      "num_inference_steps": 50,
      "guidance_scale": 7.5
    }
  },
  "portrait": {
    "prompts": ["Professional headshot", "Character portrait"],
    "settings": {
      "num_inference_steps": 60,
      "guidance_scale": 8.0
    }
  }
}
```

---

## Style Transfer Endpoints

### POST /api/style-transfer/transfer
Apply artistic style transfer to an image.

**Request:** (multipart/form-data)
```
image: [file]
style: "vangogh"
num_steps: 300
style_weight: 100000
content_weight: 1
```

**Parameters:**
- `image` (required): Image file (JPEG, PNG, WebP)
- `style` (required): vangogh|monet|picasso|kandinsky|munch|cezanne|ukiyoe|abstract
- `num_steps` (optional): 50-500, default 300
- `style_weight` (optional): 1-1000000, default 100000
- `content_weight` (optional): 1-10, default 1

**Response:**
```json
{
  "success": true,
  "output_url": "/generated/styled_image_123456.png",
  "metadata": {
    "style": "vangogh",
    "num_steps": 300,
    "style_weight": 100000,
    "content_weight": 1
  },
  "processing_time": 120.5
}
```

### GET /api/style-transfer/styles
Get list of available artistic styles.

**Response:**
```json
{
  "styles": [
    {
      "id": "vangogh",
      "name": "Van Gogh - Starry Night",
      "description": "Post-impressionist style with swirling brushstrokes"
    },
    {
      "id": "monet",
      "name": "Claude Monet - Impressionism",
      "description": "Soft, light-focused impressionist style"
    }
  ]
}
```

---

## LLM Endpoints

### POST /api/llm/chat
Chat with the AI art director for creative guidance.

**Request:**
```json
{
  "message": "Help me create a prompt for a landscape",
  "conversationId": "conv_123456",
  "temperature": 0.7,
  "max_tokens": 512
}
```

**Parameters:**
- `message` (required): User message (1-2000 chars)
- `conversationId` (optional): Continue existing conversation
- `temperature` (optional): 0-2, default 0.7
- `max_tokens` (optional): 1-2048, default 512

**Response:**
```json
{
  "response": "I'd be happy to help! For a compelling landscape prompt, consider...",
  "conversationId": "conv_123456",
  "tokens_used": 156
}
```

### POST /api/llm/refine
Refine a prompt based on feedback.

**Request:**
```json
{
  "prompt": "A cat",
  "feedback": "Make it more detailed and dramatic"
}
```

**Response:**
```json
{
  "original": "A cat",
  "refined": "A majestic cat with piercing eyes, dramatic lighting, highly detailed fur texture, cinematic composition",
  "explanation": "Added dramatic elements, enhanced detail level, improved composition",
  "alternatives": [
    "A regal cat portrait with chiaroscuro lighting...",
    "An elegant feline in a dramatic pose..."
  ]
}
```

---

## Feedback Endpoints

### POST /api/feedback/rate
Rate a generated image.

**Request:**
```json
{
  "imageId": "img_123456",
  "userId": "user_789",
  "rating": 5
}
```

**Parameters:**
- `imageId` (required): Image identifier
- `userId` (required): User identifier
- `rating` (required): 1-5 stars

**Response:**
```json
{
  "success": true,
  "message": "Rating recorded",
  "reward": 1.0
}
```

### POST /api/feedback/like
Toggle like status for an image.

**Request:**
```json
{
  "imageId": "img_123456",
  "userId": "user_789"
}
```

**Response:**
```json
{
  "success": true,
  "liked": true,
  "reward": 0.5
}
```

### POST /api/feedback/favorite
Toggle favorite status for an image.

**Request:**
```json
{
  "imageId": "img_123456",
  "userId": "user_789"
}
```

**Response:**
```json
{
  "success": true,
  "favorited": true,
  "reward": 1.0
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "prompt",
      "message": "\"prompt\" is required"
    }
  ]
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Code Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Analyze a prompt
const analyzePrompt = async (prompt) => {
  const response = await axios.post('http://localhost:5000/api/nlp/analyze', {
    prompt: prompt
  });
  return response.data;
};

// Generate an image
const generateImage = async (prompt) => {
  const response = await axios.post('http://localhost:5000/api/diffusion/generate', {
    prompt: prompt,
    num_inference_steps: 50,
    guidance_scale: 7.5
  });
  return response.data;
};
```

### Python
```python
import requests

# Analyze a prompt
def analyze_prompt(prompt):
    response = requests.post('http://localhost:5000/api/nlp/analyze', json={
        'prompt': prompt
    })
    return response.json()

# Generate an image
def generate_image(prompt):
    response = requests.post('http://localhost:5000/api/diffusion/generate', json={
        'prompt': prompt,
        'num_inference_steps': 50,
        'guidance_scale': 7.5
    })
    return response.json()
```

### cURL
```bash
# Analyze a prompt
curl -X POST http://localhost:5000/api/nlp/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A beautiful sunset"}'

# Generate an image
curl -X POST http://localhost:5000/api/diffusion/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain landscape",
    "num_inference_steps": 50,
    "guidance_scale": 7.5
  }'
```

---

## WebSocket Support (Future)

Real-time updates for long-running generation tasks will be available via WebSocket in future versions.

```javascript
const socket = io('http://localhost:5000');

socket.on('generation:progress', (data) => {
  console.log(`Progress: ${data.progress}%`);
});

socket.on('generation:complete', (data) => {
  console.log('Image ready:', data.image_url);
});
```

---

## Changelog

### v1.0.0 (2024-01-19)
- Initial API release
- NLP, Diffusion, Style Transfer, LLM, and Feedback endpoints
- Rate limiting and security features
- Comprehensive input validation
