import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Admin API to update payment mode
export async function POST(request: NextRequest) {
  try {
    const { mode } = await request.json()

    // Validate mode
    if (!mode || !['MANUAL', 'RAZORPAY'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid payment mode. Must be MANUAL or RAZORPAY' },
        { status: 400 }
      )
    }

    // In a real application, verify admin authentication
    // For now, we'll proceed with the update

    // Update or create the payment mode setting in database
    await db.systemSetting.upsert({
      where: {
        key: 'PAYMENT_MODE'
      },
      update: {
        value: mode
      },
      create: {
        key: 'PAYMENT_MODE',
        value: mode
      }
    })
    
    console.log(`Payment mode updated to: ${mode}`)

    return NextResponse.json({
      success: true,
      message: `Payment mode updated to ${mode}`,
      mode,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error updating payment mode:', error)
    return NextResponse.json(
      { error: 'Failed to update payment mode' },
      { status: 500 }
    )
  }
}

// Get current payment mode
export async function GET() {
  try {
    // Try to get payment mode from database first
    const setting = await db.systemSetting.findUnique({
      where: {
        key: 'PAYMENT_MODE'
      }
    })
    
    const currentMode = setting?.value || 'MANUAL'
    
    return NextResponse.json({
      mode: currentMode,
      available: ['MANUAL', 'RAZORPAY']
    })

  } catch (error) {
    console.error('Error fetching payment mode:', error)
    // Fallback to environment variable if database fails
    const fallbackMode = process.env.NEXT_PUBLIC_PAYMENT_MODE || 'MANUAL'
    
    return NextResponse.json({
      mode: fallbackMode,
      available: ['MANUAL', 'RAZORPAY']
    })
  }
}