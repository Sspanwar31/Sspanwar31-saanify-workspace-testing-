import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock users data - in real implementation, this would query Supabase
    const users = [
      {
        id: '1',
        email: 'admin@saanify.com',
        role: 'admin',
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        status: 'active'
      },
      {
        id: '2',
        email: 'client@saanify.com',
        role: 'client',
        lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        status: 'active'
      },
      {
        id: '3',
        email: 'user1@saanify.com',
        role: 'user',
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        status: 'active'
      },
      {
        id: '4',
        email: 'user2@saanify.com',
        role: 'user',
        lastLogin: null,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        status: 'inactive'
      }
    ]

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
      active: users.filter(u => u.status === 'active').length
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users list' },
      { status: 500 }
    )
  }
}