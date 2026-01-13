import React, { useState, useEffect } from 'react';

const UserProfile = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/feedback/stats?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const renderModelPreferences = () => {
    if (!stats?.mabStats?.modelPreferences) return null;

    const models = stats.mabStats.modelPreferences;
    const modelData = Object.entries(models).map(([name, data]) => ({
      name,
      ...data
    }));

    return (
      <div className="stats-card">
        <h3>📊 Model Preferences</h3>
        <div className="model-stats">
          {modelData.map((model) => (
            <div key={model.name} className="model-stat">
              <div className="model-header">
                <span className="model-name">{model.name}</span>
                <span className="model-score">{(model.score * 100).toFixed(0)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.max(0, (model.score + 1) * 50)}%` }}
                ></div>
              </div>
              <div className="model-details">
                <span>Pulls: {model.pulls}</span>
                <span>Wins: {model.wins}</span>
                <span>Losses: {model.losses}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPreferences = (title, icon, preferences) => {
    if (!preferences) return null;

    const sortedPrefs = Object.entries(preferences)
      .filter(([, value]) => value > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    if (sortedPrefs.length === 0) return null;

    return (
      <div className="stats-card">
        <h3>{icon} {title}</h3>
        <div className="preference-bars">
          {sortedPrefs.map(([name, value]) => (
            <div key={name} className="preference-bar">
              <span className="preference-name">{name}</span>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{ width: `${Math.min(100, (value / Math.max(...sortedPrefs.map(([, v]) => v))) * 100)}%` }}
                ></div>
              </div>
              <span className="preference-value">{value.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderInsights = () => {
    if (!stats?.insights) return null;

    const { insights } = stats;

    return (
      <div className="stats-card insights-card">
        <h3>💡 Insights</h3>
        <div className="insights-grid">
          <div className="insight-item">
            <span className="insight-label">Total Interactions</span>
            <span className="insight-value">{insights.totalInteractions || 0}</span>
          </div>
          <div className="insight-item">
            <span className="insight-label">Engagement Rate</span>
            <span className="insight-value">{insights.engagementRate || 0}%</span>
          </div>
          <div className="insight-item">
            <span className="insight-label">Most Active Hour</span>
            <span className="insight-value">{insights.mostActiveHour || 'N/A'}</span>
          </div>
          <div className="insight-item">
            <span className="insight-label">Avg Session</span>
            <span className="insight-value">{insights.avgSessionLength || 0} min</span>
          </div>
        </div>

        {insights.actionCounts && (
          <div className="action-breakdown">
            <h4>Activity Breakdown</h4>
            <div className="action-grid">
              {Object.entries(insights.actionCounts).map(([action, count]) => (
                <div key={action} className="action-item">
                  <span className="action-icon">
                    {action === 'rate' ? '⭐' : action === 'like' ? '👍' : action === 'favorite' ? '❤️' : action === 'share' ? '📤' : '💾'}
                  </span>
                  <span className="action-name">{action}</span>
                  <span className="action-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSummary = () => {
    if (!stats?.mabStats) return null;

    const { totalGenerations, totalFeedback, epsilon, bestModel } = stats.mabStats;

    return (
      <div className="profile-summary">
        <div className="summary-card">
          <div className="summary-icon">🎨</div>
          <div className="summary-info">
            <span className="summary-value">{totalGenerations || 0}</span>
            <span className="summary-label">Generations</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">💬</div>
          <div className="summary-info">
            <span className="summary-value">{totalFeedback || 0}</span>
            <span className="summary-label">Feedback Given</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">🎯</div>
          <div className="summary-info">
            <span className="summary-value">{(epsilon * 100).toFixed(0)}%</span>
            <span className="summary-label">Exploration</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">⭐</div>
          <div className="summary-info">
            <span className="summary-value">{bestModel?.model || 'N/A'}</span>
            <span className="summary-label">Best Model</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="user-profile loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="user-profile empty">
        <p>No data available. Start generating to see your profile!</p>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <h2>👤 Your Profile</h2>
        <button className="refresh-btn" onClick={fetchStats}>
          🔄 Refresh
        </button>
      </div>

      {renderSummary()}

      <div className="stats-grid">
        {renderModelPreferences()}
        {renderPreferences('Style Preferences', '🎨', stats.mabStats?.stylePreferences)}
        {renderPreferences('Color Preferences', '🎨', stats.mabStats?.colorPreferences)}
        {renderPreferences('Mood Preferences', '😊', stats.mabStats?.moodPreferences)}
        {renderInsights()}
      </div>
    </div>
  );
};

export default UserProfile;
