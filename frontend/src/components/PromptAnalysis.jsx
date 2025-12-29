import PropTypes from 'prop-types';
import './PromptAnalysis.css';

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
        return '#4ade80';
      case 'negative':
        return '#f87171';
      default:
        return '#94a3b8';
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

  return (
    <div className="prompt-analysis-container">
      <div className="analysis-header">
        <h3>📊 Prompt Analysis</h3>
      </div>

      <div className="analysis-grid">
        {/* Sentiment */}
        <div className="analysis-card sentiment-card">
          <div className="card-header">
            <span className="card-icon">{getSentimentEmoji(analysis.sentiment)}</span>
            <h4>Sentiment</h4>
          </div>
          <div className="sentiment-content">
            <div 
              className="sentiment-label"
              style={{ color: getSentimentColor(analysis.sentiment) }}
            >
              {analysis.sentiment?.label || 'neutral'}
            </div>
            <div className="sentiment-score">
              Confidence: {((analysis.sentiment?.score || 0.5) * 100).toFixed(0)}%
            </div>
            <div className="sentiment-bar">
              <div 
                className="sentiment-fill"
                style={{ 
                  width: `${(analysis.sentiment?.score || 0.5) * 100}%`,
                  background: getSentimentColor(analysis.sentiment)
                }}
              />
            </div>
          </div>
        </div>

        {/* Mood */}
        <div className="analysis-card mood-card">
          <div className="card-header">
            <span className="card-icon">{getMoodEmoji(analysis.mood)}</span>
            <h4>Mood</h4>
          </div>
          <div className="mood-content">
            <div className="mood-label">{analysis.mood || 'neutral'}</div>
          </div>
        </div>

        {/* Keywords */}
        <div className="analysis-card keywords-card">
          <div className="card-header">
            <span className="card-icon">🏷️</span>
            <h4>Keywords</h4>
          </div>
          <div className="keywords-content">
            {analysis.keywords && analysis.keywords.length > 0 ? (
              <div className="keyword-tags">
                {analysis.keywords.slice(0, 8).map((keyword, index) => (
                  <span key={index} className="keyword-tag">
                    {keyword}
                  </span>
                ))}
              </div>
            ) : (
              <p className="no-data">No keywords detected</p>
            )}
          </div>
        </div>

        {/* Artistic Concepts */}
        <div className="analysis-card concepts-card">
          <div className="card-header">
            <span className="card-icon">🎨</span>
            <h4>Artistic Concepts</h4>
          </div>
          <div className="concepts-content">
            {analysis.artisticConcepts && analysis.artisticConcepts.length > 0 ? (
              <div className="concept-badges">
                {analysis.artisticConcepts.map((concept, index) => (
                  <span key={index} className="concept-badge">
                    {concept}
                  </span>
                ))}
              </div>
            ) : (
              <p className="no-data">No concepts detected</p>
            )}
          </div>
        </div>

        {/* Suggested Styles */}
        <div className="analysis-card styles-card">
          <div className="card-header">
            <span className="card-icon">🖼️</span>
            <h4>Suggested Styles</h4>
          </div>
          <div className="styles-content">
            {analysis.suggestedStyles && analysis.suggestedStyles.length > 0 ? (
              <div className="style-list">
                {analysis.suggestedStyles.slice(0, 5).map((style, index) => (
                  <div key={index} className="style-item">
                    <span className="style-bullet">•</span>
                    {style}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No styles suggested</p>
            )}
          </div>
        </div>

        {/* Color Palette */}
        <div className="analysis-card colors-card">
          <div className="card-header">
            <span className="card-icon">🎨</span>
            <h4>Color Palette</h4>
          </div>
          <div className="colors-content">
            {analysis.colorPalette && analysis.colorPalette.length > 0 ? (
              <div className="color-chips">
                {analysis.colorPalette.map((color, index) => (
                  <div key={index} className="color-chip">
                    {color}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No colors detected</p>
            )}
          </div>
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
