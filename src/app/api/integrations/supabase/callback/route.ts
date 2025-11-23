import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { handleApiError } from '@/lib/error-handling'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import crypto from 'crypto'

// Decrypt function (same as in connect route)
function decrypt(encryptedData: string): string {
  const algorithm = 'aes-256-gcm'
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'fallback-key-32-chars-long', 'salt', 100000)
  const textParts = encryptedData.split(':')
  const iv = Buffer.from(textParts[0], 'hex')
  const encryptedText = Buffer.from(textParts[1], 'hex')
  const decipher = crypto.createDecipher(algorithm, key, iv)
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted = decipher.final('utf8')
  
  return decrypted
}

// Store configuration in local file
function saveConfig(config: any) {
  try {
    const configPath = join(process.cwd(), '.saanify-restore.json')
    const existingConfig = readFileSync(configPath, 'utf8')
    const parsedConfig = existingConfig ? JSON.parse(existingConfig) : {}
    
    const updatedConfig = {
      ...parsedConfig,
      supabase: {
        ...parsedConfig.supabase,
        ...config
      }
    }
    
    writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2))
    console.log('✅ Supabase configuration saved')
    return updatedConfig
  } catch (error) {
    console.error('Failed to save configuration:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const { code, state, error, error_description } = searchParams

  if (error) {
    return NextResponse.json({
      error: 'OAuth failed',
      details: error_description || 'Unknown error occurred',
      status: 400
    })
  }

  if (!code) {
    return NextResponse.json({
      error: 'Authorization code is required',
      status: 400
    })
  }

  if (!state) {
    return NextResponse.json({
      error: 'State parameter is required',
      status: 400
    })
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://api.supabase.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: process.env.SUPABASE_CLIENT_ID || 'your-client-id',
        redirect_uri: process.env.NEXTAUTH_URL 
          ? `${process.env.NEXTAUTH_URL}/api/integrations/supabase/callback`
          : 'http://localhost:3000/api/integrations/supabase/callback',
        code_verifier: 'your-code-verifier'
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      return NextResponse.json({
        error: 'Token exchange failed',
        details: errorData,
        status: 400
      })
    }

    const tokens = await tokenResponse.json()

    // Create Supabase client with access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oyxfyovoqtcmpgazckcl.supabase.co',
      tokens.access_token
    )

    // Get user and organization info
    const { data: user } = await supabase.auth.getUser()
    const { data: org } = await supabase.rpc('get_organization', { 
      slug: user.user_metadata?.organization_slug 
    })

    // Get project info
    const { data: projects } = await supabase.rpc('list_projects', {
      limit: 1
    })

    const project = projects[0]

    // Save configuration
    const config = saveConfig({
      enabled: true,
      autoOAuth: true,
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug
      },
      project: {
        id: project.id,
        name: project.name,
        database_region: project.region,
        created_at: project.created_at
      },
      tokens: {
        access_token: encrypt(tokens.access_token),
        refresh_token: encrypt(tokens.refresh_token),
        expires_at: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString()
      }
    })

    return NextResponse.json({
      message: '🎉 Supabase connected via OAuth!',
      success: true,
      config: {
        organization: config.supabase.organization,
        project: config.supabase.project,
        autoOAuth: config.supabase.autoOAuth
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email
      }
    })

  } catch (error: any) {
    console.error('Supabase OAuth callback error:', error)
    return handleApiError(error)
  }
}