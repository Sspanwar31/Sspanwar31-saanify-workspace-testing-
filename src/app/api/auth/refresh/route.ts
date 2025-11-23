import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'

// Simple token refresh function (replaces the deleted tokens library)
const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any
    
    // Get user from database to ensure they still exist and are active
    // For now, we'll just generate a new access token
    const accessToken = jwt.sign(
      { 
        userId: decoded.userId, 
        email: decoded.email, 
        role: decoded.role || 'user'
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    )

    return {
      accessToken,
      refreshToken // Return same refresh token
    }
  } catch (error) {
    throw new Error('Invalid refresh token')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 400 }
      )
    }

    const tokens = await refreshAccessToken(refreshToken)

    // Create response with new access token
    const response = NextResponse.json({
      success: true,
      accessToken: tokens.accessToken
    })

    // Update the access token cookie
    response.cookies.set('auth-token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 // 15 minutes
    })

    return response

  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 401 }
    )
  }
}