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
    // Verify admin authentication
    const user = verifyToken(request)
    if (!user || !['ADMIN', 'SUPERADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Get all payment proofs with user details
    const paymentProofs = await db.paymentProof.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate stats
    const stats = {
      total: paymentProofs.length,
      pending: paymentProofs.filter(p => p.status === 'pending').length,
      approved: paymentProofs.filter(p => p.status === 'approved').length,
      rejected: paymentProofs.filter(p => p.status === 'rejected').length,
      totalAmount: paymentProofs
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + p.amount, 0)
    }

    return NextResponse.json({
      success: true,
      proofs: paymentProofs,
      stats
    })

  } catch (error) {
    console.error('Error fetching payment proofs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}