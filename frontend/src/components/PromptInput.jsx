import { useState } from 'react';
import PropTypes from 'prop-types';
import './PromptInput.css';

const PromptInput = ({ onAnalyze, onEnhance, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [charCount, setCharCount] = useState(0);
  const maxChars = 500;

  const handlePromptChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setPrompt(value);
      setCharCount(value.length);
    }
  };

  const handleAnalyze = () => {
    if (prompt.trim()) {
      onAnalyze(prompt.trim());
    }
  };

  const handleEnhance = () => {
    if (prompt.trim()) {
      onEnhance(prompt.trim());
    }
  };

  const handleKeyPress = (e) => {
    // Ctrl/Cmd + Enter to analyze
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleAnalyze();
    }
  };

  return (
    <div className="prompt-input-container">
      <div className="prompt-input-header">
        <h3>🎨 Describe Your Vision</h3>
        <span className={`char-counter ${charCount > maxChars * 0.9 ? 'warning' : ''}`}>
          {charCount} / {maxChars}
        </span>
      </div>

      <textarea
        className="prompt-textarea"
        value={prompt}
        onChange={handlePromptChange}
        onKeyDown={handleKeyPress}
        placeholder="Describe the artwork you want to create... (e.g., 'A serene mountain landscape at golden hour with misty valleys')"
        disabled={isLoading}
      />

      <div className="prompt-input-actions">
        <button
          className="btn btn-secondary"
          onClick={handleEnhance}
          disabled={!prompt.trim() || isLoading}
        >
          ✨ Enhance Prompt
        </button>
        <button
          className="btn btn-primary"
          onClick={handleAnalyze}
          disabled={!prompt.trim() || isLoading}
        >
          {isLoading ? '🔄 Analyzing...' : '🔍 Analyze'}
        </button>
      </div>

      <div className="prompt-input-hint">
        💡 Tip: Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to analyze quickly
      </div>
    </div>
  );
};

PromptInput.propTypes = {
  onAnalyze: PropTypes.func.isRequired,
  onEnhance: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

PromptInput.defaultProps = {
  isLoading: false
};

export default PromptInput;
