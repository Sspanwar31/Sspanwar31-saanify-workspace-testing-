import { NextRequest, NextResponse } from 'next/server'
import { getClientAuth } from '@/lib/client-auth'

export async function GET(request: NextRequest) {
  try {
    // Verify client authentication
    const auth = await getClientAuth(request)
    
    if (!auth.authenticated) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Access denied',
        redirectTo: '/login'
      }, { status: 401 })
    }

    // Get all legitimate clients for admin view (if needed)
    const { db } = await import('@/lib/db')
    const allClients = await db.user.findMany({
      where: {
        OR: [
          { email: 'client1@gmail.com' }, // Demo client
          { email: 'client@saanify.com' }, // Demo client
          { subscriptionStatus: 'TRIAL' }, // Real trial users
          { subscriptionStatus: 'ACTIVE' }  // Real paid users
        ],
        role: 'CLIENT',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionStatus: true,
        plan: true,
        trialEndsAt: true,
        expiryDate: true,
        createdAt: true,
        lastLoginAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Client access verified successfully',
      currentUser: auth.user,
      allClients: allClients,
      clientStats: {
        totalClients: allClients.length,
        trialClients: allClients.filter(c => c.subscriptionStatus === 'TRIAL').length,
        activeClients: allClients.filter(c => c.subscriptionStatus === 'ACTIVE').length,
        demoClients: allClients.filter(c => c.email === 'client1@gmail.com' || c.email === 'client@saanify.com').length
      }
    })

  } catch (error) {
    console.error('Client verification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to verify client access'
    }, { status: 500 })
  }
}