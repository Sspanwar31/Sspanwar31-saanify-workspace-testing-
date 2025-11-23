import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-it'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking session...')
    
    // Get token from cookie or header
    const token = request.cookies.get('auth-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '')

    console.log('🔍 Token found:', !!token)

    if (!token) {
      console.log('❌ No authentication token found')
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    console.log('🔍 Token decoded for user:', decoded.userId)
    
    // Get user with society information
    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      console.log('❌ User not found:', decoded.userId)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ User found:', { id: user.id, email: user.email, role: user.role })

    // Get society account separately if user has one
    let societyAccount = null
    if (user.societyAccountId) {
      societyAccount = await db.societyAccount.findUnique({
        where: { id: user.societyAccountId }
      })
      console.log('✅ Society account found:', societyAccount?.name)
    }

    console.log('✅ Session check successful')

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        societyAccountId: user.societyAccountId,
        societyAccount: societyAccount
      }
    })

  } catch (error) {
    console.error('❌ Check session error:', error)
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}