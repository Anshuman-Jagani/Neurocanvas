"""
LLM Service
Core service for interacting with Llama 2 model via llama.cpp
"""

import sys
from pathlib import Path
from typing import Generator, List, Dict, Optional

try:
    from llama_cpp import Llama
except ImportError:
    print("❌ llama-cpp-python not installed")
    print("Install with: pip install llama-cpp-python")
    sys.exit(1)

from .config import LLM_CONFIG

class LLMService:
    """
    Service for LLM inference using llama.cpp
    """
    
    def __init__(self, model_path: Optional[str] = None, **kwargs):
        """
        Initialize LLM service
        
        Args:
            model_path: Path to GGUF model file
            **kwargs: Additional llama.cpp parameters
        """
        config = {**LLM_CONFIG, **(kwargs or {})}
        
        if model_path:
            config['model_path'] = model_path
        
        model_file = Path(config['model_path'])
        
        if not model_file.exists():
            raise FileNotFoundError(
                f"Model not found: {model_file}\n"
                f"Please run: python ml/llm/download_model.py"
            )
        
        print(f"🦙 Loading Llama 2 model from {model_file.name}...")
        
        try:
            self.llm = Llama(
                model_path=str(model_file),
                n_ctx=config['n_ctx'],
                n_threads=config['n_threads'],
                n_batch=config['n_batch'],
                verbose=config['verbose']
            )
            print(f"✅ Model loaded successfully!")
            
        except Exception as e:
            print(f"❌ Failed to load model: {e}")
            raise
        
        self.config = config
    
    def generate(
        self,
        prompt: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs
    ) -> str:
        """
        Generate a complete response
        
        Args:
            prompt: Input prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            **kwargs: Additional generation parameters
        
        Returns:
            Generated text
        """
        params = {
            'max_tokens': max_tokens or self.config['max_tokens'],
            'temperature': temperature or self.config['temperature'],
            'top_p': kwargs.get('top_p', self.config['top_p']),
            'top_k': kwargs.get('top_k', self.config['top_k']),
            'repeat_penalty': kwargs.get('repeat_penalty', self.config['repeat_penalty']),
            'stop': kwargs.get('stop', self.config['stop']),
            'echo': kwargs.get('echo', self.config['echo'])
        }
        
        try:
            response = self.llm(prompt, **params)
            return response['choices'][0]['text'].strip()
        
        except Exception as e:
            print(f"❌ Generation error: {e}")
            return f"Error: {str(e)}"
    
    def stream_generate(
        self,
        prompt: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs
    ) -> Generator[str, None, None]:
        """
        Generate response with streaming (token by token)
        
        Args:
            prompt: Input prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            **kwargs: Additional generation parameters
        
        Yields:
            Generated tokens
        """
        params = {
            'max_tokens': max_tokens or self.config['max_tokens'],
            'temperature': temperature or self.config['temperature'],
            'top_p': kwargs.get('top_p', self.config['top_p']),
            'top_k': kwargs.get('top_k', self.config['top_k']),
            'repeat_penalty': kwargs.get('repeat_penalty', self.config['repeat_penalty']),
            'stop': kwargs.get('stop', self.config['stop']),
            'stream': True
        }
        
        try:
            for output in self.llm(prompt, **params):
                if 'choices' in output and len(output['choices']) > 0:
                    token = output['choices'][0].get('text', '')
                    if token:
                        yield token
        
        except Exception as e:
            print(f"❌ Streaming error: {e}")
            yield f"\n\nError: {str(e)}"
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Chat with conversation history
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            system_prompt: Optional system prompt
            **kwargs: Additional generation parameters
        
        Returns:
            Assistant's response
        """
        # Format messages in Chat-ML format
        formatted_prompt = self._format_chat_ml(messages, system_prompt)
        
        # Generate response
        return self.generate(formatted_prompt, **kwargs)
    
    def stream_chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> Generator[str, None, None]:
        """
        Chat with streaming response
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            system_prompt: Optional system prompt
            **kwargs: Additional generation parameters
        
        Yields:
            Generated tokens
        """
        # Format messages in Chat-ML format
        formatted_prompt = self._format_chat_ml(messages, system_prompt)
        
        # Stream response
        yield from self.stream_generate(formatted_prompt, **kwargs)
    
    def _format_chat_ml(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Format messages in Chat-ML format for Llama 2
        
        Format:
        <s>[INST] <<SYS>>
        {system_prompt}
        <</SYS>>
        
        {user_message} [/INST] {assistant_response} </s>
        <s>[INST] {user_message} [/INST]
        """
        formatted = ""
        
        # Add system prompt if provided
        if system_prompt:
            formatted = f"<s>[INST] <<SYS>>\n{system_prompt}\n<</SYS>>\n\n"
        else:
            formatted = "<s>[INST] "
        
        # Add conversation history
        for i, msg in enumerate(messages):
            role = msg['role']
            content = msg['content']
            
            if role == 'user':
                if i == 0 and system_prompt:
                    # First user message after system prompt
                    formatted += f"{content} [/INST] "
                else:
                    formatted += f"<s>[INST] {content} [/INST] "
            
            elif role == 'assistant':
                formatted += f"{content} </s>"
        
        return formatted
    
    def count_tokens(self, text: str) -> int:
        """
        Estimate token count (rough approximation)
        
        Args:
            text: Input text
        
        Returns:
            Estimated token count
        """
        # Rough estimate: ~4 characters per token
        return len(text) // 4

# Test function
def test_llm():
    """
    Test LLM service
    """
    print("=" * 60)
    print("🧪 Testing LLM Service")
    print("=" * 60)
    print()
    
    try:
        # Initialize service
        llm = LLMService()
        
        # Test simple generation
        print("📝 Test 1: Simple generation")
        prompt = "What is art?"
        print(f"Prompt: {prompt}")
        response = llm.generate(prompt, max_tokens=100)
        print(f"Response: {response}")
        print()
        
        # Test streaming
        print("📝 Test 2: Streaming generation")
        prompt = "Describe a sunset in three sentences."
        print(f"Prompt: {prompt}")
        print("Response: ", end="", flush=True)
        for token in llm.stream_generate(prompt, max_tokens=150):
            print(token, end="", flush=True)
        print("\n")
        
        # Test chat
        print("📝 Test 3: Chat with history")
        messages = [
            {"role": "user", "content": "What is impressionism?"},
            {"role": "assistant", "content": "Impressionism is an art movement..."},
            {"role": "user", "content": "Who were the main artists?"}
        ]
        response = llm.chat(messages, max_tokens=150)
        print(f"Response: {response}")
        print()
        
        print("✅ All tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    test_llm()
