import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    console.log('🔧 DIRECT FIX: Changing client@demo.com role to ADMIN...')
    
    // Find the client@demo.com user
    const user = await db.user.findUnique({
      where: { email: 'client@demo.com' }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'client@demo.com user not found'
      }, { status: 404 })
    }

    console.log('📋 Current user info:')
    console.log('- Email:', user.email)
    console.log('- Current Role:', user.role)
    console.log('- Society Account ID:', user.societyAccountId)

    // Update the role to ADMIN
    const updatedUser = await db.user.update({
      where: { email: 'client@demo.com' },
      data: { role: 'ADMIN' }
    })

    console.log('✅ User role updated to ADMIN')
    console.log('📋 Updated user info:')
    console.log('- Email:', updatedUser.email)
    console.log('- New Role:', updatedUser.role)
    console.log('- Society Account ID:', updatedUser.societyAccountId)

    return NextResponse.json({
      success: true,
      message: 'client@demo.com role changed to ADMIN successfully',
      user: {
        email: updatedUser.email,
        oldRole: user.role,
        newRole: 'ADMIN',
        societyAccountId: updatedUser.societyAccountId
      }
    })

  } catch (error) {
    console.error('❌ Error updating user role:', error)
    return NextResponse.json(
      { error: 'Failed to update user role: ' + error.message },
      { status: 500 }
    )
  }
}