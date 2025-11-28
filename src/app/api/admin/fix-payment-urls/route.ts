import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

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
    // Check if user is authenticated and is admin
    const user = await getUserFromToken(request)
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      )
    }

    const { updates } = await request.json()
    
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      )
    }

    let updatedCount = 0
    
    for (const { oldUrl, newUrl } of updates) {
      const result = await db.pendingPayment.updateMany({
        where: { screenshotUrl: oldUrl },
        data: { screenshotUrl: newUrl }
      })
      
      updatedCount += result.count
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} payment proof URLs`,
      updatedCount
    })

  } catch (error) {
    console.error('Error updating payment proof URLs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}