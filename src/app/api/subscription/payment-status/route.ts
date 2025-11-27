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

export async function GET(request: NextRequest) {
  try {
    // Get user from token
    const user = verifyToken(request)
    
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    // Get user details to find email
    const userDetails = await db.user.findUnique({
      where: { id: user.userId },
      select: { email: true }
    })

    if (!userDetails) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check for pending payment
    const pendingPayment = await db.pendingPayment.findFirst({
      where: {
        userEmail: userDetails.email,
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!pendingPayment) {
      return NextResponse.json({ 
        status: 'none',
        message: 'No pending payment found' 
      })
    }

    // Check if payment has expired
    if (pendingPayment.expiresAt && new Date() > pendingPayment.expiresAt) {
      await db.pendingPayment.update({
        where: { id: pendingPayment.id },
        data: { status: 'REJECTED' }
      })
      
      return NextResponse.json({ 
        status: 'expired',
        message: 'Payment has expired' 
      })
    }

    return NextResponse.json({ 
      status: pendingPayment.status.toLowerCase(),
      paymentId: pendingPayment.id,
      plan: pendingPayment.plan,
      amount: pendingPayment.amount
    })

  } catch (error) {
    console.error('Error checking payment status:', error)
    return NextResponse.json({ 
      error: 'Failed to check payment status',
      status: 'error'
    }, { status: 500 })
  }
}