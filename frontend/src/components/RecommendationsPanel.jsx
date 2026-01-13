import React, { useState, useEffect } from 'react';

const RecommendationsPanel = ({ userId, onSelectRecommendation }) => {
  const [recommendations, setRecommendations] = useState({
    personalized: [],
    trending: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('for-you');

  const fetchRecommendations = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/feedback/recommendations?userId=${userId}&count=5`);
      const data = await response.json();

      if (data.success) {
        setRecommendations({
          personalized: data.personalized || {},
          trending: data.trending || {}
        });
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleSelectPrompt = (recommendation) => {
    if (onSelectRecommendation) {
      onSelectRecommendation(recommendation);
    }
  };

  const renderPromptCard = (item, type) => (
    <div key={item.prompt || Math.random()} className="prompt-card" onClick={() => handleSelectPrompt(item)}>
      <div className="prompt-header">
        <span className={`prompt-type ${type}`}>
          {type === 'personalized' ? '✨ For You' : '🔥 Trending'}
        </span>
        {item.confidence && (
          <span className="confidence-badge">
            {Math.round(item.confidence * 100)}% match
          </span>
        )}
      </div>
      <p className="prompt-text">{item.prompt}</p>
      <div className="prompt-tags">
        {item.style && <span className="tag style-tag">{item.style}</span>}
        {item.color && <span className="tag color-tag">{item.color}</span>}
        {item.mood && <span className="tag mood-tag">{item.mood}</span>}
      </div>
    </div>
  );

  const renderPersonalizedSection = () => {
    const { topStyles, topColors, topMoods } = recommendations.personalized;

    return (
      <div className="recommendations-section">
        <div className="preferences-summary">
          <h3>Your Preferences</h3>
          <div className="preference-grid">
            {topStyles && topStyles.length > 0 && (
              <div className="preference-item">
                <span className="preference-label">Favorite Styles</span>
                <div className="preference-values">
                  {topStyles.map((style, idx) => (
                    <span key={idx} className="preference-badge">{style}</span>
                  ))}
                </div>
              </div>
            )}
            {topColors && topColors.length > 0 && (
              <div className="preference-item">
                <span className="preference-label">Favorite Colors</span>
                <div className="preference-values">
                  {topColors.map((color, idx) => (
                    <span key={idx} className="preference-badge color">{color}</span>
                  ))}
                </div>
              </div>
            )}
            {topMoods && topMoods.length > 0 && (
              <div className="preference-item">
                <span className="preference-label">Favorite Moods</span>
                <div className="preference-values">
                  {topMoods.map((mood, idx) => (
                    <span key={idx} className="preference-badge mood">{mood}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="suggested-prompts">
          <h3>Suggested for You</h3>
          <p className="section-description">Based on your preferences and feedback</p>
          {/* Generate sample prompts based on preferences */}
          {topStyles && topStyles.length > 0 && (
            <div className="prompt-grid">
              {topStyles.slice(0, 3).map((style, idx) => {
                const color = topColors?.[idx] || 'vibrant';
                const mood = topMoods?.[idx] || 'energetic';
                return renderPromptCard({
                  prompt: `${style} art with ${color} colors and ${mood} mood`,
                  style,
                  color,
                  mood,
                  confidence: 0.85 - (idx * 0.1)
                }, 'personalized');
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTrendingSection = () => {
    const { trendingModels, trendingStyles } = recommendations.trending;

    return (
      <div className="recommendations-section">
        <h3>🔥 Trending Now</h3>
        <p className="section-description">Popular among the community</p>

        {trendingStyles && trendingStyles.length > 0 && (
          <div className="trending-grid">
            {trendingStyles.map((item, idx) => (
              <div key={idx} className="trending-card">
                <div className="trending-icon">🎨</div>
                <div className="trending-info">
                  <h4>{item.style}</h4>
                  <span className="trending-count">{item.count} generations</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {trendingModels && trendingModels.length > 0 && (
          <div className="models-section">
            <h4>Popular Models</h4>
            <div className="models-grid">
              {trendingModels.map((item, idx) => (
                <div key={idx} className="model-card">
                  <span className="model-name">{item.model}</span>
                  <span className="model-count">{item.count} uses</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="recommendations-panel loading">
        <div className="loading-spinner"></div>
        <p>Loading recommendations...</p>
      </div>
    );
  }

  return (
    <div className="recommendations-panel">
      <div className="panel-header">
        <h2>Recommendations</h2>
        <button className="refresh-btn" onClick={fetchRecommendations}>
          🔄 Refresh
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'for-you' ? 'active' : ''}`}
          onClick={() => setActiveTab('for-you')}
        >
          ✨ For You
        </button>
        <button
          className={`tab ${activeTab === 'trending' ? 'active' : ''}`}
          onClick={() => setActiveTab('trending')}
        >
          🔥 Trending
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'for-you' && renderPersonalizedSection()}
        {activeTab === 'trending' && renderTrendingSection()}
      </div>
    </div>
  );
};

export default RecommendationsPanel;
