"""
Preference Learner
Learns user preferences from feedback history
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from collections import defaultdict


class PreferenceLearner:
    """
    Learns user preferences from interaction history
    Identifies patterns in styles, colors, moods, and models
    """
    
    def __init__(self):
        self.preference_categories = {
            'styles': ['abstract', 'realistic', 'surreal', 'impressionist', 
                      'expressionist', 'minimalist', 'baroque', 'renaissance'],
            'colors': ['vibrant', 'muted', 'monochrome', 'warm', 'cool', 
                      'pastel', 'neon'],
            'moods': ['peaceful', 'dramatic', 'mysterious', 'playful', 
                     'ethereal', 'energetic', 'melancholic'],
            'models': ['style-transfer', 'diffusion']
        }
    
    def learn_preferences(self, user_history: List[Dict]) -> Dict:
        """
        Learn preferences from user feedback history
        
        Args:
            user_history: List of interaction records with feedback
                Each record: {
                    'model': str,
                    'style': str,
                    'color': str,
                    'mood': str,
                    'reward': float,
                    'timestamp': datetime
                }
        
        Returns:
            Dictionary of learned preferences
        """
        if not user_history:
            return self._get_default_preferences()
        
        # Initialize preference scores
        preferences = {
            'styles': defaultdict(float),
            'colors': defaultdict(float),
            'moods': defaultdict(float),
            'models': defaultdict(float)
        }
        
        # Aggregate rewards by category
        for interaction in user_history:
            reward = interaction.get('reward', 0)
            
            # Update model preferences
            model = interaction.get('model')
            if model:
                preferences['models'][model] += reward
            
            # Update style preferences
            style = interaction.get('style')
            if style:
                preferences['styles'][style] += reward
            
            # Update color preferences
            color = interaction.get('color')
            if color:
                preferences['colors'][color] += reward
            
            # Update mood preferences
            mood = interaction.get('mood')
            if mood:
                preferences['moods'][mood] += reward
        
        # Normalize preferences (convert to probabilities)
        normalized_prefs = {}
        for category, scores in preferences.items():
            if scores:
                # Softmax normalization
                normalized_prefs[category] = self._softmax_normalize(dict(scores))
            else:
                normalized_prefs[category] = {}
        
        # Identify top preferences
        top_preferences = {
            'top_styles': self._get_top_n(normalized_prefs['styles'], 3),
            'top_colors': self._get_top_n(normalized_prefs['colors'], 3),
            'top_moods': self._get_top_n(normalized_prefs['moods'], 3),
            'preferred_model': self._get_top_n(normalized_prefs['models'], 1)
        }
        
        return {
            'preferences': normalized_prefs,
            'top_preferences': top_preferences,
            'total_interactions': len(user_history)
        }
    
    def predict_preference(self, user_profile: Dict, prompt_features: Dict) -> float:
        """
        Predict user preference for a prompt based on profile
        
        Args:
            user_profile: User preference profile from learn_preferences()
            prompt_features: Features of the prompt {
                'style': str,
                'color': str,
                'mood': str,
                'model': str
            }
        
        Returns:
            Predicted preference score (0 to 1)
        """
        if 'preferences' not in user_profile:
            return 0.5  # Neutral for new users
        
        preferences = user_profile['preferences']
        score = 0.0
        count = 0
        
        # Check each feature
        for category in ['styles', 'colors', 'moods', 'models']:
            feature_value = prompt_features.get(category.rstrip('s'))  # Remove 's'
            if feature_value and feature_value in preferences.get(category, {}):
                score += preferences[category][feature_value]
                count += 1
        
        # Average score
        if count > 0:
            return score / count
        return 0.5
    
    def identify_patterns(self, user_history: List[Dict]) -> Dict:
        """
        Identify patterns in user behavior
        
        Returns:
            Dictionary of identified patterns
        """
        if len(user_history) < 5:
            return {'message': 'Not enough data for pattern analysis'}
        
        patterns = {}
        
        # Time-based patterns
        hour_preferences = defaultdict(list)
        for interaction in user_history:
            if 'timestamp' in interaction:
                hour = interaction['timestamp'].hour
                reward = interaction.get('reward', 0)
                hour_preferences[hour].append(reward)
        
        # Find best time of day
        best_hour = None
        best_avg_reward = -float('inf')
        for hour, rewards in hour_preferences.items():
            avg_reward = np.mean(rewards)
            if avg_reward > best_avg_reward:
                best_avg_reward = avg_reward
                best_hour = hour
        
        patterns['best_time_of_day'] = f"{best_hour}:00" if best_hour else "N/A"
        
        # Consistency score (how consistent are preferences)
        style_rewards = defaultdict(list)
        for interaction in user_history:
            style = interaction.get('style')
            reward = interaction.get('reward', 0)
            if style:
                style_rewards[style].append(reward)
        
        # Calculate variance in rewards per style
        variances = []
        for style, rewards in style_rewards.items():
            if len(rewards) > 1:
                variances.append(np.var(rewards))
        
        if variances:
            avg_variance = np.mean(variances)
            # Low variance = high consistency
            consistency = max(0, 1 - avg_variance)
            patterns['consistency_score'] = round(consistency, 2)
        
        # Exploration vs Exploitation
        unique_styles = len(set(i.get('style') for i in user_history if i.get('style')))
        total_styles = len(self.preference_categories['styles'])
        exploration_rate = unique_styles / total_styles
        patterns['exploration_rate'] = round(exploration_rate, 2)
        
        return patterns
    
    def suggest_next_features(self, user_profile: Dict, count: int = 3) -> List[Dict]:
        """
        Suggest features for next generation based on preferences
        
        Args:
            user_profile: User preference profile
            count: Number of suggestions
        
        Returns:
            List of suggested feature combinations
        """
        if 'top_preferences' not in user_profile:
            return []
        
        top_prefs = user_profile['top_preferences']
        suggestions = []
        
        # Get top items from each category
        top_styles = [s[0] for s in top_prefs.get('top_styles', [])]
        top_colors = [c[0] for c in top_prefs.get('top_colors', [])]
        top_moods = [m[0] for m in top_prefs.get('top_moods', [])]
        
        # Create combinations
        for i in range(min(count, len(top_styles))):
            suggestion = {
                'style': top_styles[i] if i < len(top_styles) else None,
                'color': top_colors[i] if i < len(top_colors) else None,
                'mood': top_moods[i] if i < len(top_moods) else None
            }
            suggestions.append(suggestion)
        
        return suggestions
    
    def _softmax_normalize(self, scores: Dict[str, float]) -> Dict[str, float]:
        """Apply softmax normalization to scores"""
        if not scores:
            return {}
        
        # Shift scores to avoid overflow
        max_score = max(scores.values())
        exp_scores = {k: np.exp(v - max_score) for k, v in scores.items()}
        
        total = sum(exp_scores.values())
        if total == 0:
            return {k: 1.0 / len(scores) for k in scores.keys()}
        
        return {k: v / total for k, v in exp_scores.items()}
    
    def _get_top_n(self, scores: Dict[str, float], n: int) -> List[Tuple[str, float]]:
        """Get top N items by score"""
        if not scores:
            return []
        
        sorted_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_items[:n]
    
    def _get_default_preferences(self) -> Dict:
        """Return default preferences for new users"""
        return {
            'preferences': {
                'styles': {},
                'colors': {},
                'moods': {},
                'models': {}
            },
            'top_preferences': {
                'top_styles': [],
                'top_colors': [],
                'top_moods': [],
                'preferred_model': []
            },
            'total_interactions': 0
        }


# Example usage
if __name__ == '__main__':
    from datetime import datetime, timedelta
    
    learner = PreferenceLearner()
    
    # Simulate user history
    user_history = [
        {
            'model': 'diffusion',
            'style': 'abstract',
            'color': 'vibrant',
            'mood': 'energetic',
            'reward': 0.8,
            'timestamp': datetime.now() - timedelta(days=5)
        },
        {
            'model': 'diffusion',
            'style': 'abstract',
            'color': 'vibrant',
            'mood': 'playful',
            'reward': 0.9,
            'timestamp': datetime.now() - timedelta(days=4)
        },
        {
            'model': 'style-transfer',
            'style': 'impressionist',
            'color': 'muted',
            'mood': 'peaceful',
            'reward': 0.3,
            'timestamp': datetime.now() - timedelta(days=3)
        },
        {
            'model': 'diffusion',
            'style': 'surreal',
            'color': 'vibrant',
            'mood': 'mysterious',
            'reward': 0.7,
            'timestamp': datetime.now() - timedelta(days=2)
        },
        {
            'model': 'diffusion',
            'style': 'abstract',
            'color': 'neon',
            'mood': 'energetic',
            'reward': 0.85,
            'timestamp': datetime.now() - timedelta(days=1)
        }
    ]
    
    print("Learning user preferences...\n")
    profile = learner.learn_preferences(user_history)
    
    print("Top Preferences:")
    for key, value in profile['top_preferences'].items():
        print(f"  {key}: {value}")
    
    print("\nPatterns:")
    patterns = learner.identify_patterns(user_history)
    for key, value in patterns.items():
        print(f"  {key}: {value}")
    
    print("\nSuggested features for next generation:")
    suggestions = learner.suggest_next_features(profile, 3)
    for i, suggestion in enumerate(suggestions, 1):
        print(f"  {i}. {suggestion}")
    
    # Test prediction
    test_prompt = {
        'style': 'abstract',
        'color': 'vibrant',
        'mood': 'energetic',
        'model': 'diffusion'
    }
    
    score = learner.predict_preference(profile, test_prompt)
    print(f"\nPredicted preference for {test_prompt}: {score:.3f}")
