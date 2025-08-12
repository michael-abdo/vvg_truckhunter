'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatRequest, ChatResponse } from '@/types/truckhunter';
import { sanitizeChatInput, formatErrorMessage } from '@/lib/truckhunter/utils';

interface ChatInterfaceProps {
  isActive: boolean;
  onClose: () => void;
  className?: string;
}

export default function ChatInterface({ 
  isActive, 
  onClose, 
  className = '' 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat becomes active
  useEffect(() => {
    if (isActive && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isActive]);

  // Handle escape key to close chat
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isActive) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isActive, onClose]);

  const addMessage = (content: string, type: 'user' | 'ai', timestamp?: Date) => {
    const newMessage: ChatMessage = {
      content,
      type,
      timestamp: timestamp || new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const sendMessage = async () => {
    const message = sanitizeChatInput(inputValue);
    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    setInputValue('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage = addMessage('...', 'ai');

    try {
      const request: ChatRequest = { message };
      
      const response = await fetch('/api/truckhunter/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      const data: ChatResponse = await response.json();

      // Remove loading message
      setMessages(prev => prev.filter(msg => msg !== loadingMessage));

      if (response.ok && data.response) {
        // Format the response with HTML line breaks
        const formattedResponse = data.response.replace(/\n/g, '<br>');
        addMessage(formattedResponse, 'ai');
        
        // Show note if using fallback
        if (data.note) {
          addMessage(`<em class="text-gray-500">${data.note}</em>`, 'ai');
        }
      } else {
        const errorMessage = data.fallback || 'I apologize, but I\'m having trouble accessing the fleet data. Please try again.';
        addMessage(errorMessage, 'ai');
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Remove loading message
      setMessages(prev => prev.filter(msg => msg !== loadingMessage));
      
      const errorMessage = formatErrorMessage(error);
      addMessage('I apologize, but I\'m unable to connect to the analysis system. Please check your connection and try again.', 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handlePredefinedQuery = (query: string) => {
    setInputValue(query);
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  // Suggested queries
  const suggestedQueries = [
    "What trucks should I sell for maximum profit?",
    "Show me current market trends for Peterbilt trucks",
    "Which opportunities have the shortest time windows?",
    "What's the best pricing strategy for my fleet?"
  ];

  if (!isActive) return null;

  return (
    <div 
      id="chat-view"
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center transition-all duration-300 ${
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } ${className}`}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[600px] m-4 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-vvg-blue text-white rounded-t-lg">
          <div>
            <h3 className="text-xl font-semibold">TruckHunter AI Assistant</h3>
            <p className="text-blue-200 text-sm">Ask me about your fleet opportunities and market insights</p>
          </div>
          <button 
            id="close-chat"
            onClick={onClose}
            className="text-blue-200 hover:text-white p-2 rounded-lg hover:bg-vvg-blue-light transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages Container */}
        <div 
          id="chat-messages"
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 chat-scrollbar"
        >
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-lg mb-6">Welcome to TruckHunter AI! I'm here to help you maximize your fleet profits.</p>
              
              {/* Suggested Queries */}
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700 mb-3">Try asking me:</p>
                <div className="space-y-2">
                  {suggestedQueries.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handlePredefinedQuery(query)}
                      className="query-suggestion block w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-vvg-blue hover:bg-blue-50 transition-colors text-sm"
                    >
                      "{query}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`message ${message.type} flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`message-content max-w-[80%] p-4 rounded-lg ${
                    message.type === 'user' 
                      ? 'user-message bg-vvg-blue text-white rounded-tr-sm' 
                      : 'ai-message bg-white text-gray-900 border border-gray-200 rounded-tl-sm'
                  }`}
                  dangerouslySetInnerHTML={{ __html: message.content }}
                />
              </div>
            ))
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="ai-message bg-white text-gray-900 border border-gray-200 p-4 rounded-lg rounded-tl-sm max-w-[80%]">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-gray-200 rounded-b-lg">
          <div className="flex space-x-4">
            <input
              id="chat-input"
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your fleet opportunities..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vvg-blue focus:border-transparent disabled:bg-gray-100"
            />
            <button
              id="send-btn"
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-vvg-blue text-white rounded-lg hover:bg-vvg-blue-light disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}