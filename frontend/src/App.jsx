import { useState } from 'react'
import './App.css'
import StyleTransfer from './components/StyleTransfer'

function App() {
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

      {/* Main Content */}
      <main>
        <StyleTransfer />
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
