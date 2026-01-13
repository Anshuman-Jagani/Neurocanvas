"""
Conversation Manager
Manages conversation history and context window
"""

from typing import List, Dict, Optional
from datetime import datetime
from .config import CONVERSATION_CONFIG

class ConversationManager:
    """
    Manages conversation history with context window limits
    """
    
    def __init__(self, max_context_tokens: Optional[int] = None):
        """
        Initialize conversation manager
        
        Args:
            max_context_tokens: Maximum tokens in context window
        """
        self.max_context_tokens = max_context_tokens or CONVERSATION_CONFIG['max_context_tokens']
        self.max_history_messages = CONVERSATION_CONFIG['max_history_messages']
        self.summarize_threshold = CONVERSATION_CONFIG['summarize_threshold']
        
        self.messages: List[Dict] = []
        self.token_count = 0
        self.system_prompt: Optional[str] = None
    
    def set_system_prompt(self, prompt: str):
        """
        Set system prompt for the conversation
        
        Args:
            prompt: System prompt text
        """
        self.system_prompt = prompt
        # Reserve tokens for system prompt
        self.token_count += self._estimate_tokens(prompt)
    
    def add_message(self, role: str, content: str, metadata: Optional[Dict] = None):
        """
        Add a message to the conversation
        
        Args:
            role: 'user' or 'assistant'
            content: Message content
            metadata: Optional metadata (tokens, timestamp, etc.)
        """
        tokens = self._estimate_tokens(content)
        
        message = {
            'role': role,
            'content': content,
            'timestamp': datetime.now().isoformat(),
            'tokens': tokens,
            'metadata': metadata or {}
        }
        
        self.messages.append(message)
        self.token_count += tokens
        
        # Check if we need to manage context
        if self.token_count > self.summarize_threshold:
            self._manage_context()
    
    def get_messages(self, limit: Optional[int] = None) -> List[Dict]:
        """
        Get conversation messages
        
        Args:
            limit: Optional limit on number of messages
        
        Returns:
            List of messages
        """
        if limit:
            return self.messages[-limit:]
        return self.messages
    
    def get_context(self) -> List[Dict[str, str]]:
        """
        Get formatted context for LLM (role + content only)
        
        Returns:
            List of message dicts with 'role' and 'content'
        """
        return [
            {'role': msg['role'], 'content': msg['content']}
            for msg in self.messages
        ]
    
    def get_system_prompt(self) -> Optional[str]:
        """
        Get system prompt
        
        Returns:
            System prompt or None
        """
        return self.system_prompt
    
    def clear(self):
        """
        Clear conversation history
        """
        self.messages = []
        self.token_count = CONVERSATION_CONFIG['system_prompt_tokens'] if self.system_prompt else 0
    
    def get_stats(self) -> Dict:
        """
        Get conversation statistics
        
        Returns:
            Dict with stats
        """
        return {
            'message_count': len(self.messages),
            'token_count': self.token_count,
            'max_tokens': self.max_context_tokens,
            'utilization': self.token_count / self.max_context_tokens,
            'user_messages': sum(1 for m in self.messages if m['role'] == 'user'),
            'assistant_messages': sum(1 for m in self.messages if m['role'] == 'assistant')
        }
    
    def _manage_context(self):
        """
        Manage context window by removing old messages
        """
        # Simple strategy: Remove oldest messages
        while self.token_count > self.max_context_tokens and len(self.messages) > 2:
            removed = self.messages.pop(0)
            self.token_count -= removed['tokens']
        
        # Alternative: Could implement summarization here
        # self._summarize_old_messages()
    
    def _summarize_old_messages(self):
        """
        Summarize old messages to save context space
        (Placeholder for future implementation)
        """
        # TODO: Use LLM to summarize old conversation
        # This would require calling the LLM service
        pass
    
    def _estimate_tokens(self, text: str) -> int:
        """
        Estimate token count (rough approximation)
        
        Args:
            text: Input text
        
        Returns:
            Estimated token count
        """
        # Rough estimate: ~4 characters per token
        return max(1, len(text) // 4)
    
    def export_conversation(self) -> Dict:
        """
        Export conversation for storage
        
        Returns:
            Dict with conversation data
        """
        return {
            'system_prompt': self.system_prompt,
            'messages': self.messages,
            'stats': self.get_stats(),
            'exported_at': datetime.now().isoformat()
        }
    
    def import_conversation(self, data: Dict):
        """
        Import conversation from storage
        
        Args:
            data: Conversation data dict
        """
        self.system_prompt = data.get('system_prompt')
        self.messages = data.get('messages', [])
        
        # Recalculate token count
        self.token_count = sum(msg.get('tokens', 0) for msg in self.messages)
        if self.system_prompt:
            self.token_count += self._estimate_tokens(self.system_prompt)

# Test function
def test_conversation_manager():
    """
    Test conversation manager
    """
    print("=" * 60)
    print("🧪 Testing Conversation Manager")
    print("=" * 60)
    print()
    
    # Create manager
    manager = ConversationManager()
    
    # Set system prompt
    manager.set_system_prompt("You are a helpful art director.")
    print(f"✅ System prompt set")
    
    # Add messages
    manager.add_message("user", "What is impressionism?")
    manager.add_message("assistant", "Impressionism is an art movement from the 19th century...")
    manager.add_message("user", "Who were the main artists?")
    manager.add_message("assistant", "The main impressionist artists include Claude Monet, Pierre-Auguste Renoir...")
    
    print(f"✅ Added {len(manager.messages)} messages")
    
    # Get stats
    stats = manager.get_stats()
    print(f"\n📊 Stats:")
    print(f"  Messages: {stats['message_count']}")
    print(f"  Tokens: {stats['token_count']}/{stats['max_tokens']}")
    print(f"  Utilization: {stats['utilization']:.1%}")
    
    # Get context
    context = manager.get_context()
    print(f"\n💬 Context ({len(context)} messages):")
    for msg in context:
        print(f"  {msg['role']}: {msg['content'][:50]}...")
    
    # Export/Import
    exported = manager.export_conversation()
    print(f"\n✅ Exported conversation")
    
    new_manager = ConversationManager()
    new_manager.import_conversation(exported)
    print(f"✅ Imported conversation ({len(new_manager.messages)} messages)")
    
    print(f"\n✅ All tests passed!")

if __name__ == "__main__":
    test_conversation_manager()
