import React, { useState, useEffect } from 'react';

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

  const modelOptions = [
    { id: 'auto', icon: '🤖', name: 'Auto Select', desc: 'AI chooses best model(s)', color: 'from-purple-400 to-pink-400' },
    { id: 'diffusion', icon: '✨', name: 'Diffusion', desc: 'Text-to-image generation', color: 'from-blue-400 to-cyan-400' },
    { id: 'style-transfer', icon: '🎭', name: 'Style Transfer', desc: 'Artistic style application', color: 'from-orange-400 to-yellow-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
          <span className="text-4xl">🎨</span>
          Multi-Model Generation
        </h2>
        <p className="text-gray-600">Generate images using multiple AI models and compare results</p>
      </div>

      {/* Prompt Input */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            Describe Your Vision
          </h3>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
            prompt.length > 450 ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'
          }`}>
            {prompt.length} / 500
          </span>
        </div>
        <textarea
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-transparent focus:ring-4 focus:ring-pink-300 focus:outline-none transition-all duration-200 resize-none text-gray-800 placeholder-gray-400"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the artwork you want to create... (e.g., 'A serene mountain landscape at golden hour') ✨"
          disabled={loading}
          maxLength={500}
          rows={4}
        />
      </div>

      {/* Model Selection */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Select Models</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modelOptions.map((model) => (
            <label 
              key={model.id}
              className={`relative cursor-pointer group ${
                selectedModels.includes(model.id) ? 'scale-105' : ''
              } transition-transform duration-200`}
            >
              <input
                type="checkbox"
                checked={selectedModels.includes(model.id)}
                onChange={() => handleModelToggle(model.id)}
                disabled={loading || (model.id !== 'auto' && selectedModels.includes('auto'))}
                className="sr-only"
              />
              <div className={`p-5 rounded-xl border-2 transition-all duration-200 ${
                selectedModels.includes(model.id)
                  ? `bg-gradient-to-br ${model.color} border-transparent shadow-lg`
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{model.icon}</span>
                  <span className={`text-lg font-bold ${
                    selectedModels.includes(model.id) ? 'text-white' : 'text-gray-800'
                  }`}>
                    {model.name}
                  </span>
                </div>
                <p className={`text-sm ${
                  selectedModels.includes(model.id) ? 'text-white/90' : 'text-gray-600'
                }`}>
                  {model.desc}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Parameters */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Steps: <span className="text-purple-600">{params.steps}</span>
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={params.steps}
              onChange={(e) => setParams({...params, steps: parseInt(e.target.value)})}
              disabled={loading}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Guidance: <span className="text-pink-600">{params.guidance}</span>
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={params.guidance}
              onChange={(e) => setParams({...params, guidance: parseFloat(e.target.value)})}
              disabled={loading}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <button
          className="flex-1 px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
        >
          {loading ? '⏳ Generating...' : '🚀 Generate'}
        </button>
        {loading && (
          <button 
            className="px-6 py-4 bg-red-500 text-white font-semibold rounded-xl shadow-lg hover:bg-red-600 transition-colors"
            onClick={handleCancel}
          >
            ❌ Cancel
          </button>
        )}
      </div>

      {/* Status Display */}
      {jobStatus && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className={`px-4 py-2 rounded-full font-semibold capitalize ${
              jobStatus.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              jobStatus.status === 'processing' ? 'bg-blue-100 text-blue-700' :
              jobStatus.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
              'bg-red-100 text-red-700'
            }`}>
              {jobStatus.status}
            </span>
            {jobStatus.progress !== undefined && (
              <span className="text-lg font-bold text-purple-600">{jobStatus.progress}%</span>
            )}
          </div>
          {jobStatus.queuePosition > 0 && (
            <p className="text-gray-600 mb-2">Queue position: {jobStatus.queuePosition}</p>
          )}
          {jobStatus.progress !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${jobStatus.progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <span className="text-red-700 font-medium">{error}</span>
        </div>
      )}

      {/* Results Display */}
      {results && results.result && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-3xl">🎉</span>
            Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.result.map((result, index) => (
              <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-xl overflow-hidden border-2 border-gray-100 hover:shadow-xl transition-all duration-200">
                <div className="p-4 bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-between">
                  <span className="font-bold text-gray-800">{result.model}</span>
                  {result.score && (
                    <span className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-purple-600">
                      Score: {(result.score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                {result.imageUrl ? (
                  <img
                    src={`http://localhost:5001${result.imageUrl}`}
                    alt={`Generated by ${result.model}`}
                    className="w-full"
                  />
                ) : (
                  <div className="p-8 text-center bg-red-50">
                    <p className="text-red-600 font-medium">❌ {result.error || 'Generation failed'}</p>
                  </div>
                )}
                {result.metadata && (
                  <div className="p-3 bg-gray-50 text-sm text-gray-600">
                    ⏱️ Time: {(result.metadata.generationTime / 1000).toFixed(1)}s
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerationDashboard;
