'use client';

import React from 'react';
import { OpportunityCardProps } from '@/types/truckhunter';
import { extractCurrencyValue } from '@/lib/truckhunter/utils';

export default function OpportunityCard({ 
  title, 
  urgency, 
  urgencyText, 
  metric1Value, 
  metric1Label, 
  metric2Value, 
  metric2Label,
  id = '',
  onClick,
  className = ''
}: OpportunityCardProps) {
  
  // Determine urgency styling
  const urgencyStyles = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    low: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  // Determine if this is a high-value opportunity
  const profitValue = extractCurrencyValue(metric1Value);
  const isHighValue = profitValue > 15000;

  const handleExplore = () => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior - could trigger chat activation with specific query
      console.log(`Exploring opportunity: ${title}`);
    }
  };

  return (
    <div 
      className={`opportunity-card bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border ${
        isHighValue ? 'border-l-4 border-l-profit-green' : 'border-gray-200'
      } ${className}`}
      style={{
        opacity: 1,
        transform: 'translateY(0px)',
        transition: 'all 0.6s ease'
      }}
    >
      <div className="p-6">
        {/* Header with title and urgency indicator */}
        <div className="opportunity-header flex justify-between items-start mb-4">
          <h4 className="font-semibold text-gray-900 text-lg leading-tight pr-4">
            {title}
          </h4>
          <div 
            className={`urgency-indicator ${urgency} inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
              urgencyStyles[urgency] || urgencyStyles.low
            }`}
          >
            {urgencyText}
          </div>
        </div>

        {/* Content with metrics */}
        <div className="opportunity-content">
          <div className="opportunity-metrics grid grid-cols-2 gap-4 mb-6">
            {/* Metric 1 - Usually Potential Profit */}
            <div className="metric-item">
              <div className="metric-value text-2xl font-bold text-profit-green mb-1">
                {metric1Value}
              </div>
              <div className="metric-label text-sm text-gray-600">
                {metric1Label}
              </div>
            </div>

            {/* Metric 2 - Usually Opportunity Window */}
            <div className="metric-item">
              <div className="metric-value text-2xl font-bold text-vvg-blue mb-1">
                {metric2Value}
              </div>
              <div className="metric-label text-sm text-gray-600">
                {metric2Label}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="opportunity-actions">
          <button 
            className={`future-action-btn w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              isHighValue 
                ? 'bg-vvg-blue text-white hover:bg-vvg-blue-light hover:shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={handleExplore}
          >
            Explore
          </button>
        </div>
      </div>

      {/* Optional high-value indicator */}
      {isHighValue && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-profit-green rounded-full animate-pulse-glow"></div>
        </div>
      )}
    </div>
  );
}