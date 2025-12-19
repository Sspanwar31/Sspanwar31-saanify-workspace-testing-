import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Create demo societies with admin users
    const demoClients = [
      {
        societyName: 'Sunrise Cooperative Society',
        adminName: 'Rajesh Kumar',
        email: 'rajesh@sunrise.com',
        phone: '+91 98765 43210',
        address: '123 MG Road, Bangalore',
        subscriptionType: 'TRIAL' as const,
        trialPeriod: '15'
      },
      {
        societyName: 'Green Valley Residents Association',
        adminName: 'Priya Sharma',
        email: 'priya@greenvalley.com',
        phone: '+91 87654 32109',
        address: '456 Park Avenue, Mumbai',
        subscriptionType: 'BASIC' as const,
        trialPeriod: '15'
      },
      {
        societyName: 'Blue Moon Housing Society',
        adminName: 'Amit Patel',
        email: 'amit@bluemoon.com',
        phone: '+91 76543 21098',
        address: '789 Nehru Street, Delhi',
        subscriptionType: 'PRO' as const,
        trialPeriod: '15'
      }
    ]

    const createdClients = []

    for (const clientData of demoClients) {
      // Check if already exists
      const existing = await db.user.findFirst({
        where: { email: clientData.email }
      })

      if (existing) {
        console.log(`Client ${clientData.email} already exists, skipping...`)
        continue
      }

      // Generate default password
      const defaultPassword = clientData.societyName.replace(/\s+/g, '').toLowerCase() + '123'
      const hashedPassword = await bcrypt.hash(defaultPassword, 12)

      // Calculate trial end date
      let trialEndsAt = null
      if (clientData.subscriptionType === 'TRIAL') {
        const trialDays = parseInt(clientData.trialPeriod || '15')
        trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)
      }

      // Create Society Account
      const societyAccount = await db.societyAccount.create({
        data: {
          name: clientData.societyName,
          adminName: clientData.adminName,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address,
          subscriptionPlan: clientData.subscriptionType,
          status: clientData.subscriptionType === 'TRIAL' ? 'TRIAL' : 'ACTIVE',
          trialEndsAt: trialEndsAt,
          isActive: true
        }
      })

      // Create User
      const user = await db.user.create({
        data: {
          name: clientData.adminName,
          email: clientData.email,
          password: hashedPassword,
          role: 'ADMIN',
          societyAccountId: societyAccount.id,
          isActive: true
        }
      })

      createdClients.push({
        societyName: societyAccount.name,
        adminName: user.name,
        email: user.email,
        defaultPassword: defaultPassword,
        subscriptionPlan: societyAccount.subscriptionPlan
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Demo clients created successfully',
      clients: createdClients
    })

  } catch (error) {
    console.error('Create demo clients error:', error)
    return NextResponse.json(
      { error: 'Failed to create demo clients' },
      { status: 500 }
    )
  }
}