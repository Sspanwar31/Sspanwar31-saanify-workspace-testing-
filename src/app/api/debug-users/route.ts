import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔍 DEBUG: Checking all users in database...')
    
    // Get all users
    const users = await db.user.findMany({
      include: { societyAccount: true }
    })

    console.log('Total users found:', users.length)
    
    users.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`)
      console.log('ID:', user.id)
      console.log('Name:', user.name)
      console.log('Email:', user.email)
      console.log('Role:', user.role)
      console.log('Society Account ID:', user.societyAccountId)
      console.log('Has Password:', !!user.password)
      console.log('Is Active:', user.isActive)
      console.log('Society Name:', user.societyAccount?.name || 'No society')
      console.log('Created At:', user.createdAt)
    })

    // Check specifically for client@demo.com
    const testUser = users.find(u => u.email === 'client@demo.com')
    
    if (testUser) {
      console.log('\n✅ client@demo.com FOUND:')
      console.log('- Has society account:', !!testUser.societyAccountId)
      console.log('- Society name:', testUser.societyAccount?.name)
      console.log('- Role:', testUser.role)
      console.log('- Has password:', !!testUser.password)
      
      // If role is CLIENT, update it to ADMIN
      if (testUser.role === 'CLIENT') {
        console.log('🔧 Updating role from CLIENT to ADMIN...')
        const updatedUser = await db.user.update({
          where: { email: 'client@demo.com' },
          data: { role: 'ADMIN' }
        })
        console.log('✅ Role updated to ADMIN')
        console.log('Updated user:', updatedUser.email, 'New role:', updatedUser.role)
      }
    } else {
      console.log('\n❌ client@demo.com NOT FOUND')
      
      // Create the user if not found
      console.log('🔧 Creating client@demo.com user...')
      
      // First, delete any existing records
      await db.user.deleteMany({
        where: { email: 'client@demo.com' }
      })
      
      await db.societyAccount.deleteMany({
        where: { email: 'client@demo.com' }
      })
      
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
      
      // Hash password
      const password = 'client123'
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash(password, 12)
      
      // Create user with ADMIN role
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
      
      console.log('✅ User created with ADMIN role:')
      console.log('- Email:', user.email)
      console.log('- Role:', user.role)
      console.log('- Password:', password)
      console.log('- Society:', societyAccount.name)
    }

    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      message: 'Debug check completed'
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: 'Debug check failed: ' + error.message },
      { status: 500 }
    )
  }
}