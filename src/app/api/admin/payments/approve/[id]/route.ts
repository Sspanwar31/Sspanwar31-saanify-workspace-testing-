import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return null
  }

  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string }
  } catch (error) {
    return null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const user = verifyToken(request)
    if (!user || !['ADMIN', 'SUPERADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const paymentId = params.id

    // Find the payment proof
    const paymentProof = await db.paymentProof.findUnique({
      where: { id: paymentId },
      include: { user: true }
    })

    if (!paymentProof) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    if (paymentProof.status !== 'pending') {
      return NextResponse.json(
        { error: 'Payment has already been processed' },
        { status: 400 }
      )
    }

    // Update payment status to approved
    const updatedPayment = await db.paymentProof.update({
      where: { id: paymentId },
      data: {
        status: 'approved',
        updatedAt: new Date()
      },
      include: { user: true }
    })

    // Calculate subscription end date (30 days from now)
    const subscriptionEndsAt = new Date()
    subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + 30)

    // Update user's subscription
    await db.user.update({
      where: { id: paymentProof.userId },
      data: {
        subscriptionEndsAt,
        updatedAt: new Date()
      }
    })

    // Update society account if exists
    const societyAccount = await db.societyAccount.findFirst({
      where: { userId: paymentProof.userId }
    })

    if (societyAccount) {
      await db.societyAccount.update({
        where: { id: societyAccount.id },
        data: {
          subscriptionPlan: paymentProof.plan,
          status: 'ACTIVE',
          subscriptionEndsAt,
          updatedAt: new Date()
        }
      })
    } else {
      // Create society account if it doesn't exist
      await db.societyAccount.create({
        data: {
          name: `${paymentProof.user.name}'s Society`,
          email: paymentProof.user.email,
          subscriptionPlan: paymentProof.plan,
          status: 'ACTIVE',
          subscriptionEndsAt,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: paymentProof.userId
        }
      })
    }

    // Create notification for user
    await db.notification.create({
      data: {
        userId: paymentProof.userId,
        title: 'Payment Approved',
        message: `Your payment of ₹${paymentProof.amount} for ${paymentProof.plan} plan has been approved. Your subscription is now active for 30 days.`,
        type: 'success',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment approved successfully',
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        subscriptionEndsAt
      }
    })

  } catch (error) {
    console.error('Error approving payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}