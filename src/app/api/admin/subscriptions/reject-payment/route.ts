import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { NotificationService } from '@/lib/notifications'
import ZAI from 'z-ai-web-dev-sdk'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true }
    })
    
    return user
  } catch (error) {
    return null
  }
}

// Send email notification
async function sendEmailNotification(userEmail: string, userName: string, plan: string, status: 'approved' | 'rejected') {
  try {
    const zai = await ZAI.create()
    
    const emailContent = status === 'approved' 
      ? `Dear ${userName},\n\nGreat news! Your payment for the ${plan} plan has been approved.\n\nYour subscription is now active and you can complete your signup process.\n\nThank you for choosing Saanify!\n\nBest regards,\nSaanify Team`
      : `Dear ${userName},\n\nWe regret to inform you that your payment for the ${plan} plan could not be verified.\n\nPlease contact our support team or reupload your payment proof through the subscription page.\n\nThank you for your understanding.\n\nBest regards,\nSaanify Team`

    // Here you would integrate with your email service
    // For now, we'll just log the email content
    console.log(`Email to ${userEmail}: ${emailContent}`)
    
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin or superadmin
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { paymentId, adminNotes } = body

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Try to find in pending payments first
    let payment = await db.pendingPayment.findUnique({
      where: { id: paymentId }
    })

    let targetUser = null

    if (payment) {
      // Find user by email
      targetUser = await db.user.findUnique({
        where: { email: payment.userEmail }
      })
    } else {
      // Try to find in payment proofs
      payment = await db.paymentProof.findUnique({
        where: { id: paymentId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      if (payment) {
        targetUser = payment.user
      }
    }

    if (!payment || !targetUser) {
      return NextResponse.json(
        { error: 'Payment not found or user not associated' },
        { status: 404 }
      )
    }

    // Update payment status
    if (payment.userEmail) {
      // Pending payment update
      await db.pendingPayment.update({
        where: { id: paymentId },
        data: {
          status: 'REJECTED',
          updatedAt: new Date()
        }
      })
    } else {
      // Payment proof update
      await db.paymentProof.update({
        where: { id: paymentId },
        data: {
          status: 'rejected',
          updatedAt: new Date()
        }
      })
    }

    // Create notification for user
    try {
      await db.notification.create({
        data: {
          userId: targetUser.id,
          title: 'Payment Rejected ❌',
          message: `Your payment for ${payment.plan} plan could not be verified. Please reupload your payment proof or contact support.`,
          type: 'error',
          isRead: false,
          createdAt: new Date()
        }
      })
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError)
      // Continue even if notification fails
    }

    // Send notifications using the notification service
    await NotificationService.notifyPaymentRejected(
      targetUser.email || '',
      targetUser.name || 'User',
      payment.plan,
      targetUser.id
    )

    return NextResponse.json({
      success: true,
      message: 'Payment rejected successfully',
      paymentId: paymentId,
      userData: {
        userId: targetUser.id,
        email: targetUser.email,
        plan: payment.plan
      }
    })

  } catch (error) {
    console.error('Payment rejection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}