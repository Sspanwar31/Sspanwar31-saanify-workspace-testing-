import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // For now, return mock data since we don't have subscription tables
    // In a real implementation, this would fetch from database
    const mockSubscription = {
      planType: 'TRIAL',
      status: 'TRIAL',
      trialEnds: '2025-12-13',
      features: [
        'Basic society management',
        'Member management',
        'Basic financial tracking',
        'Limited support'
      ],
      limits: {
        users: 3,
        storage: '1 GB',
        societies: 1
      }
    }

    return NextResponse.json({
      success: true,
      subscription: mockSubscription
    })

  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription data' },
      { status: 500 }
    )
  }
}