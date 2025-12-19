import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'

export async function POST() {
  try {
    // Clear Supabase configuration by removing the config file
    const configPath = join(process.cwd(), 'config', 'supabase-config.json')
    
    try {
      if (existsSync(configPath)) {
        unlinkSync(configPath)
        console.log('✅ Supabase configuration cleared')
      }
    } catch (error) {
      console.error('Failed to clear configuration:', error)
    }

    return NextResponse.json({
      message: '🔌 Supabase disconnected',
      success: true,
      config: {
        connected: false,
        enabled: false
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to disconnect',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const configPath = join(process.cwd(), 'config', 'supabase-config.json')
    const isConfigured = existsSync(configPath)
    
    return NextResponse.json({
      message: 'Supabase disconnect endpoint',
      configured: isConfigured,
      action: isConfigured ? 'disconnect' : 'connect'
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Configuration error',
      details: error.message
    })
  }
}