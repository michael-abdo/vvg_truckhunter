// TruckHunter Analytics Type Definitions

// Enum for urgency levels
export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// Interface for opportunity metrics
export interface OpportunityMetric {
  value: string;
  label: string;
}

// Main opportunity interface matching the structure from script.js
export interface Opportunity {
  title: string;
  urgency: UrgencyLevel;
  urgencyText: string;
  metric1Value: string;
  metric1Label: string;
  metric2Value: string;
  metric2Label: string;
}

// Chat message interface
export interface ChatMessage {
  content: string;
  type: 'user' | 'ai';
  timestamp?: Date;
}

// Extended opportunity interface with additional props for React components
export interface OpportunityCardProps extends Opportunity {
  id?: string;
  onClick?: () => void;
  className?: string;
}

// API response interface for chat endpoint
export interface ChatResponse {
  response: string;
  note?: string;
  fallback?: string;
}

// Chat API request interface
export interface ChatRequest {
  message: string;
}