"""
Multi-Armed Bandit Algorithms
Implements Epsilon-Greedy, UCB, and Thompson Sampling
"""

import numpy as np
import json
from typing import Dict, List, Tuple, Optional


class Arm:
    """Represents a single arm in the bandit"""
    
    def __init__(self, name: str):
        self.name = name
        self.pulls = 0
        self.wins = 0
        self.losses = 0
        self.total_reward = 0.0
        self.average_reward = 0.0
    
    def update(self, reward: float):
        """Update arm statistics after receiving reward"""
        self.pulls += 1
        self.total_reward += reward
        
        if reward > 0:
            self.wins += 1
        elif reward < 0:
            self.losses += 1
        
        # Update average reward
        self.average_reward = self.total_reward / self.pulls
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'name': self.name,
            'pulls': self.pulls,
            'wins': self.wins,
            'losses': self.losses,
            'average_reward': self.average_reward
        }


class MultiArmedBandit:
    """
    Multi-Armed Bandit implementation with multiple algorithms
    """
    
    def __init__(self, arm_names: List[str]):
        """
        Initialize MAB with arm names
        
        Args:
            arm_names: List of arm identifiers (e.g., ['style-transfer', 'diffusion'])
        """
        self.arms = {name: Arm(name) for name in arm_names}
        self.total_pulls = 0
    
    def epsilon_greedy(self, epsilon: float = 0.1) -> str:
        """
        Epsilon-Greedy algorithm
        
        With probability ε: explore (random selection)
        With probability 1-ε: exploit (best arm)
        
        Args:
            epsilon: Exploration rate (0 to 1)
        
        Returns:
            Selected arm name
        """
        # Explore: random selection
        if np.random.random() < epsilon:
            return np.random.choice(list(self.arms.keys()))
        
        # Exploit: select best arm
        best_arm = max(self.arms.values(), key=lambda arm: arm.average_reward)
        return best_arm.name
    
    def ucb(self, c: float = 2.0) -> str:
        """
        Upper Confidence Bound algorithm
        
        UCB = average_reward + c * sqrt(ln(total_pulls) / arm_pulls)
        
        Args:
            c: Exploration parameter (typically sqrt(2))
        
        Returns:
            Selected arm name
        """
        if self.total_pulls == 0:
            # First pull, select randomly
            return np.random.choice(list(self.arms.keys()))
        
        ucb_values = {}
        
        for name, arm in self.arms.items():
            if arm.pulls == 0:
                # Unplayed arms get infinite UCB
                ucb_values[name] = float('inf')
            else:
                # UCB formula
                exploitation = arm.average_reward
                exploration = c * np.sqrt(np.log(self.total_pulls) / arm.pulls)
                ucb_values[name] = exploitation + exploration
        
        # Select arm with highest UCB
        best_arm = max(ucb_values.items(), key=lambda x: x[1])
        return best_arm[0]
    
    def thompson_sampling(self) -> str:
        """
        Thompson Sampling with Beta distribution
        
        Models each arm with Beta(wins+1, losses+1)
        Samples from each distribution and selects highest
        
        Returns:
            Selected arm name
        """
        samples = {}
        
        for name, arm in self.arms.items():
            # Beta distribution parameters (add 1 for prior)
            alpha = arm.wins + 1
            beta = arm.losses + 1
            
            # Sample from Beta distribution
            sample = np.random.beta(alpha, beta)
            samples[name] = sample
        
        # Select arm with highest sample
        best_arm = max(samples.items(), key=lambda x: x[1])
        return best_arm[0]
    
    def select_arm(self, algorithm: str = 'epsilon-greedy', **kwargs) -> str:
        """
        Select arm using specified algorithm
        
        Args:
            algorithm: 'epsilon-greedy', 'ucb', or 'thompson-sampling'
            **kwargs: Algorithm-specific parameters
        
        Returns:
            Selected arm name
        """
        if algorithm == 'epsilon-greedy':
            epsilon = kwargs.get('epsilon', 0.1)
            return self.epsilon_greedy(epsilon)
        elif algorithm == 'ucb':
            c = kwargs.get('c', 2.0)
            return self.ucb(c)
        elif algorithm == 'thompson-sampling':
            return self.thompson_sampling()
        else:
            raise ValueError(f"Unknown algorithm: {algorithm}")
    
    def update_arm(self, arm_name: str, reward: float):
        """
        Update arm statistics after receiving reward
        
        Args:
            arm_name: Name of the arm that was pulled
            reward: Reward received (-1 to 1)
        """
        if arm_name not in self.arms:
            raise ValueError(f"Unknown arm: {arm_name}")
        
        self.arms[arm_name].update(reward)
        self.total_pulls += 1
    
    def get_statistics(self) -> Dict:
        """
        Get statistics for all arms
        
        Returns:
            Dictionary with arm statistics
        """
        return {
            'total_pulls': self.total_pulls,
            'arms': {name: arm.to_dict() for name, arm in self.arms.items()}
        }
    
    def get_best_arm(self) -> Tuple[str, float]:
        """
        Get the arm with highest average reward
        
        Returns:
            Tuple of (arm_name, average_reward)
        """
        if not self.arms:
            return None, 0.0
        
        best_arm = max(self.arms.values(), key=lambda arm: arm.average_reward)
        return best_arm.name, best_arm.average_reward
    
    def calculate_regret(self, optimal_reward: float) -> float:
        """
        Calculate cumulative regret
        
        Regret = optimal_reward * total_pulls - sum(actual_rewards)
        
        Args:
            optimal_reward: Reward of the optimal arm
        
        Returns:
            Cumulative regret
        """
        total_actual_reward = sum(arm.total_reward for arm in self.arms.values())
        optimal_total = optimal_reward * self.total_pulls
        return optimal_total - total_actual_reward
    
    def save(self, filepath: str):
        """Save MAB state to file"""
        state = {
            'total_pulls': self.total_pulls,
            'arms': {name: arm.to_dict() for name, arm in self.arms.items()}
        }
        
        with open(filepath, 'w') as f:
            json.dump(state, f, indent=2)
    
    @classmethod
    def load(cls, filepath: str) -> 'MultiArmedBandit':
        """Load MAB state from file"""
        with open(filepath, 'r') as f:
            state = json.load(f)
        
        # Create MAB instance
        arm_names = list(state['arms'].keys())
        mab = cls(arm_names)
        
        # Restore state
        mab.total_pulls = state['total_pulls']
        for name, arm_data in state['arms'].items():
            arm = mab.arms[name]
            arm.pulls = arm_data['pulls']
            arm.wins = arm_data['wins']
            arm.losses = arm_data['losses']
            arm.average_reward = arm_data['average_reward']
            arm.total_reward = arm.average_reward * arm.pulls
        
        return mab


