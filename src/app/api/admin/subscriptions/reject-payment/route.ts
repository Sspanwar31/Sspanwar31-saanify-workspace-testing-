import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

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
    const { proofId, adminNotes } = body

    if (!proofId) {
      return NextResponse.json(
        { error: 'Payment proof ID is required' },
        { status: 400 }
      )
    }

    // Get payment proof with user details
    const paymentProof = await db.paymentProof.findUnique({
      where: { id: proofId },
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

    if (!paymentProof) {
      return NextResponse.json(
        { error: 'Payment proof not found' },
        { status: 404 }
      )
    }

    if (paymentProof.status !== 'pending') {
      return NextResponse.json(
        { error: 'Payment proof has already been processed' },
        { status: 400 }
      )
    }

    // Update payment proof status
    const updatedPaymentProof = await db.paymentProof.update({
      where: { id: proofId },
      data: {
        status: 'rejected',
        updatedAt: new Date()
      }
    })

    // Create notification for user
    try {
      await db.notification.create({
        data: {
          userId: paymentProof.user.id,
          title: 'Payment Rejected',
          message: `Your payment for ${paymentProof.plan} plan has been rejected. Please contact support for more information.`,
          type: 'error',
          isRead: false,
          createdAt: new Date()
        }
      })
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError)
      // Continue even if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Payment rejected successfully',
      paymentProof: updatedPaymentProof
    })

  } catch (error) {
    console.error('Payment rejection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}