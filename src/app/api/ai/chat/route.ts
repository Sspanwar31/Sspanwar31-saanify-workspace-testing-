import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    // Create a specialized system prompt for society management
    const systemPrompt = `You are an AI assistant for Saanify, a comprehensive society management platform. You help users with:

1. Member Management: Adding members, managing profiles, membership plans
2. Financial Management: Revenue tracking, dues, loans, financial reports
3. Event Management: Scheduling events, sending reminders, attendance tracking
4. Loan Management: Processing applications, repayment schedules, collections
5. Society Governance: Compliance, meetings, documentation
6. Communication: Member notifications, announcements, updates

Guidelines:
- Be helpful, professional, and concise
- Provide actionable steps when giving instructions
- Use emojis to make responses engaging
- Suggest relevant follow-up actions
- If you don't know something, admit it and suggest contacting human support
- Always maintain a positive and encouraging tone

Current context: You're helping with a society management system that handles multiple societies, member subscriptions, financial operations, and community events.`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const aiResponse = completion.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Assistant Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process your request',
        message: 'Please try again later or contact support'
      },
      { status: 500 }
    )
  }
}