import PropTypes from 'prop-types';

const PromptAnalysis = ({ analysis }) => {
  if (!analysis) {
    return null;
  }

  const getSentimentEmoji = (sentiment) => {
    switch (sentiment?.label) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😔';
      default:
        return '😐';
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.label) {
      case 'positive':
        return { bg: 'bg-emerald-100', text: 'text-emerald-600', bar: 'bg-emerald-500' };
      case 'negative':
        return { bg: 'bg-red-100', text: 'text-red-600', bar: 'bg-red-500' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', bar: 'bg-gray-500' };
    }
  };

  const getMoodEmoji = (mood) => {
    const moodMap = {
      peaceful: '🕊️',
      dramatic: '⚡',
      mysterious: '🌙',
      playful: '🎨',
      ethereal: '✨',
      uplifting: '☀️',
      somber: '🌧️',
      neutral: '⚖️'
    };
    return moodMap[mood] || '🎭';
  };

  const pastelColors = [
    { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
  ];

  const sentimentColors = getSentimentColor(analysis.sentiment);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-3xl">📊</span>
          Prompt Analysis
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sentiment Card */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-100 hover:shadow-lg transition-all duration-200 transform hover:scale-105">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">{getSentimentEmoji(analysis.sentiment)}</span>
            <h4 className="text-lg font-bold text-gray-800">Sentiment</h4>
          </div>
          <div className={`text-2xl font-bold ${sentimentColors.text} mb-2 capitalize`}>
            {analysis.sentiment?.label || 'neutral'}
          </div>
          <div className="text-sm text-gray-600 mb-2">
            Confidence: {((analysis.sentiment?.score || 0.5) * 100).toFixed(0)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`${sentimentColors.bar} h-2.5 rounded-full transition-all duration-500`}
              style={{ width: `${(analysis.sentiment?.score || 0.5) * 100}%` }}
            />
          </div>
        </div>

        {/* Mood Card */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-100 hover:shadow-lg transition-all duration-200 transform hover:scale-105">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">{getMoodEmoji(analysis.mood)}</span>
            <h4 className="text-lg font-bold text-gray-800">Mood</h4>
          </div>
          <div className="text-2xl font-bold text-purple-600 capitalize">
            {analysis.mood || 'neutral'}
          </div>
        </div>

        {/* Keywords Card */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border-2 border-blue-100 hover:shadow-lg transition-all duration-200 transform hover:scale-105 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">🏷️</span>
            <h4 className="text-lg font-bold text-gray-800">Keywords</h4>
          </div>
          {analysis.keywords && analysis.keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.keywords.slice(0, 8).map((keyword, index) => {
                const color = pastelColors[index % pastelColors.length];
                return (
                  <span 
                    key={index} 
                    className={`${color.bg} ${color.text} px-3 py-1.5 rounded-full text-sm font-semibold border ${color.border} hover:scale-110 transition-transform duration-200`}
                  >
                    {keyword}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No keywords detected</p>
          )}
        </div>

        {/* Artistic Concepts Card */}
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-5 border-2 border-orange-100 hover:shadow-lg transition-all duration-200 transform hover:scale-105 md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">🎨</span>
            <h4 className="text-lg font-bold text-gray-800">Artistic Concepts</h4>
          </div>
          {analysis.artisticConcepts && analysis.artisticConcepts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.artisticConcepts.map((concept, index) => (
                <span 
                  key={index} 
                  className="bg-gradient-to-r from-orange-400 to-pink-400 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200"
                >
                  {concept}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No concepts detected</p>
          )}
        </div>

        {/* Suggested Styles Card */}
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-5 border-2 border-pink-100 hover:shadow-lg transition-all duration-200 transform hover:scale-105">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">🖼️</span>
            <h4 className="text-lg font-bold text-gray-800">Suggested Styles</h4>
          </div>
          {analysis.suggestedStyles && analysis.suggestedStyles.length > 0 ? (
            <div className="space-y-2">
              {analysis.suggestedStyles.slice(0, 5).map((style, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-700">
                  <span className="text-pink-500 font-bold">•</span>
                  <span className="text-sm font-medium">{style}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No styles suggested</p>
          )}
        </div>

        {/* Color Palette Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border-2 border-indigo-100 hover:shadow-lg transition-all duration-200 transform hover:scale-105">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">🎨</span>
            <h4 className="text-lg font-bold text-gray-800">Color Palette</h4>
          </div>
          {analysis.colorPalette && analysis.colorPalette.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.colorPalette.map((color, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-lg shadow-md border-2 border-white hover:scale-110 transition-transform duration-200" 
                       style={{ backgroundColor: color.toLowerCase() }}
                       title={color}
                  />
                  <span className="text-xs font-semibold text-gray-600">{color}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No colors detected</p>
          )}
        </div>
      </div>
    </div>
  );
};

PromptAnalysis.propTypes = {
  analysis: PropTypes.shape({
    sentiment: PropTypes.shape({
      label: PropTypes.string,
      score: PropTypes.number
    }),
    mood: PropTypes.string,
    keywords: PropTypes.arrayOf(PropTypes.string),
    artisticConcepts: PropTypes.arrayOf(PropTypes.string),
    suggestedStyles: PropTypes.arrayOf(PropTypes.string),
    colorPalette: PropTypes.arrayOf(PropTypes.string)
  })
};

export default PromptAnalysis;
