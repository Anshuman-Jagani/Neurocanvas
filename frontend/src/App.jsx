import { useState } from 'react'
import StyleTransfer from './components/StyleTransfer'
import PromptInput from './components/PromptInput'
import PromptAnalysis from './components/PromptAnalysis'
import PromptSuggestions from './components/PromptSuggestions'
import GenerationDashboard from './components/GenerationDashboard'

function App() {
  const [activeTab, setActiveTab] = useState('nlp')
  const [analysis, setAnalysis] = useState(null)
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState('')

  const handleAnalyze = async (prompt) => {
    setIsLoading(true)
    setCurrentPrompt(prompt)
    
    try {
      const response = await fetch('http://localhost:5001/api/nlp/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()
      
      if (data.success) {
        setAnalysis(data.analysis)
      } else {
        console.error('Analysis failed:', data.error)
        alert('Failed to analyze prompt. Please try again.')
      }
    } catch (error) {
      console.error('Error analyzing prompt:', error)
      alert('Error connecting to server. Make sure the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnhance = async (prompt) => {
    setIsLoading(true)
    setCurrentPrompt(prompt)
    
    try {
      const response = await fetch('http://localhost:5001/api/nlp/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()
      
      if (data.success) {
        setEnhancedPrompt(data.enhancedPrompt)
        // Also analyze the enhanced prompt
        handleAnalyze(data.enhancedPrompt)
      } else {
        console.error('Enhancement failed:', data.error)
        alert('Failed to enhance prompt. Please try again.')
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error)
      alert('Error connecting to server. Make sure the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectSuggestion = (suggestion) => {
    setCurrentPrompt(suggestion)
    handleAnalyze(suggestion)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-orange-400 to-yellow-400">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-200">
                <span className="text-white font-bold text-2xl">N</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">NeuroCanvas</h1>
                <p className="text-xs text-gray-600 font-medium">✨ AI Art Director</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-full">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-300"></div>
              <span className="text-sm font-semibold text-emerald-700">System Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-2 bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
          <button
            className={`px-6 py-3 font-semibold rounded-xl transition-all duration-200 transform ${
              activeTab === 'nlp'
                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg scale-105'
                : 'text-gray-700 hover:bg-purple-50 hover:scale-105'
            }`}
            onClick={() => setActiveTab('nlp')}
          >
            🧠 NLP Prompt Understanding
          </button>
          <button
            className={`px-6 py-3 font-semibold rounded-xl transition-all duration-200 transform ${
              activeTab === 'generation'
                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg scale-105'
                : 'text-gray-700 hover:bg-orange-50 hover:scale-105'
            }`}
            onClick={() => setActiveTab('generation')}
          >
            🚀 Multi-Model Generation
          </button>
          <button
            className={`px-6 py-3 font-semibold rounded-xl transition-all duration-200 transform ${
              activeTab === 'style-transfer'
                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg scale-105'
                : 'text-gray-700 hover:bg-pink-50 hover:scale-105'
            }`}
            onClick={() => setActiveTab('style-transfer')}
          >
            🎨 Style Transfer
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'nlp' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Input and Analysis */}
            <div className="lg:col-span-2 space-y-6">
              <PromptInput
                onAnalyze={handleAnalyze}
                onEnhance={handleEnhance}
                isLoading={isLoading}
                value={currentPrompt}
              />
              
              {analysis && (
                <PromptAnalysis analysis={analysis} />
              )}
            </div>

            {/* Right Column - Suggestions */}
            <div className="lg:col-span-1">
              <PromptSuggestions
                onSelectSuggestion={handleSelectSuggestion}
                enhancedPrompt={enhancedPrompt}
              />
            </div>
          </div>
        ) : activeTab === 'generation' ? (
          <GenerationDashboard />
        ) : (
          <StyleTransfer />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 bg-white/80 backdrop-blur-sm border-t-4 border-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            NeuroCanvas - Multimodal AI Art Director ✨
          </p>
          <p className="mt-2 text-sm text-gray-600 font-medium">
            Built with 💖 using React, Node.js, PyTorch & MongoDB
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App

