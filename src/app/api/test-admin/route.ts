import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    console.log("🔍 Testing admin user existence...")
    
    const adminUser = await db.user.findUnique({
      where: { email: 'ADMIN@saanify.com' }
    })
    
    if (adminUser) {
      console.log("✅ Admin user found:", adminUser.email)
      return NextResponse.json({
        success: true,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role
        }
      })
    } else {
      console.log("❌ Admin user not found")
      return NextResponse.json({
        success: false,
        error: 'Admin user not found'
      })
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
}