# Example usage and testing
if __name__ == '__main__':
    # Create MAB with two models
    mab = MultiArmedBandit(['style-transfer', 'diffusion'])
    
    print("Testing Multi-Armed Bandit Algorithms\n")
    print("=" * 50)
    
    # Simulate 20 rounds
    for i in range(20):
        # Try different algorithms
        if i < 7:
            arm = mab.epsilon_greedy(epsilon=0.2)
            algo = "Epsilon-Greedy"
        elif i < 14:
            arm = mab.ucb()
            algo = "UCB"
        else:
            arm = mab.thompson_sampling()
            algo = "Thompson Sampling"
        
        # Simulate reward (diffusion is slightly better)
        if arm == 'diffusion':
            reward = np.random.normal(0.6, 0.2)
        else:
            reward = np.random.normal(0.4, 0.2)
        
        reward = np.clip(reward, -1, 1)
        
        # Update arm
        mab.update_arm(arm, reward)
        
        print(f"Round {i+1}: {algo} selected '{arm}', reward={reward:.3f}")
    
    print("\n" + "=" * 50)
    print("Final Statistics:")
    stats = mab.get_statistics()
    for arm_name, arm_stats in stats['arms'].items():
        print(f"\n{arm_name}:")
        print(f"  Pulls: {arm_stats['pulls']}")
        print(f"  Wins: {arm_stats['wins']}")
        print(f"  Losses: {arm_stats['losses']}")
        print(f"  Avg Reward: {arm_stats['average_reward']:.3f}")
    
    best_arm, best_reward = mab.get_best_arm()
    print(f"\nBest arm: {best_arm} (avg reward: {best_reward:.3f})")
