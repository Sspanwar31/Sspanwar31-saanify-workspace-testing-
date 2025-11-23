import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { NotificationService } from '@/lib/notifications'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Simple token verification function (replaces the deleted tokens library)
const verifyAccessToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'saanify',
      audience: 'saanify-users'
    }) as any

    // Ensure it's an access token
    if (decoded.type !== 'access') {
      return null
    }

    return decoded
  } catch (error) {
    console.error('Access token verification failed:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    let notifications = await NotificationService.getUserNotifications(decoded.userId, limit)

    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read)
    }

    const unreadCount = await NotificationService.getUnreadCount(decoded.userId)

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      total: notifications.length
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = verifyAccessToken(token)
    if (!decoded || decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, title, message, type, data } = body

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'userId, title, and message are required' },
        { status: 400 }
      )
    }

    const notification = await NotificationService.createNotification({
      userId,
      title,
      message,
      type: type || 'info',
      data
    })

    return NextResponse.json({
      success: true,
      notification
    })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}