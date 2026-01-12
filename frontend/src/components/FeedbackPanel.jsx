import React, { useState } from 'react';
import './FeedbackPanel.css';

const FeedbackPanel = ({ generationId, model, metadata = {}, onFeedback }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [userId] = useState(() => 'user_' + Math.random().toString(36).substr(2, 9));

  const handleRate = async (stars) => {
    setRating(stars);
    setFeedbackGiven(true);

    try {
      const response = await fetch('http://localhost:5001/api/feedback/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          generationId,
          model,
          stars,
          metadata
        })
      });

      const data = await response.json();
      if (onFeedback) onFeedback('rate', { stars, ...data });
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setFeedbackGiven(true);

    try {
      const response = await fetch('http://localhost:5001/api/feedback/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          generationId,
          model,
          liked: newLiked,
          metadata
        })
      });

      const data = await response.json();
      if (onFeedback) onFeedback('like', { liked: newLiked, ...data });
    } catch (error) {
      console.error('Error submitting like:', error);
    }
  };

  const handleFavorite = async () => {
    const newFavorited = !favorited;
    setFavorited(newFavorited);
    setFeedbackGiven(true);

    try {
      const response = await fetch('http://localhost:5001/api/feedback/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          generationId,
          model,
          favorited: newFavorited,
          metadata
        })
      });

      const data = await response.json();
      if (onFeedback) onFeedback('favorite', { favorited: newFavorited, ...data });
    } catch (error) {
      console.error('Error submitting favorite:', error);
    }
  };

  const handleShare = async () => {
    setFeedbackGiven(true);

    try {
      const response = await fetch('http://localhost:5001/api/feedback/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          generationId,
          model,
          platform: 'clipboard',
          metadata
        })
      });

      const data = await response.json();
      if (onFeedback) onFeedback('share', data);

      // Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  const handleDownload = async () => {
    setFeedbackGiven(true);

    try {
      const response = await fetch('http://localhost:5001/api/feedback/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          generationId,
          model,
          metadata
        })
      });

      const data = await response.json();
      if (onFeedback) onFeedback('download', data);
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  };

  return (
    <div className="feedback-panel">
      <div className="feedback-header">
        <h3>How do you like this result?</h3>
        {feedbackGiven && (
          <span className="feedback-thanks">✨ Thanks for your feedback!</span>
        )}
      </div>

      {/* Star Rating */}
      <div className="rating-section">
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`Rate ${star} stars`}
            >
              ★
            </button>
          ))}
        </div>
        {rating > 0 && (
          <span className="rating-text">
            {rating === 5 ? 'Amazing!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Okay' : 'Not great'}
          </span>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button
          className={`action-btn like-btn ${liked ? 'active' : ''}`}
          onClick={handleLike}
          aria-label="Like"
        >
          <span className="icon">👍</span>
          <span className="label">{liked ? 'Liked' : 'Like'}</span>
        </button>

        <button
          className={`action-btn favorite-btn ${favorited ? 'active' : ''}`}
          onClick={handleFavorite}
          aria-label="Favorite"
        >
          <span className="icon">❤️</span>
          <span className="label">{favorited ? 'Favorited' : 'Favorite'}</span>
        </button>

        <button
          className="action-btn share-btn"
          onClick={handleShare}
          aria-label="Share"
        >
          <span className="icon">📤</span>
          <span className="label">Share</span>
        </button>

        <button
          className="action-btn download-btn"
          onClick={handleDownload}
          aria-label="Download"
        >
          <span className="icon">💾</span>
          <span className="label">Download</span>
        </button>
      </div>

      {/* Comment Section */}
      <div className="comment-section">
        <button
          className="toggle-comment-btn"
          onClick={() => setShowComment(!showComment)}
        >
          💬 {showComment ? 'Hide' : 'Add'} Comment
        </button>

        {showComment && (
          <div className="comment-input-wrapper">
            <textarea
              className="comment-input"
              placeholder="Share your thoughts... (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPanel;
