import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, userType } = await request.json()
    
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: userType === 'admin' ? 'SUPER_ADMIN' : 'CLIENT'
      }
    })

    if (authError) {
      console.log('Supabase auth error:', authError)
      return NextResponse.json(
        { error: 'Failed to create user: ' + authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Profile will be created automatically by the trigger
    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verify profile was created
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User created but profile setup failed' },
        { status: 500 }
      )
    }

    // If it's a client, create a demo society account
    if (userType === 'client') {
      const { data: societyAccount, error: societyError } = await supabaseService
        .from('society_accounts')
        .insert([{
          name: `${name}'s Society`,
          admin_name: name,
          email,
          subscription_plan: 'TRIAL',
          status: 'TRIAL'
        }])
        .select()
        .single()

      if (!societyError && societyAccount) {
        // Link the society account to the user profile
        await supabaseService
          .from('profiles')
          .update({ society_account_id: societyAccount.id })
          .eq('id', authData.user.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role
      }
    })

  } catch (error) {
    console.error('Create demo user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}