import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // This is a test endpoint to verify the admin approval system
    const { action, userId, plan, duration, reason } = body;

    if (action === 'test-approval') {
      // Test approval endpoint
      const approvalResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/subscriptions/approve-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId || 'test-user-id',
          plan: plan || 'basic',
          duration: duration || 1
        })
      });

      const approvalResult = await approvalResponse.json();
      
      return NextResponse.json({
        success: true,
        test: 'approval',
        result: approvalResult
      });
    }

    if (action === 'test-rejection') {
      // Test rejection endpoint
      const rejectionResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/subscriptions/reject-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId || 'test-user-id',
          reason: reason || 'Test rejection reason'
        })
      });

      const rejectionResult = await rejectionResponse.json();
      
      return NextResponse.json({
        success: true,
        test: 'rejection',
        result: rejectionResult
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "test-approval" or "test-rejection"'
    });

  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}