import { NextRequest, NextResponse } from 'next/server'

export async function POST() {
  try {
    // Mock enabling local database
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: 'Local database enabled successfully',
      config: {
        provider: 'sqlite',
        location: './db/dev.db',
        autoSync: true,
        rlsEnabled: true
      }
    })
  } catch (error) {
    console.error('Failed to enable local database:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to enable local database' 
      },
      { status: 500 }
    )
  }
}