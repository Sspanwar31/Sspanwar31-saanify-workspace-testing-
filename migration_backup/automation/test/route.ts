import { NextRequest, NextResponse } from 'next/server'
import { AutomationService } from '@/lib/automation-service'

export async function POST() {
  try {
    const result = await AutomationService.testSystem()
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('System test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'System test failed',
        error: error.message 
      },
      { status: 500 }
    )
  }
}