import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-it'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or header
    const token = request.cookies.get('auth-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Get user with society information
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      include: {
        societyAccount: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.societyAccountId) {
      return NextResponse.json(
        { error: 'User is not associated with any society' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        societyAccountId: user.societyAccountId,
        societyAccount: user.societyAccount
      }
    })

  } catch (error) {
    console.error('Get user society info error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500 }
    )
  }
}