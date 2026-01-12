import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const PromptInput = ({ onAnalyze, onEnhance, isLoading, value }) => {
  const [prompt, setPrompt] = useState(value || '');
  const [charCount, setCharCount] = useState((value || '').length);
  const maxChars = 500;
  const prevValueRef = useRef(value);

  // Sync internal state with external value prop when it changes
  useEffect(() => {
    if (value !== prevValueRef.current) {
      setPrompt(value || '');
      setCharCount((value || '').length);
      prevValueRef.current = value;
    }
  }, [value]);

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
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 transform transition-all duration-200 hover:shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">🎨</span>
          Describe Your Vision
        </h3>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
          charCount > maxChars * 0.9 
            ? 'bg-red-100 text-red-600' 
            : 'bg-purple-100 text-purple-600'
        }`}>
          {charCount} / {maxChars}
        </span>
      </div>

      <textarea
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-transparent focus:ring-4 focus:ring-pink-300 focus:outline-none transition-all duration-200 resize-none text-gray-800 placeholder-gray-400"
        value={prompt}
        onChange={handlePromptChange}
        onKeyDown={handleKeyPress}
        placeholder="Describe the artwork you want to create... (e.g., 'A serene mountain landscape at golden hour with misty valleys') ✨"
        disabled={isLoading}
        rows={4}
      />

      <div className="flex items-center gap-3 mt-4">
        <button
          className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-400 to-pink-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          onClick={handleEnhance}
          disabled={!prompt.trim() || isLoading}
        >
          ✨ Enhance Prompt
        </button>
        <button
          className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          onClick={handleAnalyze}
          disabled={!prompt.trim() || isLoading}
        >
          {isLoading ? '🔄 Analyzing...' : '🔍 Analyze'}
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          💡 Tip: Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Enter</kbd> to analyze quickly
        </p>
      </div>
    </div>
  );
};


PromptInput.propTypes = {
  onAnalyze: PropTypes.func.isRequired,
  onEnhance: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  value: PropTypes.string
};

PromptInput.defaultProps = {
  isLoading: false,
  value: ''
};

export default PromptInput;
