import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

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

  const categoryColors = {
    landscape: { bg: 'bg-emerald-100', text: 'text-emerald-700', active: 'bg-gradient-to-r from-emerald-400 to-teal-400' },
    portrait: { bg: 'bg-purple-100', text: 'text-purple-700', active: 'bg-gradient-to-r from-purple-400 to-pink-400' },
    abstract: { bg: 'bg-orange-100', text: 'text-orange-700', active: 'bg-gradient-to-r from-orange-400 to-yellow-400' },
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-3xl">💡</span>
        <h3 className="text-2xl font-bold text-gray-800">Suggestions</h3>
      </div>

      {/* Enhanced Prompt Section */}
      {enhancedPrompt && (
        <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-pink-200 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">✨</span>
            <h4 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Enhanced Prompt
            </h4>
          </div>
          <div 
            className="bg-white/80 rounded-lg p-4 mb-3 text-gray-700 cursor-pointer hover:bg-white hover:shadow-md transition-all duration-200 border border-purple-100"
            onClick={() => onSelectSuggestion(enhancedPrompt)}
          >
            {enhancedPrompt}
          </div>
          <button 
            className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200"
            onClick={() => onSelectSuggestion(enhancedPrompt)}
          >
            ✨ Use This Prompt
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const colors = categoryColors[category] || { bg: 'bg-blue-100', text: 'text-blue-700', active: 'bg-gradient-to-r from-blue-400 to-cyan-400' };
          return (
            <button
              key={category}
              className={`px-4 py-2 rounded-xl font-semibold capitalize transition-all duration-200 transform hover:scale-105 ${
                selectedCategory === category
                  ? `${colors.active} text-white shadow-lg`
                  : `${colors.bg} ${colors.text} hover:shadow-md`
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Preset Suggestions */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600">Loading suggestions...</p>
          </div>
        ) : (
          presets[selectedCategory]?.map((preset, index) => {
            const colors = [
              'from-pink-100 to-purple-100 border-pink-200',
              'from-orange-100 to-yellow-100 border-orange-200',
              'from-blue-100 to-cyan-100 border-blue-200',
              'from-emerald-100 to-teal-100 border-emerald-200',
              'from-purple-100 to-indigo-100 border-purple-200',
            ];
            const colorClass = colors[index % colors.length];
            
            return (
              <div
                key={index}
                className={`bg-gradient-to-br ${colorClass} rounded-xl p-4 border-2 cursor-pointer hover:shadow-lg transform hover:scale-102 transition-all duration-200 group`}
                onClick={() => onSelectSuggestion(preset)}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-gray-700 flex-1 font-medium">{preset}</p>
                  <button className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-sm font-semibold shadow-sm group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-purple-500 group-hover:text-white transition-all duration-200">
                    Use
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-5 border-2 border-yellow-200">
        <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-2xl">💡</span>
          Quick Tips
        </h4>
        <ul className="space-y-2">
          {[
            'Be specific about colors, lighting, and mood',
            'Mention artistic styles or famous artists',
            'Include composition details (close-up, wide angle, etc.)',
            'Add quality modifiers (highly detailed, 4k, etc.)'
          ].map((tip, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-orange-500 font-bold mt-0.5">✓</span>
              <span>{tip}</span>
            </li>
          ))}
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
