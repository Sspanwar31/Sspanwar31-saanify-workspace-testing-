import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

// Notification types
export type NotificationType = 
  'TRIAL_EXPIRY_WARNING' |
  'SUBSCRIPTION_EXPIRED' |
  'PAYMENT_RECEIVED' |
  'SYSTEM_ALERT'

export interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: any
  createdAt: Date
  readAt?: Date
}

export async function POST(request: NextRequest) {
  try {
    const { userId, type, title, message, data, createdAt, readAt } = await request.json()

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create notification
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
        createdAt: createdAt || new Date(),
        readAt: readAt || new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      notification
    })
  } catch (error) {
    console.error('Notification creation error:', error)
    return NextResponse.json({
      error: 'Failed to create notification',
      details: error.message
    }, { status: 500 })
    }
  }
}