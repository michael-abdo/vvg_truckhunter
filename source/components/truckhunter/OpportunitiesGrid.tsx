'use client';

import React, { useState } from 'react';
import OpportunityCard from './OpportunityCard';
import { Opportunity } from '@/types/truckhunter';

interface OpportunitiesGridProps {
  opportunities: Opportunity[];
  onOpportunityClick?: (opportunity: Opportunity) => void;
  className?: string;
}

export default function OpportunitiesGrid({ 
  opportunities, 
  onOpportunityClick,
  className = ''
}: OpportunitiesGridProps) {
  const [opportunitiesShown, setOpportunitiesShown] = useState(3); // Show 3 initially
  const opportunitiesToShow = 3; // Show 3 more per click

  const handleShowMore = () => {
    const newCount = Math.min(
      opportunitiesShown + opportunitiesToShow, 
      opportunities.length
    );
    setOpportunitiesShown(newCount);
  };

  const handleOpportunityClick = (opportunity: Opportunity) => {
    if (onOpportunityClick) {
      onOpportunityClick(opportunity);
    }
  };

  const visibleOpportunities = opportunities.slice(0, opportunitiesShown);
  const hasMoreOpportunities = opportunitiesShown < opportunities.length;

  return (
    <div className={className}>
      {/* Opportunities Grid */}
      <div 
        id="opportunities-grid" 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6"
      >
        {visibleOpportunities.map((opportunity, index) => (
          <div
            key={`${opportunity.title}-${index}`}
            className="animate-slide-up"
            style={{
              animationDelay: `${(index % opportunitiesToShow) * 100}ms`
            }}
          >
            <OpportunityCard
              {...opportunity}
              onClick={() => handleOpportunityClick(opportunity)}
              className="h-full"
            />
          </div>
        ))}
      </div>

      {/* Show More Link */}
      {hasMoreOpportunities && (
        <div className="text-center">
          <button
            id="show-more-opportunities"
            onClick={handleShowMore}
            className="inline-flex items-center text-vvg-blue hover:text-vvg-blue-light font-medium transition-colors duration-200 group"
          >
            <span>See more opportunities</span>
            <svg 
              className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      )}

      {/* Summary Stats */}
      {opportunities.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Portfolio Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-vvg-blue">
                {opportunities.length}
              </div>
              <div className="text-sm text-gray-600">Total Opportunities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-profit-green">
                ${opportunities
                  .reduce((sum, opp) => {
                    const value = parseInt(opp.metric1Value.replace(/[$,]/g, ''));
                    return sum + value;
                  }, 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Potential Profit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-urgent-red">
                {opportunities.filter(opp => opp.urgency === 'high').length}
              </div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}