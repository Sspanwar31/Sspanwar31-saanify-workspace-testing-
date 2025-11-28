import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userName, userEmail, plan, amount, transactionId } = body

    if (!userId || !userName || !userEmail || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get all admin users (you'll need to implement this based on your user system)
    const adminUsers = await getAdminUsers()

    // Create notification for each admin
    const notifications = []
    for (const admin of adminUsers) {
      const notification = await NotificationService.createNotification({
        userId: admin.id,
        title: 'New Payment Submission',
        message: `${userName} has submitted a payment proof for ${plan} plan (₹${amount})`,
        type: 'info',
        data: {
          type: 'new_payment',
          userId,
          userName,
          userEmail,
          plan,
          amount,
          transactionId,
          submittedAt: new Date().toISOString()
        }
      })
      notifications.push(notification)
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications sent to admins',
      notificationsCreated: notifications.length
    })

  } catch (error) {
    console.error('Error creating payment notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get admin users
async function getAdminUsers() {
  // This is a placeholder - implement based on your actual user system
  // For example, if you're using Prisma:
  // return await db.user.findMany({ where: { role: 'ADMIN' } })
  
  // For now, return mock admin users
  return [
    {
      id: 'admin_user_id',
      name: 'Admin User',
      email: 'admin@saanify.com'
    }
  ]
}