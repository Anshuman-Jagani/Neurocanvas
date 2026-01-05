import React, { useState, useEffect } from 'react';
import './GenerationDashboard.css';

const GenerationDashboard = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState(['auto']);
  const [params, setParams] = useState({
    steps: 20,
    guidance: 7.5,
    width: 512,
    height: 512
  });
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Poll for job status
  useEffect(() => {
    if (!jobId || jobStatus?.status === 'completed' || jobStatus?.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/generate/${jobId}/status`);
        const data = await response.json();
        setJobStatus(data);

        if (data.status === 'completed') {
          // Fetch results
          const resultResponse = await fetch(`http://localhost:5001/api/generate/${jobId}/result`);
          const resultData = await resultResponse.json();
          setResults(resultData);
          setLoading(false);
        } else if (data.status === 'failed') {
          setError(data.error || 'Generation failed');
          setLoading(false);
        }
      } catch (err) {
        console.error('Status check error:', err);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  const handleModelToggle = (model) => {
    if (model === 'auto') {
      setSelectedModels(['auto']);
    } else {
      const newModels = selectedModels.filter(m => m !== 'auto');
      if (newModels.includes(model)) {
        const filtered = newModels.filter(m => m !== model);
        setSelectedModels(filtered.length > 0 ? filtered : ['auto']);
      } else {
        setSelectedModels([...newModels, model]);
      }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setJobStatus(null);

    try {
      const response = await fetch('http://localhost:5001/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          models: selectedModels,
          params,
          userId: 'demo-user'
        })
      });

      const data = await response.json();

      if (data.success) {
        setJobId(data.jobId);
        setJobStatus({
          status: 'pending',
          queuePosition: data.queuePosition
        });
      } else {
        setError(data.error || 'Failed to start generation');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!jobId) return;

    try {
      await fetch(`http://localhost:5001/api/generate/${jobId}`, {
        method: 'DELETE'
      });
      setLoading(false);
      setJobId(null);
      setJobStatus(null);
    } catch (err) {
      console.error('Cancel error:', err);
    }
  };

  return (
    <div className="generation-dashboard">
      <div className="dashboard-header">
        <h2>🎨 Multi-Model Generation</h2>
        <p>Generate images using multiple AI models and compare results</p>
      </div>

      <div className="dashboard-content">
        {/* Prompt Input */}
        <div className="prompt-section">
          <div className="prompt-input-header">
            <h3>🎨 Describe Your Vision</h3>
            <span className="char-counter">{prompt.length} / 500</span>
          </div>
          <textarea
            className="prompt-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the artwork you want to create... (e.g., 'A serene mountain landscape at golden hour')"
            disabled={loading}
            maxLength={500}
            rows={4}
          />
        </div>

        {/* Model Selection */}
        <div className="model-selection">
          <h3>Select Models</h3>
          <div className="model-options">
            <label className={`model-option ${selectedModels.includes('auto') ? 'selected' : ''}`}>
              <input
                type="checkbox"
                checked={selectedModels.includes('auto')}
                onChange={() => handleModelToggle('auto')}
                disabled={loading}
              />
              <span className="model-icon">🤖</span>
              <span className="model-name">Auto Select</span>
              <span className="model-desc">AI chooses best model(s)</span>
            </label>

            <label className={`model-option ${selectedModels.includes('diffusion') ? 'selected' : ''}`}>
              <input
                type="checkbox"
                checked={selectedModels.includes('diffusion')}
                onChange={() => handleModelToggle('diffusion')}
                disabled={loading || selectedModels.includes('auto')}
              />
              <span className="model-icon">✨</span>
              <span className="model-name">Diffusion</span>
              <span className="model-desc">Text-to-image generation</span>
            </label>

            <label className={`model-option ${selectedModels.includes('style-transfer') ? 'selected' : ''}`}>
              <input
                type="checkbox"
                checked={selectedModels.includes('style-transfer')}
                onChange={() => handleModelToggle('style-transfer')}
                disabled={loading || selectedModels.includes('auto')}
              />
              <span className="model-icon">🎭</span>
              <span className="model-name">Style Transfer</span>
              <span className="model-desc">Artistic style application</span>
            </label>
          </div>
        </div>

        {/* Parameters */}
        <div className="parameters-section">
          <h3>Parameters</h3>
          <div className="param-grid">
            <div className="param-item">
              <label>Steps: {params.steps}</label>
              <input
                type="range"
                min="10"
                max="50"
                value={params.steps}
                onChange={(e) => setParams({...params, steps: parseInt(e.target.value)})}
                disabled={loading}
              />
            </div>
            <div className="param-item">
              <label>Guidance: {params.guidance}</label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={params.guidance}
                onChange={(e) => setParams({...params, guidance: parseFloat(e.target.value)})}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="btn-generate"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? '⏳ Generating...' : '🚀 Generate'}
          </button>
          {loading && (
            <button className="btn-cancel" onClick={handleCancel}>
              ❌ Cancel
            </button>
          )}
        </div>

        {/* Status Display */}
        {jobStatus && (
          <div className="status-display">
            <div className="status-header">
              <span className={`status-badge status-${jobStatus.status}`}>
                {jobStatus.status}
              </span>
              {jobStatus.progress !== undefined && (
                <span className="progress-text">{jobStatus.progress}%</span>
              )}
            </div>
            {jobStatus.queuePosition > 0 && (
              <p>Queue position: {jobStatus.queuePosition}</p>
            )}
            {jobStatus.progress !== undefined && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${jobStatus.progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-display">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Results Display */}
        {results && results.result && (
          <div className="results-section">
            <h3>Results</h3>
            <div className="results-grid">
              {results.result.map((result, index) => (
                <div key={index} className="result-card">
                  <div className="result-header">
                    <span className="model-badge">{result.model}</span>
                    {result.score && (
                      <span className="score-badge">
                        Score: {(result.score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {result.imageUrl ? (
                    <img
                      src={`http://localhost:5001${result.imageUrl}`}
                      alt={`Generated by ${result.model}`}
                      className="result-image"
                    />
                  ) : (
                    <div className="result-error">
                      <p>❌ {result.error || 'Generation failed'}</p>
                    </div>
                  )}
                  {result.metadata && (
                    <div className="result-metadata">
                      <small>Time: {(result.metadata.generationTime / 1000).toFixed(1)}s</small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerationDashboard;
