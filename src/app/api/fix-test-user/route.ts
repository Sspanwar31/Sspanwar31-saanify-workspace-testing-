import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    console.log('🔍 Checking test@gmail.com user...')
    
    // Check if user exists
    const user = await db.user.findUnique({
      where: { email: 'test@gmail.com' },
      include: { societyAccount: true }
    })

    if (!user) {
      console.log('❌ User test@gmail.com not found. Creating...')
      
      // Create society account first
      const societyAccount = await db.societyAccount.create({
        data: {
          name: 'namansociety',
          adminName: 'Test User',
          email: 'test@gmail.com',
          phone: '+91 98765 43210',
          address: 'Test Address',
          subscriptionPlan: 'TRIAL',
          status: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          isActive: true
        }
      })

      // Hash password
      const password = 'namansociety123'
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user
      const newUser = await db.user.create({
        data: {
          name: 'Test User',
          email: 'test@gmail.com',
          password: hashedPassword,
          role: 'ADMIN',
          societyAccountId: societyAccount.id,
          isActive: true
        }
      })

      console.log('✅ User created successfully!')
      console.log('Email:', newUser.email)
      console.log('Password:', password)
      console.log('Society:', societyAccount.name)

      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        user: {
          email: newUser.email,
          password: password,
          societyName: societyAccount.name
        }
      })
    } else {
      console.log('✅ User found:', user.email)
      console.log('Role:', user.role)
      console.log('Society Account ID:', user.societyAccountId)
      console.log('Has Password:', !!user.password)
      console.log('Society:', user.societyAccount?.name)

      // Test password
      const testPassword = 'namansociety123'
      const isPasswordValid = await bcrypt.compare(testPassword, user.password || '')
      
      console.log('Password Test:', isPasswordValid ? '✅ Valid' : '❌ Invalid')

      if (!isPasswordValid) {
        // Update password
        const hashedPassword = await bcrypt.hash(testPassword, 12)
        await db.user.update({
          where: { email: 'test@gmail.com' },
          data: { password: hashedPassword }
        })
        console.log('🔧 Password updated to:', testPassword)
      }

      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: {
          email: user.email,
          role: user.role,
          societyName: user.societyAccount?.name,
          passwordValid: isPasswordValid
        }
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: 'Failed to check/create user' },
      { status: 500 }
    )
  }
}