import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔄 Fetching clients...')
    // Fetch all users with society accounts
    const users = await db.user.findMany({
      where: {
        role: {
          in: ['CLIENT', 'ADMIN']
        }
      }
    })

    // Fetch society accounts separately
    const societyAccounts = await db.societyAccount.findMany()

    // Transform data for frontend
    const clients = users.map(user => {
      const societyAccount = societyAccounts.find(sa => sa.email === user.email)
      return {
        id: user.id,
        name: societyAccount?.name || user.name || 'Unknown Society',
        email: user.email,
        phone: societyAccount?.phone || '',
        address: societyAccount?.address || '',
        plan: societyAccount?.subscriptionPlan || 'TRIAL',
        status: societyAccount?.status || 'Active',
        members: Math.floor(Math.random() * 500) + 50, // Demo data
        revenue: societyAccount?.subscriptionPlan === 'PRO' ? '₹2,400' : 
                societyAccount?.subscriptionPlan === 'BASIC' ? '₹600' : '₹0',
        lastActive: '2h ago',
        createdAt: user.createdAt.toISOString(),
        trialEndsAt: societyAccount?.trialEndsAt?.toISOString()
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, address, plan } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Create user first
    const user = await db.user.create({
      data: {
        name: name,
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
        adminName: name,
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
        id: user.id,
        name: name,
        email: email,
        plan: plan,
        status: plan === 'TRIAL' ? 'TRIAL' : 'ACTIVE'
      }
    })

  } catch (error) {
    console.error('Failed to create client:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}