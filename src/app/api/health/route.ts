import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock health check - in real implementation, check system health
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: '99.9%',
      responseTime: '120ms',
      database: 'connected',
      services: {
        api: 'healthy',
        database: 'healthy',
        auth: 'healthy'
      }
    }

    return NextResponse.json(healthData)
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}