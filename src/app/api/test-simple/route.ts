import { NextRequest, NextResponse } from 'next/server'

// Simple test endpoint without authentication
export const GET = async () => {
  return NextResponse.json({
    success: true,
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json()
    return NextResponse.json({
      success: true,
      message: 'POST test working',
      received_data: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to parse request body',
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }
}