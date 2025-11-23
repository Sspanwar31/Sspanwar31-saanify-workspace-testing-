import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase-service'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Create user in Supabase
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name: name || email.split('@')[0]
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create user in our database
    const user = await db.user.create({
      data: {
        id: authData.user.id,
        email: authData.user.email!,
        name: name || email.split('@')[0],
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: { societyAccount: true }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        societyAccount: user.societyAccount
      }
    })
  } catch (error) {
    console.error('Supabase signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}