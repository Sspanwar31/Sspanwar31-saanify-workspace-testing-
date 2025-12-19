import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
               request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return { authenticated: false, error: 'No token provided' }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return { authenticated: true, error: 'Access denied - Admin privileges required' }
    }

    return { authenticated: true, userId: decoded.userId }
  } catch (error) {
    return { authenticated: false, error: 'Invalid token' }
  }
}

// Admin API to update payment mode
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin
    const auth = await authenticateAdmin(request)
    if (!auth.authenticated) {
      return NextResponse.json({
        authenticated: false,
        success: false,
        error: auth.error
      }, { status: 200 })
    }

    if (auth.error) {
      return NextResponse.json({
        authenticated: true,
        success: false,
        error: auth.error
      }, { status: 200 })
    }

    const { mode } = await request.json()

    // Validate mode
    if (!mode || !['MANUAL', 'RAZORPAY'].includes(mode)) {
      return NextResponse.json({
        authenticated: true,
        success: false,
        error: 'Invalid payment mode. Must be MANUAL or RAZORPAY'
      }, { status: 200 })
    }

    // Update or create the payment mode setting in database
    await db.systemSetting.upsert({
      where: {
        key: 'PAYMENT_MODE'
      },
      update: {
        value: mode
      },
      create: {
        key: 'PAYMENT_MODE',
        value: mode
      }
    })
    
    console.log(`Payment mode updated to: ${mode}`)

    return NextResponse.json({
      authenticated: true,
      success: true,
      message: `Payment mode updated to ${mode}`,
      mode,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error updating payment mode:', error)
    return NextResponse.json({
      authenticated: false,
      success: false,
      error: 'Failed to update payment mode'
    }, { status: 200 })
  }
}

// Get current payment mode
export async function GET(request: NextRequest) {
  try {
    // For GET requests, we'll allow public access since this is just reading the payment mode
    // But we'll still check authentication if available
    let authenticated = false
    let userId = null

    const token = request.cookies.get('auth-token')?.value || 
                 request.headers.get('Authorization')?.replace('Bearer ', '')

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        const user = await db.user.findUnique({
          where: { id: decoded.userId },
          select: { role: true }
        })
        authenticated = !!user
        userId = decoded.userId
      } catch (error) {
        // Token invalid, but we'll still allow reading payment mode
        authenticated = false
      }
    }

    // Try to get payment mode from database first
    const setting = await db.systemSetting.findUnique({
      where: {
        key: 'PAYMENT_MODE'
      }
    })
    
    const currentMode = setting?.value || 'MANUAL'
    
    return NextResponse.json({
      authenticated,
      mode: currentMode,
      available: ['MANUAL', 'RAZORPAY'],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching payment mode:', error)
    // Fallback to environment variable if database fails
    const fallbackMode = process.env.NEXT_PUBLIC_PAYMENT_MODE || 'MANUAL'
    
    return NextResponse.json({
      authenticated: false,
      mode: fallbackMode,
      available: ['MANUAL', 'RAZORPAY'],
      timestamp: new Date().toISOString()
    })
  }
}