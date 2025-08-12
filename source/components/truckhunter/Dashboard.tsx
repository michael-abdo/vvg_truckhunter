'use client';

import React, { useState } from 'react';
import { generateOpportunities } from '@/lib/truckhunter/opportunities';
import { Opportunity } from '@/types/truckhunter';
import Navbar from './Navbar';
import OpportunityCard from './OpportunityCard';
import OpportunitiesGrid from './OpportunitiesGrid';
import ChatInterface from './ChatInterface';
import QueryBar from './QueryBar';

interface DashboardProps {
  className?: string;
}

export default function Dashboard({ className = '' }: DashboardProps) {
  // State management for chat and opportunities
  const [isChatActive, setIsChatActive] = useState(false);
  const [allOpportunities] = useState<Opportunity[]>(generateOpportunities());

  // Primary opportunity (highest profit)
  const primaryOpportunity = allOpportunities
    .sort((a, b) => {
      const aValue = parseInt(a.metric1Value.replace(/[$,]/g, ''));
      const bValue = parseInt(b.metric1Value.replace(/[$,]/g, ''));
      return bValue - aValue;
    })[0];

  const handleChatActivate = () => {
    setIsChatActive(true);
  };

  const handleChatClose = () => {
    setIsChatActive(false);
  };

  const handleOpportunityExplore = (opportunity?: Opportunity) => {
    setIsChatActive(true);
    // Could pre-populate chat with specific query about the opportunity
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Navbar */}
      <Navbar />

      {/* Main Dashboard Content */}
      <div 
        id="dashboard-view" 
        className={`transition-all duration-300 pt-14 ${isChatActive ? 'opacity-50' : 'opacity-100'}`}
      >
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Fleet Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              Maximize your fleet profit with AI-powered insights and real-time market analysis
            </p>
          </div>
        </div>

        {/* Primary Opportunity Section */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Top Opportunity
            </h2>
            
            {/* Primary Opportunity Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-profit-green">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    🚚 Immediate Action: 2018 Freightliner Cascadia
                  </h3>
                  <div className="flex items-center space-x-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      High Priority
                    </span>
                    <span className="text-gray-600">Window: 2 days remaining</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-3xl font-bold text-profit-green mb-1">
                    $18,400
                  </div>
                  <div className="text-gray-600">Potential Profit</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-vvg-blue mb-1">
                    $8,500
                  </div>
                  <div className="text-gray-600">Above Market Average</div>
                </div>
              </div>
              
              <button 
                id="explore-opportunity"
                onClick={() => handleOpportunityExplore()}
                className="bg-vvg-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-vvg-blue-light transition-colors"
              >
                Explore This Opportunity →
              </button>
            </div>
          </div>

          {/* Future Opportunities Section */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Additional Opportunities
            </h2>
            
            {/* Opportunities Grid */}
            <OpportunitiesGrid 
              opportunities={allOpportunities.slice(1)} // Skip the primary opportunity
              onOpportunityClick={handleOpportunityExplore}
            />
          </div>
        </div>
      </div>

      {/* Query Bar */}
      <QueryBar 
        isActive={isChatActive}
        onActivate={handleChatActivate}
      />

      {/* Chat Interface */}
      <ChatInterface 
        isActive={isChatActive}
        onClose={handleChatClose}
      />
    </div>
  );
}