import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './PromptSuggestions.css';

const PromptSuggestions = ({ onSelectSuggestion, enhancedPrompt }) => {
  const [presets, setPresets] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('landscape');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/nlp/presets');
      const data = await response.json();
      if (data.success) {
        setPresets(data.presets);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch presets:', error);
      // Fallback presets
      setPresets({
        landscape: [
          "A serene mountain landscape at golden hour with misty valleys",
          "Dramatic coastal cliffs under stormy skies with crashing waves"
        ],
        portrait: [
          "Ethereal portrait with soft lighting and dreamy atmosphere",
          "Bold and dramatic portrait with high contrast shadows"
        ],
        abstract: [
          "Flowing abstract composition with vibrant gradients",
          "Geometric abstract with bold colors and sharp contrasts"
        ]
      });
      setIsLoading(false);
    }
  };

  const categories = Object.keys(presets);

  return (
    <div className="prompt-suggestions-container">
      <div className="suggestions-header">
        <h3>💡 Suggestions</h3>
      </div>

      {/* Enhanced Prompt Section */}
      {enhancedPrompt && (
        <div className="enhanced-section">
          <div className="enhanced-header">
            <span className="enhanced-icon">✨</span>
            <h4>Enhanced Prompt</h4>
          </div>
          <div 
            className="enhanced-prompt"
            onClick={() => onSelectSuggestion(enhancedPrompt)}
          >
            {enhancedPrompt}
          </div>
          <button 
            className="use-button"
            onClick={() => onSelectSuggestion(enhancedPrompt)}
          >
            Use This Prompt
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="category-tabs">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Preset Suggestions */}
      <div className="presets-list">
        {isLoading ? (
          <div className="loading-state">Loading suggestions...</div>
        ) : (
          presets[selectedCategory]?.map((preset, index) => (
            <div
              key={index}
              className="preset-item"
              onClick={() => onSelectSuggestion(preset)}
            >
              <div className="preset-text">{preset}</div>
              <button className="preset-use-btn">Use</button>
            </div>
          ))
        )}
      </div>

      {/* Quick Tips */}
      <div className="tips-section">
        <h4>💡 Quick Tips</h4>
        <ul className="tips-list">
          <li>Be specific about colors, lighting, and mood</li>
          <li>Mention artistic styles or famous artists</li>
          <li>Include composition details (close-up, wide angle, etc.)</li>
          <li>Add quality modifiers (highly detailed, 4k, etc.)</li>
        </ul>
      </div>
    </div>
  );
};

PromptSuggestions.propTypes = {
  onSelectSuggestion: PropTypes.func.isRequired,
  enhancedPrompt: PropTypes.string
};

export default PromptSuggestions;
