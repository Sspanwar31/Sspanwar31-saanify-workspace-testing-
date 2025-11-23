import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase-service'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Use Supabase auth
    const { data: authData, error: authError } = await supabaseService.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user exists in our database
    let user = await db.user.findUnique({
      where: { email },
      include: { societyAccount: true }
    })

    // If user doesn't exist in our DB, create them
    if (!user) {
      user = await db.user.create({
        data: {
          id: authData.user.id,
          email: authData.user.email!,
          name: authData.user.user_metadata?.name || email.split('@')[0],
          role: 'user',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: { societyAccount: true }
      })
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        societyAccount: user.societyAccount
      },
      session: authData.session
    })
  } catch (error) {
    console.error('Supabase login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}