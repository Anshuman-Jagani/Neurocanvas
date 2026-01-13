import { useState, useRef, useEffect } from 'react';

const ChatInterface = ({ conversationId, onConversationUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isSending) return;

    const userMessage = input.trim();
    setInput('');
    setIsSending(true);

    // Add user message to UI
    const newUserMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMsg]);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      setIsTyping(true);

      const response = await fetch('http://localhost:5001/api/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: userMessage,
          stream: false
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add assistant message
        const assistantMsg = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
          metadata: {
            tokens: data.tokens,
            responseTime: data.responseTime
          }
        };
        setMessages(prev => [...prev, assistantMsg]);

        // Update conversation ID if new
        if (onConversationUpdate && data.conversationId) {
          onConversationUpdate(data.conversationId);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }

    } catch (error) {
      console.error('Chat error:', error);
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Copy message to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-2xl shadow-xl overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
              AI Art Director
            </h3>
            <p className="text-gray-600">
              Ask me anything about art, prompts, or creative ideas!
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-lg ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white'
                  : msg.isError
                  ? 'bg-red-100 text-red-800 border-2 border-red-300'
                  : 'bg-white/90 backdrop-blur-sm text-gray-800 border-2 border-purple-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  {msg.metadata && (
                    <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                      {msg.metadata.responseTime && `⚡ ${(msg.metadata.responseTime / 1000).toFixed(1)}s`}
                      {msg.metadata.tokens && ` • 🔢 ${msg.metadata.tokens} tokens`}
                    </div>
                  )}
                </div>
                {msg.role === 'assistant' && !msg.isError && (
                  <button
                    onClick={() => copyToClipboard(msg.content)}
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg border-2 border-purple-200">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-600">Art Director is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t-2 border-purple-200 bg-white/80 backdrop-blur-sm p-4">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask the art director anything... (Shift+Enter for new line)"
            disabled={isSending}
            className="flex-1 resize-none rounded-xl border-2 border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 px-4 py-3 max-h-32 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isSending}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSending ? '⏳' : '🚀'} Send
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
