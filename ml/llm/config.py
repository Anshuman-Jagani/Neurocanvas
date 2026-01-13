"""
LLM Configuration
Settings for Llama 2 model and inference
"""

from pathlib import Path

# Model configuration
MODEL_DIR = Path(__file__).parent.parent.parent / "models"
MODEL_NAME = "llama-2-7b-chat.Q4_K_M.gguf"
MODEL_PATH = MODEL_DIR / MODEL_NAME

# LLM inference settings
LLM_CONFIG = {
    'model_path': str(MODEL_PATH),
    'n_ctx': 2048,              # Context window size
    'n_threads': 4,             # CPU threads to use
    'n_batch': 512,             # Batch size for prompt processing
    'temperature': 0.7,         # Sampling temperature (0.0-1.0)
    'top_p': 0.9,              # Nucleus sampling
    'top_k': 40,               # Top-k sampling
    'repeat_penalty': 1.1,     # Penalty for repetition
    'max_tokens': 512,         # Maximum tokens to generate
    'stop': ['</s>', 'User:', 'Assistant:'],  # Stop sequences
    'echo': False,             # Don't echo the prompt
    'verbose': False           # Suppress llama.cpp logs
}

# Conversation settings
CONVERSATION_CONFIG = {
    'max_context_tokens': 2048,
    'max_history_messages': 20,
    'summarize_threshold': 1800,  # Summarize when context exceeds this
    'system_prompt_tokens': 200    # Reserved for system prompt
}

# Art director settings
ART_DIRECTOR_CONFIG = {
    'max_refinement_iterations': 5,
    'variation_count': 3,
    'suggestion_count': 5,
    'temperature': 0.7,  # Slightly creative
    'max_tokens': 400    # Concise responses
}

# Prompt templates directory
TEMPLATES_DIR = Path(__file__).parent / "templates"

def get_template(template_name):
    """
    Load a prompt template
    """
    template_path = TEMPLATES_DIR / f"{template_name}.txt"
    if template_path.exists():
        return template_path.read_text()
    return None
