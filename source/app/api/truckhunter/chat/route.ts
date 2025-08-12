// TruckHunter Chat API Route
// Ported from server.js Express route to Next.js API route

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { ChatRequest, ChatResponse } from '@/types/truckhunter';

// Initialize OpenAI client - handle missing API key gracefully
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// System prompt for the AI (extracted from server.js lines 19-36)
const SYSTEM_PROMPT = `You are an AI assistant for TruckHunter, a platform that helps fleet owners maximize profit from their truck assets. 

You have access to a comprehensive database of dozens of trucks with detailed information including:
- Various makes and models: Freightliner Cascadia, Peterbilt 579/389, Volvo VNL, Kenworth T680/T880, Mack Anthem
- Years ranging from 2016-2023
- Current market values and historical trends
- Mileage data and condition assessments
- Geographic demand variations (strongest in TX, CA, FL)
- Seasonal pricing patterns and market timing opportunities
- Maintenance histories and cost analyses

Always respond with specific, actionable advice. Include real numbers, timeframes, and concrete steps. Your responses should be confident and data-driven, as if you're analyzing actual fleet data. Focus on profit opportunities and ROI.

Example insights you might provide:
- Specific profit amounts ($8,500 profit potential)
- Clear deadlines (2-7 day opportunity windows)
- Market comparisons (Texas pays $8k more than national average)
- Timing advice (refrigerated units up 18% this month)`;

// Fallback responses for when OpenAI API fails (from server.js lines 73-78)
const mockResponses = {
  'sell': `Based on your fleet analysis, I recommend selling your 2018 Freightliner Cascadia immediately. Current market conditions show strong demand with a potential profit of $18,400 if you act within the next 2 days. Texas buyers are paying $8,500 above market average.`,
  'price': `For optimal pricing, list your trucks 5-8% below market average for quick sales. Current hot markets: Texas (+$8,500), California (+$6,200), Florida (+$4,800). Refrigerated units are seeing 18% higher demand this month.`,
  'market': `Market trends show Peterbilt values rising 12% this quarter. Volvo units are declining 8% monthly. Best opportunity windows are typically 2-7 days. Act fast on high-demand models.`,
  'default': `I can help you maximize profit from your truck fleet. I have data on dozens of trucks including market values, geographic demand, and optimal timing. What specific aspect would you like me to analyze?`
};

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    const body: ChatRequest = await request.json();
    const { message } = body;
    
    if (!message) {
      return NextResponse.json(
        { response: 'Message is required', fallback: mockResponses.default },
        { status: 400 }
      );
    }

    console.log('Received chat message:', message);
    
    // Try OpenAI first
    if (openai && process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 500
        });

        const aiResponse = completion.choices[0]?.message?.content;
        
        if (aiResponse) {
          return NextResponse.json({ response: aiResponse });
        }
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        // Fall through to fallback responses
      }
    }
    
    // Fallback to mock responses if OpenAI fails or is not configured
    const messageLower = message.toLowerCase();
    let fallbackResponse = mockResponses.default;
    
    if (messageLower.includes('sell') || messageLower.includes('which')) {
      fallbackResponse = mockResponses.sell;
    } else if (messageLower.includes('price') || messageLower.includes('cost')) {
      fallbackResponse = mockResponses.price;
    } else if (messageLower.includes('market') || messageLower.includes('trend')) {
      fallbackResponse = mockResponses.market;
    }
    
    console.log('Using fallback response');
    return NextResponse.json({ 
      response: fallbackResponse,
      note: 'Currently using cached analysis data'
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      { 
        response: 'I apologize, but I\'m unable to connect to the analysis system. Please check your connection and try again.',
        fallback: mockResponses.default
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}