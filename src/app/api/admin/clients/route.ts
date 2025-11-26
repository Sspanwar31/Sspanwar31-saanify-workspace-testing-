import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/auth-middleware'

export async function GET() {
  try {
    console.log('🔄 Fetching clients...')
    // Fetch society accounts
    const societyAccounts = await db.societyAccount.findMany()

    // Fetch only users that have society accounts
    const users = await db.user.findMany({
      where: {
        role: {
          in: ['CLIENT', 'ADMIN']
        }
      }
    })

    // Transform data for frontend - only include users with matching society accounts
    const clients = societyAccounts.map(societyAccount => {
      const user = users.find(u => u.email === societyAccount.email)
      return {
        id: societyAccount.id, // Use society account ID
        name: societyAccount.name || user?.name || 'Unknown Society',
        adminName: user?.name || societyAccount.adminName || 'Unknown Admin',
        email: societyAccount.email,
        phone: societyAccount.phone || '',
        address: societyAccount.address || '',
        subscriptionPlan: societyAccount.subscriptionPlan || 'TRIAL',
        status: societyAccount.status || 'TRIAL',
        members: Math.floor(Math.random() * 500) + 50, // Demo data
        revenue: societyAccount.subscriptionPlan === 'PRO' ? '₹2,400' : 
                societyAccount.subscriptionPlan === 'BASIC' ? '₹600' : '₹0',
        lastActive: '2h ago',
        createdAt: societyAccount.createdAt.toISOString(),
        trialEndsAt: societyAccount.trialEndsAt?.toISOString(),
        subscriptionEndsAt: societyAccount.subscriptionEndsAt?.toISOString()
      }
    })

    console.log('✅ Clients fetched successfully:', clients.length)
    return NextResponse.json({
      success: true,
      clients: clients
    })

  } catch (error) {
    console.error('❌ Failed to fetch clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export const POST = withAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { name, adminName, email, phone, address, plan } = body
    
    if (!name || !adminName || !email) {
      return NextResponse.json(
        { error: 'Name, admin name, and email are required' },
        { status: 400 }
      )
    }

    // Create user first
    const user = await db.user.create({
      data: {
        name: adminName,
        email: email,
        role: 'CLIENT',
        isActive: true,
        emailVerified: new Date()
      }
    })

    // Create society account
    const societyAccount = await db.societyAccount.create({
      data: {
        name: name,
        adminName: adminName,
        email: email,
        phone: phone,
        address: address,
        subscriptionPlan: plan,
        status: plan === 'TRIAL' ? 'TRIAL' : 'ACTIVE',
        trialEndsAt: plan === 'TRIAL' ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) : null,
        isActive: true
      }
    })

    // Link user to society account
    await db.user.update({
      where: { id: user.id },
      data: { societyAccountId: societyAccount.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Client created successfully',
      client: {
        id: societyAccount.id, // Return society account ID for individual operations
        name: name,
        adminName: adminName,
        email: email,
        phone: phone,
        address: address,
        subscriptionPlan: plan, // Changed from 'plan' to 'subscriptionPlan'
        status: plan === 'TRIAL' ? 'TRIAL' : 'ACTIVE',
        createdAt: societyAccount.createdAt.toISOString(),
        trialEndsAt: plan === 'TRIAL' ? societyAccount.trialEndsAt?.toISOString() : null,
        subscriptionEndsAt: societyAccount.subscriptionEndsAt?.toISOString(),
        userId: user.id // Also include user ID for reference
      }
    })

  } catch (error) {
    console.error('Failed to create client:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
})

export const DELETE = withAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { clientId } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    console.log(`Deleting client with ID: ${clientId}`)

    // Try to delete by society account ID first
    try {
      await db.societyAccount.delete({
        where: { id: clientId }
      })
      
      // Also try to delete the associated user if exists
      const user = await db.user.findFirst({
        where: { societyAccountId: clientId }
      })
      
      if (user) {
        await db.user.delete({
          where: { id: user.id }
        })
      }
    } catch (societyError) {
      console.log('Failed to delete by society account ID, trying by user ID...')
      
      // If that fails, try to delete by user ID
      const user = await db.user.findUnique({
        where: { id: clientId }
      })
      
      if (!user) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        )
      }
      
      // Delete society account first if it exists
      if (user.societyAccountId) {
        await db.societyAccount.delete({
          where: { id: user.societyAccountId }
        })
      }
      
      // Then delete the user
      await db.user.delete({
        where: { id: clientId }
      })
    }

    console.log('Client deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    })

  } catch (error) {
    console.error('Failed to delete client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client: ' + error.message },
      { status: 500 }
    )
  }
})