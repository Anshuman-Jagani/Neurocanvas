import { useState } from 'react'
import './App.css'

function App() {
  const [prompt, setPrompt] = useState('')

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
              <h1 className="text-2xl font-bold text-gray-900">NeuroCanvas</h1>
            </div>
            <nav className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-gray-900">Generate</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Gallery</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">About</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            AI Art Director
          </h2>
          <p className="text-xl text-gray-600">
            Create stunning artwork with multimodal AI
          </p>
        </div>

        {/* Prompt Input Card */}
        <div className="card max-w-3xl mx-auto mb-8">
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your artwork
          </label>
          <textarea
            id="prompt"
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="e.g., A serene landscape with mountains at sunset in the style of Van Gogh..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {prompt.length} characters
            </div>
            <button className="btn-primary">
              Generate Art 🎨
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="card text-center">
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold mb-2">Style Transfer</h3>
            <p className="text-gray-600 text-sm">
              Apply artistic styles in seconds
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-lg font-semibold mb-2">AI Generation</h3>
            <p className="text-gray-600 text-sm">
              Multiple AI models working together
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-3">💡</div>
            <h3 className="text-lg font-semibold mb-2">Personalized</h3>
            <p className="text-gray-600 text-sm">
              Learns your preferences over time
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">System Ready</span>
          </div>
        </div>
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
