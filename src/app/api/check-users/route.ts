import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔍 Checking all users in database...')
    
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

    // Check specifically for test@gmail.com
    const testUser = users.find(u => u.email === 'test@gmail.com')
    
    if (testUser) {
      console.log('\n✅ test@gmail.com FOUND:')
      console.log('- Has society account:', !!testUser.societyAccountId)
      console.log('- Society name:', testUser.societyAccount?.name)
      console.log('- Role:', testUser.role)
      console.log('- Has password:', !!testUser.password)
    } else {
      console.log('\n❌ test@gmail.com NOT FOUND')
    }

    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        societyName: u.societyAccount?.name,
        hasSociety: !!u.societyAccountId
      }))
    })

  } catch (error) {
    console.error('❌ Error checking users:', error)
    return NextResponse.json(
      { error: 'Failed to check users' },
      { status: 500 }
    )
  }
}