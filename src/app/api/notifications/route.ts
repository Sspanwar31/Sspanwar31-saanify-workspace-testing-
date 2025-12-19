import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  try {
    // Get user session (you'll need to implement this based on your auth system)
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notifications = await NotificationService.getUserNotifications(session.user.id)
    const unreadCount = await NotificationService.getUnreadCount(session.user.id)

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount
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
    const body = await request.json()
    const session = await getSession(request)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, notificationId } = body

    switch (action) {
      case 'mark_read':
        if (!notificationId) {
          return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
        }
        const marked = await NotificationService.markAsRead(notificationId, session.user.id)
        return NextResponse.json({ success: marked })

      case 'mark_all_read':
        const allMarked = await NotificationService.markAllAsRead(session.user.id)
        return NextResponse.json({ success: allMarked })

      case 'delete':
        if (!notificationId) {
          return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
        }
        const deleted = await NotificationService.deleteNotification(notificationId, session.user.id)
        return NextResponse.json({ success: deleted })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error handling notification action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get session (implement based on your auth system)
async function getSession(request: NextRequest) {
  // This is a placeholder - implement based on your actual auth system
  // For example, if you're using NextAuth.js:
  // return await getServerSession(request)
  
  // For now, return a mock admin user
  return {
    user: {
      id: 'admin_user_id',
      email: 'admin@saanify.com',
      role: 'ADMIN'
    }
  }
}