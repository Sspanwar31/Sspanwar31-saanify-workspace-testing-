import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    console.log('🌱 Creating demo users...')

    // Demo users data
    const demoUsers = [
      {
        name: 'Super Admin',
        email: 'superadmin@saanify.com',
        password: 'admin123',
        role: 'SUPER_ADMIN'
      },
      {
        name: 'Admin User',
        email: 'admin@saanify.com',
        password: 'admin123',
        role: 'ADMIN'
      },
      {
        name: 'Client User',
        email: 'client@saanify.com',
        password: 'client123',
        role: 'CLIENT'
      }
    ]

    const createdUsers = []

    for (const userData of demoUsers) {
      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email: userData.email }
      })

      if (!existingUser) {
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10)

        // Create user
        const user = await db.user.create({
          data: {
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            role: userData.role,
            isActive: true,
            lastLoginAt: new Date()
          }
        })

        createdUsers.push({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        })

        console.log(`✅ Created user: ${userData.email} (${userData.role})`)
      } else {
        createdUsers.push({
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role
        })

        console.log(`ℹ️ User already exists: ${userData.email} (${existingUser.role})`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Demo users created successfully',
      users: createdUsers
    })

  } catch (error) {
    console.error('❌ Error creating demo users:', error)
    return NextResponse.json(
      { error: 'Failed to create demo users' },
      { status: 500 }
    )
  }
}