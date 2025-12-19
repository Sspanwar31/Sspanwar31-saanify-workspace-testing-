import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron job or internal request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for expiring subscriptions (2 days before expiry)
    await NotificationService.checkAndSendExpiryReminders()

    // Check and update expired subscriptions
    await NotificationService.checkAndUpdateExpiredSubscriptions()

    return NextResponse.json({
      success: true,
      message: 'Subscription checks completed successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in subscription check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also allow GET requests for manual testing
export async function GET(request: NextRequest) {
  try {
    // For testing purposes, you might want to add a simple auth check
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for expiring subscriptions (2 days before expiry)
    await NotificationService.checkAndSendExpiryReminders()

    // Check and update expired subscriptions
    await NotificationService.checkAndUpdateExpiredSubscriptions()

    return NextResponse.json({
      success: true,
      message: 'Subscription checks completed successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in subscription check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}