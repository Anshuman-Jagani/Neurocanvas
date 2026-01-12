import { useState } from 'react';
import ImageUploader from './ImageUploader';
import StyleGallery from './StyleGallery';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api/style-transfer';

export default function StyleTransfer() {
  const [contentImage, setContentImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);

  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [iterations, setIterations] = useState(300);
  const [styleWeight, setStyleWeight] = useState(1000000);
  const [contentWeight, setContentWeight] = useState(1);

  const handleGenerate = async () => {
    if (!contentImage || !selectedStyle) {
      setError('Please upload an image and select a style');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('content', contentImage);
      formData.append('styleId', selectedStyle);
      formData.append('iterations', iterations);
      formData.append('styleWeight', styleWeight);
      formData.append('contentWeight', contentWeight);

      // Submit job
      const response = await axios.post(`${API_BASE_URL}/generate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const { jobId: newJobId } = response.data;
      setJobId(newJobId);

      // Poll for status
      pollJobStatus(newJobId);

    } catch (err) {
      console.error('Error generating style transfer:', err);
      setError(err.response?.data?.error || 'Failed to generate style transfer');
      setIsProcessing(false);
    }
  };

  const pollJobStatus = async (jobId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/status/${jobId}`);
        const { status, progress: jobProgress, outputPath, error: jobError } = response.data;

        setProgress(jobProgress || 0);

        if (status === 'completed') {
          clearInterval(pollInterval);
          setResult(`http://localhost:5001${outputPath}`);
          setIsProcessing(false);
          setProgress(100);
        } else if (status === 'failed') {
          clearInterval(pollInterval);
          setError(jobError || 'Style transfer failed');
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('Error polling job status:', err);
        clearInterval(pollInterval);
        setError('Failed to check job status');
        setIsProcessing(false);
      }
    }, 2000); // Poll every 2 seconds

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (isProcessing) {
        setError('Job timeout - please try again');
        setIsProcessing(false);
      }
    }, 5 * 60 * 1000);
  };

  const handleDownload = () => {
    if (result) {
      const link = document.createElement('a');
      link.href = result;
      link.download = `styled-image-${Date.now()}.png`;
      link.click();
    }
  };

  const handleReset = () => {
    setContentImage(null);
    setSelectedStyle(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setJobId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Neural Style Transfer
        </h1>
        <p className="text-gray-600">
          Transform your photos with the artistic style of famous paintings
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Content Image Upload */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <ImageUploader
            label="Your Content Image"
            onImageSelect={setContentImage}
          />
        </div>

        {/* Style Selection */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <StyleGallery
            selectedStyle={selectedStyle}
            onStyleSelect={setSelectedStyle}
          />
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-lg font-semibold text-gray-900">
            Advanced Settings
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
          <div className="mt-4 grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Iterations: {iterations}
              </label>
              <input
                type="range"
                min="100"
                max="500"
                step="50"
                value={iterations}
                onChange={(e) => setIterations(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                More iterations = better quality but slower
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style Weight: {(styleWeight / 1000000).toFixed(1)}M
              </label>
              <input
                type="range"
                min="100000"
                max="10000000"
                step="100000"
                value={styleWeight}
                onChange={(e) => setStyleWeight(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Higher = more stylized
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Weight: {contentWeight}
              </label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={contentWeight}
                onChange={(e) => setContentWeight(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Higher = more content preserved
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="text-center mb-8">
        <button
          onClick={handleGenerate}
          disabled={!contentImage || !selectedStyle || isProcessing}
          className={`
            px-8 py-4 rounded-xl font-bold text-lg
            transition-all duration-200 transform
            ${!contentImage || !selectedStyle || isProcessing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white hover:shadow-xl hover:scale-105 shadow-lg'
            }
          `}
        >
          {isProcessing ? '⏳ Processing...' : '🎨 Generate Styled Image'}
        </button>
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Processing</span>
            <span className="text-sm font-bold text-purple-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            This may take 30-60 seconds on CPU... ⏱️
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
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
            Your Styled Image
          </h2>
          <img
            src={result}
            alt="Styled result"
            className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
          />
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-bold"
            >
              📥 Download Image
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-bold"
            >
              🔄 Create Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
