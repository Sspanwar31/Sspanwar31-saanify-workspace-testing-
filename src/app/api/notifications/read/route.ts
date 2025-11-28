import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }

    // Get user session (implement based on your auth system)
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const marked = await NotificationService.markAsRead(notificationId, session.user.id)

    if (marked) {
      return NextResponse.json({ 
        success: true,
        message: 'Notification marked as read'
      })
    } else {
      return NextResponse.json({ 
        error: 'Notification not found' 
      }, { status: 404 })
    }

  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get session (implement based on your auth system)
async function getSession(request: NextRequest) {
  // This is a placeholder - implement based on your actual auth system
  return {
    user: {
      id: 'admin_user_id',
      email: 'admin@saanify.com',
      role: 'ADMIN'
    }
  }
}