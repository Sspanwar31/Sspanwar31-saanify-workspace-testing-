import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    console.log('🔧 CREATING client@demo.com user...')
    
    // First, delete existing user if any
    await db.user.deleteMany({
      where: { email: 'client@demo.com' }
    })
    
    // Delete existing society account if any
    await db.societyAccount.deleteMany({
      where: { email: 'client@demo.com' }
    })
    
    console.log('🗑️ Deleted existing records')
    
    // Create society account
    const societyAccount = await db.societyAccount.create({
      data: {
        name: 'Sunrise Cooperative Society',
        adminName: 'Demo Client',
        email: 'client@demo.com',
        phone: '+91 98765 43210',
        address: 'Demo Society Address',
        subscriptionPlan: 'TRIAL',
        status: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    })
    
    console.log('✅ Society account created:', societyAccount.name)
    
    // Hash password
    const password = 'client123'
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Create user
    const user = await db.user.create({
      data: {
        name: 'Demo Client',
        email: 'client@demo.com',
        password: hashedPassword,
        role: 'ADMIN',
        societyAccountId: societyAccount.id,
        isActive: true
      }
    })
    
    console.log('✅ User created:', user.email)
    console.log('🔐 Password:', password)
    console.log('🏢 Society:', societyAccount.name)
    
    return NextResponse.json({
      success: true,
      message: 'Demo client created successfully',
      credentials: {
        email: 'client@demo.com',
        password: 'client123',
        societyName: 'Sunrise Cooperative Society'
      }
    })

  } catch (error) {
    console.error('❌ Error creating demo client:', error)
    return NextResponse.json(
      { error: 'Failed to create demo client: ' + error.message },
      { status: 500 }
    )
  }
}