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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json()
    const { action } = body

    if (action === 'mark-read') {
      const success = await NotificationService.markAsRead(params.id, decoded.userId)
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Notification marked as read'
        })
      } else {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const success = await NotificationService.deleteNotification(params.id, decoded.userId)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Notification deleted'
      })
    } else {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}