import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api/diffusion';

export default function DiffusionGenerator() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showNegative, setShowNegative] = useState(false);
  
  // Parameters
  const [steps, setSteps] = useState(25);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [imageSize, setImageSize] = useState('512x512');
  const [seed, setSeed] = useState('');
  
  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  
  // Presets
  const [presets, setPresets] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Load presets on mount
  useState(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/presets`);
      setPresets(response.data);
    } catch (err) {
      console.error('Error fetching presets:', err);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);
    setEstimatedTime('2-5 minutes');

    try {
      const [width, height] = imageSize.split('x').map(Number);
      
      const response = await axios.post(`${API_BASE_URL}/generate`, {
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim(),
        steps,
        guidanceScale,
        width,
        height,
        seed: seed ? parseInt(seed) : null
      });

      const { jobId } = response.data;
      pollJobStatus(jobId);

    } catch (err) {
      console.error('Error generating image:', err);
      setError(err.response?.data?.error || 'Failed to generate image');
      setIsProcessing(false);
    }
  };

  const pollJobStatus = async (jobId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/status/${jobId}`);
        const { status, progress: jobProgress, outputPath, error: jobError, estimatedTimeRemaining } = response.data;

        setProgress(jobProgress || 0);
        
        if (estimatedTimeRemaining) {
          const minutes = Math.floor(estimatedTimeRemaining / 60);
          const seconds = estimatedTimeRemaining % 60;
          setEstimatedTime(`~${minutes}m ${seconds}s remaining`);
        }

        if (status === 'completed') {
          clearInterval(pollInterval);
          setResult(`http://localhost:5001${outputPath}`);
          setIsProcessing(false);
          setProgress(100);
          setEstimatedTime(null);
        } else if (status === 'failed') {
          clearInterval(pollInterval);
          setError(jobError || 'Generation failed');
          setIsProcessing(false);
          setEstimatedTime(null);
        }
      } catch (err) {
        console.error('Error polling job status:', err);
        clearInterval(pollInterval);
        setError('Failed to check job status');
        setIsProcessing(false);
      }
    }, 3000); // Poll every 3 seconds

    // Timeout after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (isProcessing) {
        setError('Generation timeout - please try again');
        setIsProcessing(false);
      }
    }, 10 * 60 * 1000);
  };

  const handlePresetClick = (presetPrompt, params) => {
    setPrompt(presetPrompt);
    if (params) {
      setSteps(params.steps || 25);
      setGuidanceScale(params.guidanceScale || 7.5);
    }
  };

  const handleDownload = () => {
    if (result) {
      const link = document.createElement('a');
      link.href = result;
      link.download = `diffusion-${Date.now()}.png`;
      link.click();
    }
  };

  const handleReset = () => {
    setPrompt('');
    setNegativePrompt('');
    setResult(null);
    setError(null);
    setProgress(0);
    setSeed('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          AI Image Generation
        </h1>
        <p className="text-gray-600">
          Create stunning images from text descriptions using Stable Diffusion
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Input Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prompt Input */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe Your Image
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A serene mountain landscape at sunset, oil painting style, highly detailed..."
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">{prompt.length} / 500 characters</span>
              <button
                onClick={() => setShowNegative(!showNegative)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showNegative ? 'Hide' : 'Add'} Negative Prompt
              </button>
            </div>

            {/* Negative Prompt */}
            {showNegative && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Negative Prompt (Optional)
                </label>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Things to avoid: blurry, low quality, distorted..."
                  rows="2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            )}
          </div>

          {/* Parameters */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left mb-4"
            >
              <span className="text-lg font-semibold text-gray-900">
                Generation Settings
              </span>
              <svg
                className={`w-5 h-5 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdvanced && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inference Steps: {steps}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={steps}
                    onChange={(e) => setSteps(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    More steps = better quality but slower (recommended: 20-30)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guidance Scale: {guidanceScale}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={guidanceScale}
                    onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How closely to follow the prompt (recommended: 7-10)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Size
                  </label>
                  <select
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="512x512">512 × 512 (Fast)</option>
                    <option value="768x768">768 × 768 (Slower)</option>
                    <option value="512x768">512 × 768 (Portrait)</option>
                    <option value="768x512">768 × 512 (Landscape)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seed (Optional)
                  </label>
                  <input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    placeholder="Random"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use same seed for reproducible results
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isProcessing}
            className={`
              w-full px-8 py-4 rounded-lg font-semibold text-lg
              transition-all duration-200 transform
              ${!prompt.trim() || isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 hover:scale-105 shadow-lg'
              }
            `}
          >
            {isProcessing ? 'Generating...' : 'Generate Image'}
          </button>

          {/* Progress */}
          {isProcessing && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Generating</span>
                <span className="text-sm font-medium text-purple-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {estimatedTime && (
                <p className="text-sm text-gray-600 mt-2 text-center">
                  {estimatedTime}
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Your Generated Image
              </h2>
              <img
                src={result}
                alt="Generated result"
                className="w-full rounded-lg shadow-lg"
              />
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                >
                  Download Image
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                >
                  Generate Another
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Presets */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Prompt Examples
            </h3>
            {presets?.categories?.map((category, idx) => (
              <div key={idx} className="mb-4">
                <button
                  onClick={() => setSelectedCategory(selectedCategory === idx ? null : idx)}
                  className="w-full text-left font-medium text-gray-700 hover:text-gray-900 mb-2"
                >
                  {category.name} →
                </button>
                {selectedCategory === idx && (
                  <div className="space-y-2 pl-2">
                    {category.prompts.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handlePresetClick(preset.text, preset.parameters)}
                        className="w-full text-left text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 p-2 rounded transition-colors"
                      >
                        {preset.text.substring(0, 60)}...
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              💡 Tips
            </h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Be specific and descriptive</li>
              <li>• Mention art style or medium</li>
              <li>• Add lighting and atmosphere</li>
              <li>• Use quality modifiers (detailed, professional, 8k)</li>
              <li>• Generation takes 2-5 minutes on CPU</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
