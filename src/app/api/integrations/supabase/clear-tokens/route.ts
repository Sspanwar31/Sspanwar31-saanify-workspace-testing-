import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    // Clear OAuth tokens from config file
    const configPath = join(process.cwd(), 'config', 'supabase-config.json')
    
    try {
      if (existsSync(configPath)) {
        unlinkSync(configPath)
        console.log('✅ Supabase tokens cleared successfully')
      }
    } catch (error) {
      console.error('Failed to clear tokens:', error)
    }

    return NextResponse.json({
      message: '✅ OAuth tokens cleared successfully',
      details: {
        configFile: 'Cleared OAuth tokens from config',
        recommendation: 'You can now reconnect using OAuth or manual connection'
      }
    })

  } catch (error: any) {
    console.error('Failed to clear OAuth tokens:', error)
    return NextResponse.json(
      { error: 'Failed to clear OAuth tokens', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'OAuth token cleanup endpoint',
    usage: 'POST request to clear tokens',
    description: 'Clears OAuth tokens and resets connection'
  })
}