import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    console.log('🔧 FORCE CREATING test@gmail.com user...')
    
    // First, delete existing user if any
    await db.user.deleteMany({
      where: { email: 'test@gmail.com' }
    })
    
    // Delete existing society account if any
    await db.societyAccount.deleteMany({
      where: { email: 'test@gmail.com' }
    })
    
    console.log('🗑️ Deleted existing records')
    
    // Create society account
    const societyAccount = await db.societyAccount.create({
      data: {
        name: 'namansociety',
        adminName: 'Test User',
        email: 'test@gmail.com',
        phone: '+91 98765 43210',
        address: 'Test Address',
        subscriptionPlan: 'TRIAL',
        status: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    })
    
    console.log('✅ Society account created:', societyAccount.name)
    
    // Hash password
    const password = 'namansociety123'
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Create user
    const user = await db.user.create({
      data: {
        name: 'Test User',
        email: 'test@gmail.com',
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
      message: 'User force created successfully',
      credentials: {
        email: 'test@gmail.com',
        password: 'namansociety123',
        societyName: 'namansociety'
      }
    })

  } catch (error) {
    console.error('❌ Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user: ' + error.message },
      { status: 500 }
    )
  }
}