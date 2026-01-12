"""
Recommendation Engine
Generates personalized recommendations using MAB and content-based filtering
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from collections import defaultdict
import random


class RecommendationEngine:
    """
    Generates personalized recommendations
    Combines MAB with content-based and collaborative filtering
    """
    
    def __init__(self):
        # Predefined prompt templates by category
        self.prompt_templates = {
            'abstract': [
                "Abstract {color} composition with {mood} atmosphere",
                "Geometric {color} patterns, {mood} and dynamic",
                "Fluid {color} shapes in {mood} motion",
                "Chaotic {color} forms creating {mood} energy"
            ],
            'realistic': [
                "Photorealistic {color} landscape with {mood} lighting",
                "Detailed {color} portrait in {mood} setting",
                "Hyperrealistic {color} scene with {mood} ambiance",
                "Lifelike {color} environment, {mood} and atmospheric"
            ],
            'surreal': [
                "Dreamlike {color} world with {mood} elements",
                "Surreal {color} landscape, {mood} and otherworldly",
                "Impossible {color} architecture in {mood} space",
                "Fantastical {color} creatures in {mood} realm"
            ],
            'impressionist': [
                "Impressionist {color} garden with {mood} brushstrokes",
                "Soft {color} landscape in {mood} light",
                "Delicate {color} scene with {mood} atmosphere",
                "Gentle {color} composition, {mood} and serene"
            ],
            'expressionist': [
                "Bold {color} strokes expressing {mood} emotion",
                "Intense {color} forms with {mood} energy",
                "Dramatic {color} composition, {mood} and powerful",
                "Expressive {color} shapes conveying {mood} feeling"
            ]
        }
        
        self.color_descriptors = {
            'vibrant': ['bright', 'vivid', 'saturated', 'bold'],
            'muted': ['soft', 'subtle', 'gentle', 'understated'],
            'monochrome': ['black and white', 'grayscale', 'single color'],
            'warm': ['orange', 'red', 'yellow', 'golden'],
            'cool': ['blue', 'green', 'purple', 'cyan'],
            'pastel': ['light', 'pale', 'soft colored'],
            'neon': ['glowing', 'fluorescent', 'electric']
        }
        
        self.mood_descriptors = {
            'peaceful': ['calm', 'tranquil', 'serene', 'relaxing'],
            'dramatic': ['intense', 'powerful', 'striking', 'bold'],
            'mysterious': ['enigmatic', 'cryptic', 'shadowy', 'dark'],
            'playful': ['fun', 'whimsical', 'lighthearted', 'joyful'],
            'ethereal': ['dreamy', 'otherworldly', 'celestial', 'mystical'],
            'energetic': ['dynamic', 'vibrant', 'lively', 'active'],
            'melancholic': ['sad', 'somber', 'wistful', 'nostalgic']
        }
    
    def generate_recommendations(
        self, 
        user_preferences: Dict, 
        count: int = 5,
        include_exploration: bool = True
    ) -> List[Dict]:
        """
        Generate personalized prompt recommendations
        
        Args:
            user_preferences: User preference profile from PreferenceLearner
            count: Number of recommendations to generate
            include_exploration: Whether to include exploratory recommendations
        
        Returns:
            List of recommendation dictionaries
        """
        recommendations = []
        
        # Get top preferences
        top_prefs = user_preferences.get('top_preferences', {})
        top_styles = [s[0] for s in top_prefs.get('top_styles', [])]
        top_colors = [c[0] for c in top_prefs.get('top_colors', [])]
        top_moods = [m[0] for m in top_prefs.get('top_moods', [])]
        
        # Ensure we have some preferences
        if not top_styles:
            top_styles = list(self.prompt_templates.keys())[:3]
        if not top_colors:
            top_colors = list(self.color_descriptors.keys())[:3]
        if not top_moods:
            top_moods = list(self.mood_descriptors.keys())[:3]
        
        # Generate exploitation recommendations (based on preferences)
        exploitation_count = int(count * 0.7) if include_exploration else count
        
        for i in range(exploitation_count):
            style = top_styles[i % len(top_styles)]
            color = top_colors[i % len(top_colors)]
            mood = top_moods[i % len(top_moods)]
            
            prompt = self._generate_prompt(style, color, mood)
            
            recommendations.append({
                'prompt': prompt,
                'style': style,
                'color': color,
                'mood': mood,
                'type': 'personalized',
                'confidence': 0.8 - (i * 0.1)
            })
        
        # Generate exploration recommendations (try new things)
        if include_exploration:
            exploration_count = count - exploitation_count
            
            for i in range(exploration_count):
                # Random selection for exploration
                style = random.choice(list(self.prompt_templates.keys()))
                color = random.choice(list(self.color_descriptors.keys()))
                mood = random.choice(list(self.mood_descriptors.keys()))
                
                prompt = self._generate_prompt(style, color, mood)
                
                recommendations.append({
                    'prompt': prompt,
                    'style': style,
                    'color': color,
                    'mood': mood,
                    'type': 'exploratory',
                    'confidence': 0.5
                })
        
        return recommendations
    
    def collaborative_filtering(
        self, 
        user_id: str, 
        all_user_preferences: Dict[str, Dict],
        count: int = 5
    ) -> List[Dict]:
        """
        Find similar users and recommend based on their preferences
        
        Args:
            user_id: Current user ID
            all_user_preferences: Dictionary of all user preferences
            count: Number of recommendations
        
        Returns:
            List of recommendations from similar users
        """
        if user_id not in all_user_preferences:
            return []
        
        current_user_prefs = all_user_preferences[user_id]
        
        # Find similar users
        similarities = {}
        for other_user_id, other_prefs in all_user_preferences.items():
            if other_user_id == user_id:
                continue
            
            similarity = self._calculate_similarity(current_user_prefs, other_prefs)
            similarities[other_user_id] = similarity
        
        # Get top 3 similar users
        similar_users = sorted(similarities.items(), key=lambda x: x[1], reverse=True)[:3]
        
        if not similar_users:
            return []
        
        # Aggregate recommendations from similar users
        recommendations = []
        
        for similar_user_id, similarity in similar_users:
            similar_prefs = all_user_preferences[similar_user_id]
            top_prefs = similar_prefs.get('top_preferences', {})
            
            # Get their top style
            top_styles = top_prefs.get('top_styles', [])
            if top_styles:
                style = top_styles[0][0]
                
                # Get random color and mood
                color = random.choice(list(self.color_descriptors.keys()))
                mood = random.choice(list(self.mood_descriptors.keys()))
                
                prompt = self._generate_prompt(style, color, mood)
                
                recommendations.append({
                    'prompt': prompt,
                    'style': style,
                    'color': color,
                    'mood': mood,
                    'type': 'collaborative',
                    'confidence': similarity,
                    'source_user': similar_user_id
                })
        
        return recommendations[:count]
    
    def get_trending(
        self, 
        recent_interactions: List[Dict],
        count: int = 5
    ) -> List[Dict]:
        """
        Get trending styles/prompts based on recent activity
        
        Args:
            recent_interactions: List of recent interactions from all users
            count: Number of trending items
        
        Returns:
            List of trending recommendations
        """
        # Count occurrences
        style_counts = defaultdict(int)
        color_counts = defaultdict(int)
        mood_counts = defaultdict(int)
        
        # Weight recent interactions more heavily
        for i, interaction in enumerate(recent_interactions):
            weight = 1.0 / (i + 1)  # More recent = higher weight
            
            style = interaction.get('style')
            if style:
                style_counts[style] += weight
            
            color = interaction.get('color')
            if color:
                color_counts[color] += weight
            
            mood = interaction.get('mood')
            if mood:
                mood_counts[mood] += weight
        
        # Get top trending items
        top_styles = sorted(style_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        top_colors = sorted(color_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        top_moods = sorted(mood_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        
        # Generate recommendations
        recommendations = []
        
        for i in range(min(count, len(top_styles))):
            style = top_styles[i][0] if i < len(top_styles) else random.choice(list(self.prompt_templates.keys()))
            color = top_colors[i][0] if i < len(top_colors) else random.choice(list(self.color_descriptors.keys()))
            mood = top_moods[i][0] if i < len(top_moods) else random.choice(list(self.mood_descriptors.keys()))
            
            prompt = self._generate_prompt(style, color, mood)
            
            recommendations.append({
                'prompt': prompt,
                'style': style,
                'color': color,
                'mood': mood,
                'type': 'trending',
                'confidence': 0.7
            })
        
        return recommendations
    
    def _generate_prompt(self, style: str, color: str, mood: str) -> str:
        """Generate a prompt from style, color, and mood"""
        # Get template
        templates = self.prompt_templates.get(style, [])
        if not templates:
            return f"{style} art with {color} colors and {mood} mood"
        
        template = random.choice(templates)
        
        # Get descriptors
        color_desc = random.choice(self.color_descriptors.get(color, [color]))
        mood_desc = random.choice(self.mood_descriptors.get(mood, [mood]))
        
        # Fill template
        prompt = template.format(color=color_desc, mood=mood_desc)
        
        # Add quality modifiers
        quality_modifiers = [
            "highly detailed",
            "masterpiece",
            "professional",
            "8k resolution",
            "trending on artstation"
        ]
        
        modifier = random.choice(quality_modifiers)
        prompt = f"{prompt}, {modifier}"
        
        return prompt
    
    def _calculate_similarity(self, prefs1: Dict, prefs2: Dict) -> float:
        """Calculate cosine similarity between two preference profiles"""
        # Extract preference vectors
        vector1 = []
        vector2 = []
        
        categories = ['styles', 'colors', 'moods', 'models']
        
        for category in categories:
            prefs1_cat = prefs1.get('preferences', {}).get(category, {})
            prefs2_cat = prefs2.get('preferences', {}).get(category, {})
            
            # Get all keys
            all_keys = set(prefs1_cat.keys()) | set(prefs2_cat.keys())
            
            for key in all_keys:
                vector1.append(prefs1_cat.get(key, 0))
                vector2.append(prefs2_cat.get(key, 0))
        
        if not vector1 or not vector2:
            return 0.0
        
        # Cosine similarity
        vector1 = np.array(vector1)
        vector2 = np.array(vector2)
        
        dot_product = np.dot(vector1, vector2)
        norm1 = np.linalg.norm(vector1)
        norm2 = np.linalg.norm(vector2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)


# Example usage
if __name__ == '__main__':
    engine = RecommendationEngine()
    
    # Mock user preferences
    user_prefs = {
        'top_preferences': {
            'top_styles': [('abstract', 0.8), ('surreal', 0.6)],
            'top_colors': [('vibrant', 0.9), ('neon', 0.7)],
            'top_moods': [('energetic', 0.85), ('playful', 0.65)]
        }
    }
    
    print("Personalized Recommendations:\n")
    recommendations = engine.generate_recommendations(user_prefs, count=5)
    
    for i, rec in enumerate(recommendations, 1):
        print(f"{i}. [{rec['type']}] (confidence: {rec['confidence']:.2f})")
        print(f"   {rec['prompt']}")
        print(f"   Style: {rec['style']}, Color: {rec['color']}, Mood: {rec['mood']}\n")
    
    # Mock trending data
    recent_interactions = [
        {'style': 'abstract', 'color': 'vibrant', 'mood': 'energetic'},
        {'style': 'abstract', 'color': 'neon', 'mood': 'playful'},
        {'style': 'surreal', 'color': 'vibrant', 'mood': 'mysterious'},
        {'style': 'abstract', 'color': 'vibrant', 'mood': 'energetic'},
    ]
    
    print("\nTrending Recommendations:\n")
    trending = engine.get_trending(recent_interactions, count=3)
    
    for i, rec in enumerate(trending, 1):
        print(f"{i}. {rec['prompt']}")
        print(f"   Style: {rec['style']}, Color: {rec['color']}, Mood: {rec['mood']}\n")
