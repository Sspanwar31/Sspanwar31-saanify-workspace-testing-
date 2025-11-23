import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { handleApiError } from '@/lib/error-handling'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action !== 'connect') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Check if we have OAuth configuration
    const clientId = process.env.SUPABASE_CLIENT_ID
    const redirectUri = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_URL}/api/integrations/supabase/oauth/callback`

    if (!clientId) {
      return NextResponse.json({
        error: 'OAuth not configured',
        details: 'Please set SUPABASE_CLIENT_ID in your environment variables',
        solution: 'Add SUPABASE_CLIENT_ID to your .env file'
      }, { status: 400 })
    }

    // Generate OAuth URL
    const authUrl = `https://supabase.com/auth/v1/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid profile email`

    return NextResponse.json({
      redirect: true,
      authUrl: authUrl,
      message: 'Redirecting to Supabase OAuth'
    })

  } catch (error: any) {
    console.error('OAuth connect error:', error)
    return handleApiError(error)
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Supabase OAuth connect endpoint',
    usage: 'POST with { action: "connect" }',
    note: 'Requires SUPABASE_CLIENT_ID environment variable'
  })
}