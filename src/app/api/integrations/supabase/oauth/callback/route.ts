import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { handleApiError } from '@/lib/error-handling'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}?error=no_code&error_description=Authorization code not provided`
    )
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://api.supabase.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.SUPABASE_CLIENT_ID,
        client_secret: process.env.SUPABASE_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_URL}/api/integrations/supabase/oauth/callback`
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}?error=token_exchange_failed&error_description=${encodeURIComponent(errorData.error_description || 'Failed to exchange code for tokens')}`
      )
    }

    const tokens = await tokenResponse.json()

    // Store tokens securely
    const config = {
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
        token_type: tokens.token_type
      },
      provider: 'supabase',
      connected_at: new Date().toISOString()
    }

    // Save configuration
    const configPath = path.join(process.cwd(), 'config', 'supabase-config.json')
    
    try {
      fs.mkdirSync(path.dirname(configPath), { recursive: true })
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    } catch (error) {
      console.error('Failed to save config:', error)
    }

    // Get user info
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      tokens.access_token
    )

    const { data: user } = await supabase.auth.getUser()

    // Update config with user info
    const updatedConfig = {
      ...config,
      user: {
        id: user.user?.id,
        email: user.user?.email,
        name: user.user?.user_metadata?.full_name || user.user?.email,
        avatar_url: user.user?.user_metadata?.avatar_url
      },
      organization: {
        id: user.user?.app_metadata?.provider_id,
        name: user.user?.app_metadata?.provider_name
      },
      project: {
        id: user.user?.app_metadata?.project_id,
        name: user.user?.app_metadata?.project_name,
        database_region: user.user?.app_metadata?.region || 'auto'
      }
    }

    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2))

    // Redirect back to the app with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}?success=true&message=Successfully connected to Supabase`
    )

  } catch (error: any) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}?error=callback_failed&error_description=${encodeURIComponent(error.message || 'OAuth callback failed')}`
    )
  }
}