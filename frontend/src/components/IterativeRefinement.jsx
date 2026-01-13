import { useState } from 'react';

const IterativeRefinement = ({ initialPrompt, onApplyPrompt }) => {
  const [history, setHistory] = useState([
    { version: 0, prompt: initialPrompt, timestamp: new Date().toISOString(), isOriginal: true }
  ]);
  const [isRefining, setIsRefining] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selectedVersion, setSelectedVersion] = useState(0);

  const refinePrompt = async () => {
    if (isRefining) return;

    setIsRefining(true);

    try {
      const currentPrompt = history[history.length - 1].prompt;
      
      const response = await fetch('http://localhost:5001/api/llm/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          feedback: feedback || 'Make it more detailed and artistic'
        })
      });

      const data = await response.json();

      if (data.success) {
        const newVersion = {
          version: history.length,
          prompt: data.refined,
          explanation: data.explanation,
          alternatives: data.alternatives || [],
          timestamp: new Date().toISOString()
        };

        setHistory(prev => [...prev, newVersion]);
        setSelectedVersion(history.length);
        setFeedback('');
      }

    } catch (error) {
      console.error('Refinement error:', error);
    } finally {
      setIsRefining(false);
    }
  };

  const applyVersion = (version) => {
    if (onApplyPrompt) {
      onApplyPrompt(history[version].prompt);
    }
  };

  const getDiff = (oldText, newText) => {
    // Simple word-based diff
    const oldWords = oldText.split(' ');
    const newWords = newText.split(' ');
    
    return newWords.map((word, i) => {
      if (!oldWords.includes(word)) {
        return { word, type: 'added' };
      }
      return { word, type: 'same' };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-purple-200">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
          ✨ Iterative Prompt Refinement
        </h2>
        <p className="text-gray-600">
          Refine your prompt step by step with AI assistance
        </p>
      </div>

      {/* Refinement History */}
      <div className="space-y-4">
        {history.map((item, index) => (
          <div
            key={index}
            className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2 transition-all duration-200 ${
              selectedVersion === index
                ? 'border-purple-500 ring-4 ring-purple-200 scale-[1.02]'
                : 'border-purple-200 hover:border-purple-300'
            }`}
          >
            {/* Version Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  item.isOriginal
                    ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700'
                    : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700'
                }`}>
                  {item.isOriginal ? '📝 Original' : `🎨 Version ${item.version}`}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedVersion(index)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    selectedVersion === index
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  {selectedVersion === index ? '✓ Selected' : 'Select'}
                </button>
                <button
                  onClick={() => applyVersion(index)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  ✅ Apply
                </button>
              </div>
            </div>

            {/* Prompt Text */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-3">
              <div className="font-medium text-gray-800 leading-relaxed">
                {item.prompt}
              </div>
            </div>

            {/* Explanation (if available) */}
            {item.explanation && (
              <div className="bg-orange-50 rounded-xl p-4 mb-3 border-l-4 border-orange-400">
                <div className="text-sm font-semibold text-orange-700 mb-1">💡 Changes Made:</div>
                <div className="text-sm text-gray-700">{item.explanation}</div>
              </div>
            )}

            {/* Visual Diff (if not original) */}
            {!item.isOriginal && index > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">📊 Diff from previous:</div>
                <div className="flex flex-wrap gap-1 text-sm">
                  {getDiff(history[index - 1].prompt, item.prompt).map((part, i) => (
                    <span
                      key={i}
                      className={
                        part.type === 'added'
                          ? 'bg-green-200 text-green-800 px-1 rounded font-medium'
                          : 'text-gray-600'
                      }
                    >
                      {part.word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Alternatives (if available) */}
            {item.alternatives && item.alternatives.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-sm font-semibold text-gray-700">🔄 Alternative suggestions:</div>
                {item.alternatives.map((alt, i) => (
                  <div
                    key={i}
                    className="bg-blue-50 rounded-lg p-3 text-sm text-gray-700 border-l-4 border-blue-400"
                  >
                    {alt}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Refinement Controls */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-purple-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              💬 Feedback for next refinement (optional):
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., 'Make it more dramatic' or 'Add more color details'"
              className="w-full rounded-xl border-2 border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 px-4 py-3 resize-none transition-all duration-200"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {history.length} version{history.length !== 1 ? 's' : ''} • 
              {history.length < 5 ? ` ${5 - history.length} more refinements available` : ' Max refinements reached'}
            </div>
            <button
              onClick={refinePrompt}
              disabled={isRefining || history.length >= 5}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isRefining ? '⏳ Refining...' : '🎨 Refine Again'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 rounded-2xl p-4">
        <div className="flex items-center justify-around text-center">
          <div>
            <div className="text-2xl font-bold text-purple-700">{history.length}</div>
            <div className="text-sm text-gray-600">Versions</div>
          </div>
          <div className="w-px h-12 bg-purple-300"></div>
          <div>
            <div className="text-2xl font-bold text-pink-700">{selectedVersion}</div>
            <div className="text-sm text-gray-600">Selected</div>
          </div>
          <div className="w-px h-12 bg-purple-300"></div>
          <div>
            <div className="text-2xl font-bold text-orange-700">
              {history[selectedVersion]?.prompt.split(' ').length || 0}
            </div>
            <div className="text-sm text-gray-600">Words</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IterativeRefinement;
