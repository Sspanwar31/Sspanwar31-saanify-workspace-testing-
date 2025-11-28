import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get all users
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      count: users.length,
      users: users.map(user => ({
        ...user,
        password: '[HIDDEN]'
      }))
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Create a demo client user if it doesn't exist
    const existingUser = await db.user.findUnique({
      where: { email: 'client1@gmail.com' }
    })

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Demo client user already exists',
        user: {
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role
        }
      })
    }

    // Create demo client user
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash('client123', 12)

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 15)

    const user = await db.user.create({
      data: {
        name: 'Demo Client User',
        email: 'client1@gmail.com',
        password: hashedPassword,
        role: 'CLIENT',
        isActive: true,
        trialEndsAt,
        subscriptionStatus: 'TRIAL',
        plan: 'TRIAL',
        expiryDate: trialEndsAt,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Demo client user created successfully',
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        password: 'client123' // Show for demo purposes
      }
    })
  } catch (error) {
    console.error('Error creating demo user:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create demo user'
    }, { status: 500 })
  }
}