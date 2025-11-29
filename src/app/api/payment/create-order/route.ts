import { NextRequest, NextResponse } from 'next/server'

// Razorpay order creation API
export async function POST(request: NextRequest) {
  try {
    const { planId, amount, currency = 'INR', receipt } = await request.json()

    // Validate input
    if (!planId || !amount) {
      return NextResponse.json(
        { error: 'Plan ID and amount are required' },
        { status: 400 }
      )
    }

    // Validate amount (should be in paise for Razorpay)
    const amountInPaise = Math.round(amount * 100)
    if (amountInPaise < 100) { // Minimum ₹1
      return NextResponse.json(
        { error: 'Minimum amount is ₹1' },
        { status: 400 }
      )
    }

    // In production, you would:
    // 1. Initialize Razorpay instance with your keys
    // 2. Create an order with Razorpay API
    // 3. Store order details in your database
    // 4. Return order details to client

    // For demo purposes, we'll simulate Razorpay order creation
    const mockOrder = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      status: 'created',
      attempts: 0,
      notes: {
        planId: planId,
        userId: 'demo_user', // Would get from authenticated session
        createdAt: new Date().toISOString()
      },
      created_at: Math.floor(Date.now() / 1000)
    }

    // Log for demonstration
    console.log('Razorpay order created:', mockOrder)

    // In production with actual Razorpay:
    /*
    const Razorpay = require('razorpay')
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: currency,
      receipt: receipt,
      notes: {
        planId: planId,
        userId: userId
      }
    })
    */

    return NextResponse.json({
      success: true,
      order: mockOrder,
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo_key', // In production, use actual key
      currency: currency,
      amount: amount,
      name: 'Saanify Subscription',
      description: `Payment for ${planId} plan`,
      prefill: {
        name: 'Demo User',
        email: 'demo@example.com',
        contact: '+919876543210'
      }
    })

  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    )
  }
}

// Verify payment (webhook endpoint)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // In production, you would:
    // 1. Verify webhook signature using Razorpay secret
    // 2. Update payment status in database
    // 3. Activate user subscription
    // 4. Send confirmation email
    
    console.log('Payment verification webhook:', body)

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully'
    })

  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    )
  }
}