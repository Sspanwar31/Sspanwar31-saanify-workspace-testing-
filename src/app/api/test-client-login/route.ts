import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing client login flow...')
    
    // Check if client user exists
    const clientUser = await db.user.findUnique({
      where: { email: 'client@demo.com' }
    })
    
    if (!clientUser) {
      console.log('❌ Client user not found')
      return NextResponse.json({ 
        success: false, 
        message: 'Client user not found',
        fix: 'Creating client user...',
        action: 'create-client'
      })
    }
    
    // Get society account info separately
    let societyAccount = null
    if (clientUser.societyAccountId) {
      societyAccount = await db.societyAccount.findUnique({
        where: { id: clientUser.societyAccountId }
      })
    }
    
    console.log('✅ Client user found:', {
      id: clientUser.id,
      email: clientUser.email,
      role: clientUser.role,
      societyName: societyAccount?.name,
      societyAccountId: clientUser.societyAccountId,
      isActive: clientUser.isActive
    })
    
    // Test password
    const testPassword = 'client123'
    const passwordMatch = await bcrypt.compare(testPassword, clientUser.password)
    
    if (!passwordMatch) {
      console.log('❌ Password mismatch')
      return NextResponse.json({ 
        success: false, 
        message: 'Password does not match',
        fix: 'Updating password...',
        action: 'fix-password'
      })
    }
    
    console.log('✅ Password matches')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Client login test passed!',
      user: {
        id: clientUser.id,
        email: clientUser.email,
        role: clientUser.role,
        societyName: societyAccount?.name,
        societyAccountId: clientUser.societyAccountId,
        isActive: clientUser.isActive
      },
      credentials: {
        email: 'client@demo.com',
        password: 'client123'
      }
    })
    
  } catch (error: any) {
    console.error('🧪 Test failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Test failed: ' + error.message 
    }, { status: 500 })
  }
}