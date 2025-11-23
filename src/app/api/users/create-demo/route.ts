import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { users } = await request.json()

    // Mock demo user creation - in real implementation, this would create users in Supabase
    await new Promise(resolve => setTimeout(resolve, 1500))

    return NextResponse.json({
      success: true,
      message: 'Demo users created successfully',
      users: users.map((user: any) => ({
        email: user.email,
        role: user.role,
        status: 'created'
      })),
      credentials: {
        'admin@saanify.com': 'Admin@123',
        'client@saanify.com': 'Client@123'
      }
    })
  } catch (error) {
    console.error('Failed to create demo users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create demo users' },
      { status: 500 }
    )
  }
}