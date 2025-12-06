import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { encodeImageUrl } from '@/lib/screenshot-utils'

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
    // Verify user authentication
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's latest payment proof
    const paymentProof = await db.paymentProof.findFirst({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
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
        { error: 'No payment found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      paymentStatus: {
        id: paymentProof.id,
        amount: paymentProof.amount,
        plan: paymentProof.plan,
        status: paymentProof.status,
        createdAt: paymentProof.createdAt.toISOString(),
        transactionId: paymentProof.txnId,
        screenshotUrl: encodeImageUrl(paymentProof.screenshotUrl)
      }
    })

  } catch (error) {
    console.error('Error fetching payment status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}