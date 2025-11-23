import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { handleApiError } from '@/lib/error-handling'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Load Supabase configuration from local file
function loadSupabaseConfig() {
  try {
    const configPath = join(process.cwd(), 'config', 'supabase-config.json')
    if (!existsSync(configPath)) {
      return {}
    }
    const configData = readFileSync(configPath, 'utf8')
    return JSON.parse(configData)
  } catch (error) {
    console.log('No existing Supabase configuration found')
    return {}
  }
}

// Load environment configuration
function loadEnvConfig() {
  try {
    const configPath = join(process.cwd(), '.env.local')
    if (!existsSync(configPath)) {
      return {}
    }
    const configData = readFileSync(configPath, 'utf8')
    const envConfig: Record<string, string> = {}
    configData.split('\n').forEach(line => {
      const [key, ...values] = line.split('=')
      if (key && values.length > 0) {
        envConfig[key.trim()] = values.join('=').trim()
      }
    })
    return envConfig
  } catch (error) {
    console.log('No environment configuration found')
    return {}
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { supabaseUrl, anonKey } = body
    
    // If credentials are provided in the request, use them
    if (supabaseUrl && anonKey) {
      return testConnection(supabaseUrl, anonKey)
    }
    
    // Otherwise, use saved configuration
    const envConfig = loadEnvConfig()
    const supabaseConfig = loadSupabaseConfig()
    
    let testUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL
    let testKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // If OAuth is connected, use the access token
    if (supabaseConfig.tokens?.access_token) {
      testKey = supabaseConfig.tokens.access_token
    }
    
    if (!testUrl || !testKey) {
      return NextResponse.json(
        { error: 'No Supabase configuration found' },
        { status: 400 }
      )
    }
    
    return testConnection(testUrl, testKey)
    
  } catch (error: any) {
    console.error('Supabase test error:', error)
    return handleApiError(error)
  }
}

async function testConnection(supabaseUrl: string, anonKey: string) {
  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch {
    return NextResponse.json(
      { error: 'Invalid Supabase URL format' },
      { status: 400 }
    )
  }

  // Test connection with provided credentials
  const supabase = createClient(supabaseUrl, anonKey)
  
  const results = {
    basicConnection: false,
    tableAccess: false,
    authTest: false
  }

  // Test 1: Basic connection
  try {
    const { error } = await supabase.from('users').select('*').limit(1)
    results.basicConnection = !error
    if (error && error.code !== 'PGRST116') {
      results.basicConnection = false
    }
  } catch (error) {
    results.basicConnection = false
  }

  // Test 2: Try to access auth (if available)
  try {
    const { data: authData } = await supabase.auth.getSession()
    results.authTest = !!authData
  } catch (error) {
    results.authTest = false
  }

  // Test 3: Check if we can read system tables
  try {
    const { error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)
    results.tableAccess = !error
  } catch (error) {
    results.tableAccess = false
  }

  const successful = Object.values(results).filter(Boolean).length
  const total = Object.keys(results).length

  return NextResponse.json({
    success: successful > 0,
    summary: {
      successful,
      total,
      percentage: Math.round((successful / total) * 100)
    },
    details: {
      basicConnection: results.basicConnection,
      tableAccess: results.tableAccess,
      authTest: results.authTest,
      message: successful === total 
        ? 'All connection tests passed' 
        : successful > 0 
          ? 'Partial connection success' 
          : 'Connection failed'
    },
    recommendations: successful === 0 ? [
      'Check your Supabase URL is correct',
      'Verify your anon key is valid',
      'Ensure your Supabase project is active'
    ] : successful < total ? [
      'Some features may not work fully',
      'Consider checking your RLS policies'
    ] : []
  })
}

export async function GET() {
  return NextResponse.json({
    message: 'Supabase connection test endpoint',
    usage: 'POST with { supabaseUrl, anonKey } or use saved configuration',
    tests: ['basicConnection', 'tableAccess', 'authTest']
  })
}