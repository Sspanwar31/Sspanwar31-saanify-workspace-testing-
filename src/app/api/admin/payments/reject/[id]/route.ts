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

    // Update payment status to rejected
    const updatedPayment = await db.paymentProof.update({
      where: { id: paymentId },
      data: {
        status: 'rejected',
        updatedAt: new Date()
      },
      include: { user: true }
    })

    // Update society account status if exists
    const societyAccount = await db.societyAccount.findFirst({
      where: { userId: paymentProof.userId }
    })

    if (societyAccount) {
      await db.societyAccount.update({
        where: { id: societyAccount.id },
        data: {
          status: 'PAYMENT_REJECTED',
          updatedAt: new Date()
        }
      })
    }

    // Create notification for user
    await db.notification.create({
      data: {
        userId: paymentProof.userId,
        title: 'Payment Rejected',
        message: `Your payment of ₹${paymentProof.amount} for ${paymentProof.plan} plan has been rejected. Please contact support or submit a new payment proof.`,
        type: 'error',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment rejected successfully',
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status
      }
    })

  } catch (error) {
    console.error('Error rejecting payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}