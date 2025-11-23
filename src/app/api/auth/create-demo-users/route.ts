import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Creating demo users for unified authentication...')

    // Demo users data
    const demoUsers = [
      {
        email: 'superadmin@saanify.com',
        name: 'Super Admin',
        password: 'admin123',
        role: 'SUPER_ADMIN',
        isActive: true
      },
      {
        email: 'admin@saanify.com',
        name: 'Admin User',
        password: 'admin123',
        role: 'ADMIN',
        isActive: true
      },
      {
        email: 'client@saanify.com',
        name: 'Client User',
        password: 'client123',
        role: 'CLIENT',
        isActive: true
      },
      {
        email: 'testclient1@gmail.com',
        name: 'Test Client One',
        password: 'client123',
        role: 'CLIENT',
        isActive: true
      },
      {
        email: 'testadmin1@gmail.com',
        name: 'Test Admin One',
        password: 'admin123',
        role: 'ADMIN',
        isActive: true
      }
    ]

    const createdUsers = []
    const updatedUsers = []

    for (const userData of demoUsers) {
      try {
        // Check if user already exists
        const existingUser = await db.user.findUnique({
          where: { email: userData.email }
        })

        const hashedPassword = await bcrypt.hash(userData.password, 12)

        if (existingUser) {
          // Update existing user
          const updatedUser = await db.user.update({
            where: { email: userData.email },
            data: {
              password: hashedPassword,
              role: userData.role,
              isActive: userData.isActive,
              name: userData.name
            }
          })
          updatedUsers.push(updatedUser)
          console.log(`✅ Updated existing user: ${userData.email} (${userData.role})`)
        } else {
          // Create new user
          const newUser = await db.user.create({
            data: {
              email: userData.email,
              name: userData.name,
              password: hashedPassword,
              role: userData.role,
              isActive: userData.isActive
            }
          })
          createdUsers.push(newUser)
          console.log(`✅ Created new user: ${userData.email} (${userData.role})`)
        }
      } catch (error) {
        console.error(`❌ Error processing user ${userData.email}:`, error)
      }
    }

    console.log(`🎉 Demo users setup completed!`)
    console.log(`   Created: ${createdUsers.length} new users`)
    console.log(`   Updated: ${updatedUsers.length} existing users`)

    return NextResponse.json({
      success: true,
      message: 'Demo users created/updated successfully',
      data: {
        created: createdUsers.map(u => ({ email: u.email, role: u.role, name: u.name })),
        updated: updatedUsers.map(u => ({ email: u.email, role: u.role, name: u.name })),
        totalDemoUsers: demoUsers.length,
        credentials: {
          admin: {
            email: 'superadmin@saanify.com',
            password: 'admin123',
            redirectUrl: '/superadmin'
          },
          client: {
            email: 'client@saanify.com',
            password: 'client123',
            redirectUrl: '/client/dashboard'
          }
        }
      }
    })

  } catch (error) {
    console.error('🔥 Error creating demo users:', error)
    return NextResponse.json({
      error: 'Failed to create demo users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check demo users
export async function GET(request: NextRequest) {
  try {
    const demoEmails = [
      'superadmin@saanify.com',
      'admin@saanify.com', 
      'client@saanify.com',
      'testclient1@gmail.com',
      'testadmin1@gmail.com'
    ]

    const users = await db.user.findMany({
      where: {
        email: {
          in: demoEmails
        }
      },
      select: {
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      demoUsers: users,
      count: users.length
    })

  } catch (error) {
    console.error('Error checking demo users:', error)
    return NextResponse.json({
      error: 'Failed to check demo users'
    }, { status: 500 })
  }
}