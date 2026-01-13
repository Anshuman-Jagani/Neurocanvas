"""
Art Director Agent
Specialized agent for art direction and prompt refinement
"""

from typing import List, Dict, Optional, Generator
from .llm_service import LLMService
from .conversation_manager import ConversationManager
from .config import ART_DIRECTOR_CONFIG, get_template

class ArtDirector:
    """
    AI Art Director for prompt refinement and creative suggestions
    """
    
    def __init__(self, llm_service: Optional[LLMService] = None):
        """
        Initialize art director
        
        Args:
            llm_service: LLM service instance (creates new if None)
        """
        self.llm = llm_service or LLMService()
        self.config = ART_DIRECTOR_CONFIG
        
        # Load system prompt
        self.system_prompt = get_template('art_director') or self._default_system_prompt()
    
    def refine_prompt(
        self,
        original_prompt: str,
        feedback: Optional[str] = None,
        iteration: int = 1
    ) -> Dict:
        """
        Refine a prompt based on feedback
        
        Args:
            original_prompt: Original prompt to refine
            feedback: User feedback (optional)
            iteration: Refinement iteration number
        
        Returns:
            Dict with refined_prompt, explanation, and alternatives
        """
        # Load refinement template
        template = get_template('refine_prompt') or self._default_refine_template()
        
        # Format prompt
        prompt = template.format(
            original_prompt=original_prompt,
            feedback=feedback or "Make it more detailed and artistic"
        )
        
        # Generate refinement
        response = self.llm.chat(
            messages=[{'role': 'user', 'content': prompt}],
            system_prompt=self.system_prompt,
            max_tokens=self.config['max_tokens'],
            temperature=self.config['temperature']
        )
        
        # Parse response
        return self._parse_refinement_response(response, original_prompt)
    
    def suggest_improvements(
        self,
        prompt: str,
        analysis: Optional[Dict] = None
    ) -> List[str]:
        """
        Suggest specific improvements to a prompt
        
        Args:
            prompt: Prompt to analyze
            analysis: Optional NLP analysis results
        
        Returns:
            List of improvement suggestions
        """
        # Build context from analysis if available
        context = ""
        if analysis:
            context = f"\nPrompt analysis:\n"
            if 'mood' in analysis:
                context += f"- Mood: {analysis['mood']}\n"
            if 'keywords' in analysis:
                context += f"- Keywords: {', '.join(analysis.get('keywords', {}).get('subjects', []))}\n"
        
        prompt_text = f"""Analyze this prompt and suggest 5 specific improvements:
Prompt: "{prompt}"{context}

Provide actionable suggestions to make it more vivid, detailed, and artistic."""
        
        response = self.llm.chat(
            messages=[{'role': 'user', 'content': prompt_text}],
            system_prompt=self.system_prompt,
            max_tokens=self.config['max_tokens']
        )
        
        # Parse suggestions
        return self._parse_suggestions(response)
    
    def explain_concepts(self, concept: str) -> str:
        """
        Explain an artistic concept
        
        Args:
            concept: Concept to explain
        
        Returns:
            Explanation text
        """
        template = get_template('explain_concept') or self._default_explain_template()
        
        prompt = template.format(concept=concept)
        
        response = self.llm.chat(
            messages=[{'role': 'user', 'content': prompt}],
            system_prompt=self.system_prompt,
            max_tokens=self.config['max_tokens']
        )
        
        return response
    
    def generate_variations(
        self,
        prompt: str,
        count: Optional[int] = None
    ) -> List[str]:
        """
        Generate variations of a prompt
        
        Args:
            prompt: Original prompt
            count: Number of variations (default from config)
        
        Returns:
            List of prompt variations
        """
        count = count or self.config['variation_count']
        
        prompt_text = f"""Generate {count} creative variations of this prompt:
Original: "{prompt}"

Each variation should:
- Maintain the core idea
- Add unique artistic elements
- Be suitable for AI art generation

Provide only the variations, numbered 1-{count}."""
        
        response = self.llm.chat(
            messages=[{'role': 'user', 'content': prompt_text}],
            system_prompt=self.system_prompt,
            max_tokens=self.config['max_tokens'],
            temperature=0.8  # Higher temperature for creativity
        )
        
        return self._parse_variations(response)
    
    def suggest_styles(self, prompt: str) -> List[Dict]:
        """
        Suggest artistic styles for a prompt
        
        Args:
            prompt: Prompt to analyze
        
        Returns:
            List of style suggestions with explanations
        """
        template = get_template('suggest_styles') or self._default_styles_template()
        
        prompt_text = template.format(prompt=prompt)
        
        response = self.llm.chat(
            messages=[{'role': 'user', 'content': prompt_text}],
            system_prompt=self.system_prompt,
            max_tokens=self.config['max_tokens']
        )
        
        return self._parse_style_suggestions(response)
    
    def chat(
        self,
        conversation: ConversationManager,
        message: str
    ) -> str:
        """
        Chat with the art director
        
        Args:
            conversation: Conversation manager
            message: User message
        
        Returns:
            Assistant response
        """
        # Add user message
        conversation.add_message('user', message)
        
        # Get response
        response = self.llm.chat(
            messages=conversation.get_context(),
            system_prompt=conversation.get_system_prompt() or self.system_prompt,
            max_tokens=self.config['max_tokens'],
            temperature=self.config['temperature']
        )
        
        # Add assistant response
        conversation.add_message('assistant', response)
        
        return response
    
    def stream_chat(
        self,
        conversation: ConversationManager,
        message: str
    ) -> Generator[str, None, None]:
        """
        Chat with streaming response
        
        Args:
            conversation: Conversation manager
            message: User message
        
        Yields:
            Response tokens
        """
        # Add user message
        conversation.add_message('user', message)
        
        # Stream response
        full_response = ""
        for token in self.llm.stream_chat(
            messages=conversation.get_context(),
            system_prompt=conversation.get_system_prompt() or self.system_prompt,
            max_tokens=self.config['max_tokens'],
            temperature=self.config['temperature']
        ):
            full_response += token
            yield token
        
        # Add complete response to conversation
        conversation.add_message('assistant', full_response)
    
    # Helper methods for parsing responses
    
    def _parse_refinement_response(self, response: str, original: str) -> Dict:
        """Parse refinement response"""
        lines = response.strip().split('\n')
        
        refined = original
        explanation = ""
        alternatives = []
        
        for line in lines:
            line = line.strip()
            if line.startswith('1.') or line.startswith('Refined:'):
                refined = line.split(':', 1)[-1].strip() if ':' in line else line[2:].strip()
            elif line.startswith('2.') or line.startswith('Explanation:'):
                explanation = line.split(':', 1)[-1].strip() if ':' in line else line[2:].strip()
            elif line.startswith('3.') or line.startswith('Alternative'):
                alternatives.append(line.split(':', 1)[-1].strip() if ':' in line else line[2:].strip())
        
        return {
            'refined_prompt': refined,
            'explanation': explanation,
            'alternatives': alternatives,
            'original_prompt': original
        }
    
    def _parse_suggestions(self, response: str) -> List[str]:
        """Parse improvement suggestions"""
        suggestions = []
        for line in response.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                # Remove numbering/bullets
                suggestion = line.lstrip('0123456789.-•) ').strip()
                if suggestion:
                    suggestions.append(suggestion)
        return suggestions[:self.config['suggestion_count']]
    
    def _parse_variations(self, response: str) -> List[str]:
        """Parse prompt variations"""
        variations = []
        for line in response.split('\n'):
            line = line.strip()
            if line and line[0].isdigit():
                variation = line.split('.', 1)[-1].strip()
                if variation:
                    variations.append(variation)
        return variations
    
    def _parse_style_suggestions(self, response: str) -> List[Dict]:
        """Parse style suggestions"""
        # Simple parsing - could be improved
        styles = []
        current_style = None
        
        for line in response.split('\n'):
            line = line.strip()
            if line and line[0].isdigit():
                if current_style:
                    styles.append(current_style)
                current_style = {'name': line.split('.', 1)[-1].strip(), 'explanation': ''}
            elif current_style and line:
                current_style['explanation'] += line + ' '
        
        if current_style:
            styles.append(current_style)
        
        return styles
    
    # Default templates (used if template files don't exist)
    
    def _default_system_prompt(self) -> str:
        return """You are an expert AI art director helping users create better prompts for AI art generation.
Your role is to:
- Understand the user's artistic vision
- Suggest improvements to prompts
- Explain artistic concepts
- Recommend styles, colors, and compositions
- Be concise and actionable

Always maintain the user's original intent while enhancing clarity and artistic quality."""
    
    def _default_refine_template(self) -> str:
        return """Original prompt: {original_prompt}
User feedback: {feedback}

Please refine the prompt to address the feedback while maintaining the original vision.
Provide:
1. Refined prompt
2. Brief explanation of changes
3. Alternative suggestions"""
    
    def _default_explain_template(self) -> str:
        return """Explain this artistic concept in simple terms:
Concept: {concept}

Include:
- Definition
- Visual characteristics
- Famous examples
- How to use in prompts"""
    
    def _default_styles_template(self) -> str:
        return """Analyze this prompt and suggest 3 artistic styles that would work well:
Prompt: {prompt}

For each style, explain why it fits and how it would enhance the image."""

# Test function
def test_art_director():
    """
    Test art director
    """
    print("=" * 60)
    print("🧪 Testing Art Director")
    print("=" * 60)
    print()
    
    try:
        # Initialize
        director = ArtDirector()
        print("✅ Art director initialized")
        print()
        
        # Test refinement
        print("📝 Test 1: Prompt refinement")
        original = "A sunset"
        result = director.refine_prompt(original, "Make it more dramatic")
        print(f"Original: {original}")
        print(f"Refined: {result['refined_prompt']}")
        print(f"Explanation: {result['explanation']}")
        print()
        
        # Test suggestions
        print("📝 Test 2: Improvement suggestions")
        suggestions = director.suggest_improvements("A cat sitting")
        print(f"Suggestions for 'A cat sitting':")
        for i, suggestion in enumerate(suggestions, 1):
            print(f"  {i}. {suggestion}")
        print()
        
        # Test variations
        print("📝 Test 3: Generate variations")
        variations = director.generate_variations("A mountain landscape", count=3)
        print(f"Variations of 'A mountain landscape':")
        for i, var in enumerate(variations, 1):
            print(f"  {i}. {var}")
        print()
        
        print("✅ All tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    test_art_director()
