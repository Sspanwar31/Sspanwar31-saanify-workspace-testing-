import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get all legitimate clients
    const legitimateClients = await db.user.findMany({
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
      message: 'Legitimate clients retrieved successfully',
      data: {
        clients: legitimateClients,
        summary: {
          totalClients: legitimateClients.length,
          demoClients: legitimateClients.filter(c => c.email === 'client1@gmail.com' || c.email === 'client@saanify.com').length,
          trialClients: legitimateClients.filter(c => c.subscriptionStatus === 'TRIAL').length,
          activeClients: legitimateClients.filter(c => c.subscriptionStatus === 'ACTIVE').length
        }
      }
    })

  } catch (error) {
    console.error('Error fetching legitimate clients:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch legitimate clients'
    }, { status: 500 })
  }
}