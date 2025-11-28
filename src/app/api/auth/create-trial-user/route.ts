import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Create the trial user if it doesn't exist
    const existingUser = await db.user.findUnique({
      where: { email: 'client1@gmail.com' }
    })

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Trial user already exists',
        user: {
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role
        }
      })
    }

    // Create trial user
    const hashedPassword = await bcrypt.hash('client123', 12)

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 15)

    const user = await db.user.create({
      data: {
        name: 'Trial Client User',
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

    console.log('✅ Trial user created successfully:', { email: user.email, id: user.id })

    return NextResponse.json({
      success: true,
      message: 'Trial user created successfully',
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        password: 'client123' // Show for demo purposes
      }
    })
  } catch (error) {
    console.error('Error creating trial user:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create trial user'
    }, { status: 500 })
  }
}