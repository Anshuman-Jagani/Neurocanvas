import { useState, useEffect } from 'react';
import ChatInterface from './ChatInterface';

const ArtDirectorPanel = ({ onApplyPrompt }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/llm/conversations?limit=10');
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  // Quick action buttons
  const quickActions = [
    { icon: '🎨', label: 'Refine this prompt', action: 'refine' },
    { icon: '⚡', label: 'Make it more dramatic', action: 'dramatic' },
    { icon: '✨', label: 'Add more details', action: 'details' },
    { icon: '🎯', label: 'Simplify', action: 'simplify' },
    { icon: '💡', label: 'Explain concept', action: 'explain' }
  ];

  const handleQuickAction = (action) => {
    const messages = {
      refine: 'Please refine this prompt to make it more artistic and detailed',
      dramatic: 'Make this prompt more dramatic and impactful',
      details: 'Add more specific details and visual elements to this prompt',
      simplify: 'Simplify this prompt while keeping the core idea',
      explain: 'Explain the artistic concepts in this prompt'
    };

    // This would send the message to the chat
    // For now, just log it
    console.log('Quick action:', action, messages[action]);
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    loadConversations();
  };

  const handleConversationUpdate = (conversationId) => {
    setActiveConversationId(conversationId);
    loadConversations();
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Conversation History Sidebar */}
      <div
        className={`${
          showHistory ? 'w-64' : 'w-0'
        } transition-all duration-300 overflow-hidden`}
      >
        <div className="h-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              History
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="p-1 hover:bg-purple-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[calc(100%-60px)]">
            {conversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => setActiveConversationId(conv._id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                  activeConversationId === conv._id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                    : 'bg-purple-50 hover:bg-purple-100 text-gray-800'
                }`}
              >
                <div className="font-medium text-sm truncate">{conv.title}</div>
                <div className={`text-xs mt-1 ${
                  activeConversationId === conv._id ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {conv.stats.totalMessages} messages
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 mb-4 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎨</div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                  AI Art Director
                </h2>
                <p className="text-sm text-gray-600">
                  Your creative assistant for better prompts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium transition-all duration-200 hover:scale-105"
              >
                📚 {showHistory ? 'Hide' : 'Show'} History
              </button>
              <button
                onClick={startNewConversation}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                ➕ New Chat
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.action)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-pink-100 hover:from-orange-200 hover:to-pink-200 text-gray-800 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1">
          <ChatInterface
            conversationId={activeConversationId}
            onConversationUpdate={handleConversationUpdate}
          />
        </div>

        {/* Apply Prompt Button (if prompt is available) */}
        {currentPrompt && (
          <div className="mt-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">Refined Prompt:</div>
                <div className="font-medium text-gray-800 line-clamp-2">{currentPrompt}</div>
              </div>
              <button
                onClick={() => onApplyPrompt && onApplyPrompt(currentPrompt)}
                className="ml-4 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                ✅ Apply to Prompt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtDirectorPanel;
