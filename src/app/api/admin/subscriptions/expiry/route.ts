import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/auth-middleware'

interface ExpiryNotification {
  id: string
  userId: string
  societyAccountId: string
  trialEndsAt?: Date
  daysLeft: number
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  isRead: boolean
  createdAt: Date
  readAt?: Date
}

interface AutomationTask {
  id: string
  task_name: string
  description: string
  schedule: string
  enabled: boolean
  last_run_status?: string
  last_run_at?: Date
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🤖 Auto-expiry notification request received:', body)

    const { 
      type, 
      userId, 
      societyAccountId, 
      message 
      daysLeft 
    } = body

    if (!type || !userId || !societyAccountId) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Create notification
    const notification = await db.notification.create({
      data: {
        type,
        userId,
        societyAccountId,
        title: type === 'warning' ? '⚠️ Subscription Expiry Warning' : '📢 Subscription Expired',
        message,
        isRead: false,
        createdAt: new Date(),
        readAt: new Date()
      }
    })

    console.log('📧 Notification created:', notification.id)

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      notification
    })
  } catch (error) {
      console.error('Failed to create notification:', error)
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      )
    }
  }

// CRON JOB - Runs every 12 hours
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Running auto-expiry check...')
    
    // Get all active subscriptions with trial periods
    const activeSubscriptions = await db.societyAccount.findMany({
      where: {
        status: 'ACTIVE',
        trialEndsAt: { not: null }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            societyAccount: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    })

    const notifications: ExpiryNotification[] = []

    for (const subscription of activeSubscriptions) {
      const trialEndsAt = subscription.trialEndsAt
      if (trialEndsAt) {
        const now = new Date()
        const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 24))
        
        if (daysLeft <= 3) {
          notifications.push({
            type: 'warning',
            userId: subscription.userId,
            societyAccountId: subscription.societyAccountId,
            title: '⚠️ Subscription Expiry Warning',
            message: `Your trial for ${subscription.plan} expires in ${daysLeft} days!`,
            daysLeft,
            isRead: false,
            createdAt: new Date(),
            readAt: new Date()
          })
        }
      }
    }

    // Create expiry notifications
    if (notifications.length > 0) {
      await db.notification.createMany({
        data: notifications
      })
    }

    console.log(`📧 Created ${notifications.length} expiry notifications`)
    return NextResponse.json({
      success: true,
      message: `Created ${notifications.length} expiry notifications`
    })
  } catch (error) {
      console.error('Auto-expiry check failed:', error)
      return NextResponse.json(
        { error: 'Failed to run auto-expiry check' },
        { status: 500 }
      )
    }
  }