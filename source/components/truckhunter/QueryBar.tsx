'use client';

import React from 'react';

interface QueryBarProps {
  isActive: boolean;
  onActivate: () => void;
  className?: string;
}

export default function QueryBar({ 
  isActive, 
  onActivate, 
  className = '' 
}: QueryBarProps) {
  return (
    <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10 ${className}`}>
      <div 
        id="query-bar"
        className={`bg-white rounded-full shadow-lg px-6 py-4 cursor-pointer border-2 transition-all duration-300 hover:shadow-xl ${
          isActive 
            ? 'border-vvg-blue scale-105 shadow-2xl' 
            : 'border-gray-200 hover:border-gray-300 hover:scale-105'
        }`}
        onClick={onActivate}
      >
        <div className="flex items-center space-x-3">
          {/* Search Icon */}
          <div className="flex-shrink-0">
            <svg 
              className={`w-5 h-5 transition-colors duration-300 ${
                isActive ? 'text-vvg-blue' : 'text-gray-400'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>

          {/* Text */}
          <span 
            className={`text-sm font-medium transition-colors duration-300 ${
              isActive ? 'text-vvg-blue' : 'text-gray-600'
            }`}
          >
            Ask AI about your fleet...
          </span>

          {/* AI Icon */}
          <div className="flex-shrink-0">
            <div 
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300 ${
                isActive 
                  ? 'bg-vvg-blue text-white' 
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <svg 
                className="w-3 h-3" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Pulse animation when active */}
        {isActive && (
          <div className="absolute inset-0 rounded-full border-2 border-vvg-blue animate-ping opacity-20"></div>
        )}
      </div>

      {/* Floating action hint */}
      {!isActive && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap">
            Click to chat with AI
          </div>
          <div className="w-2 h-2 bg-gray-900 transform rotate-45 mx-auto -mt-1"></div>
        </div>
      )}
    </div>
  );
}