import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    console.log("🔍 Checking existing users...")
    
    // Check all users
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })
    
    console.log("📋 Found users:", users.length)
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Active: ${user.isActive}`)
    })
    
    // Check if admin user exists
    const adminUser = users.find(u => u.role === 'ADMIN')
    
    if (!adminUser) {
      console.log("❌ No admin user found. Creating admin user...")
      
      // Create admin user
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
      
      console.log("✅ Admin user created:", newAdmin.email)
      
      return NextResponse.json({
        success: true,
        message: 'Admin user created successfully',
        admin: {
          email: newAdmin.email,
          password: 'admin123'
        },
        allUsers: users
      })
    } else {
      console.log("✅ Admin user exists:", adminUser.email)
      
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists',
        admin: adminUser,
        allUsers: users
      })
    }
    
  } catch (error: any) {
    console.error('🔥 Error checking users:', error)
    return NextResponse.json({
      error: 'Failed to check users',
      details: error.message
    }, { status: 500 })
  }
}