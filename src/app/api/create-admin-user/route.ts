import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    console.log("🔧 Creating ADMIN@saanify.com user...")
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: 'ADMIN@saanify.com' }
    })
    
    if (existingUser) {
      console.log("ℹ️ ADMIN@saanify.com already exists")
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: {
          email: existingUser.email,
          role: existingUser.role
        }
      })
    }
    
    // Create the user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const newAdmin = await db.user.create({
      data: {
        email: 'ADMIN@saanify.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    console.log("✅ ADMIN@saanify.com created successfully")
    
    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        email: newAdmin.email,
        password: 'admin123',
        role: newAdmin.role
      }
    })
    
  } catch (error: any) {
    console.error('🔥 Error creating admin user:', error)
    return NextResponse.json({
      error: 'Failed to create admin user',
      details: error.message
    }, { status: 500 })
  }
}