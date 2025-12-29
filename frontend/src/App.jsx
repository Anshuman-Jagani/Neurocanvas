import { useState } from 'react'
import './App.css'
import StyleTransfer from './components/StyleTransfer'
import PromptInput from './components/PromptInput'
import PromptAnalysis from './components/PromptAnalysis'
import PromptSuggestions from './components/PromptSuggestions'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">NeuroCanvas</h1>
                <p className="text-xs text-gray-500">AI Art Director</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">System Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'nlp'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('nlp')}
          >
            🧠 NLP Prompt Understanding
          </button>
          <button
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'style-transfer'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
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
        ) : (
          <StyleTransfer />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 text-sm">
          <p>NeuroCanvas - Multimodal AI Art Director</p>
          <p className="mt-1">Built with React, Node.js, PyTorch & MongoDB</p>
        </div>
      </footer>
    </div>
  )
}

export default App

