import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true }
    })
    
    return user
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    
    const plan = formData.get('plan') as string
    const amount = parseFloat(formData.get('amount') as string)
    const transactionId = formData.get('transactionId') as string
    const screenshot = formData.get('screenshot') as File

    // Log received data for debugging
    console.log('Payment submission received:', {
      user: user.id,
      plan,
      amount,
      transactionId,
      hasScreenshot: !!screenshot
    })

    // Validate required fields
    if (!plan || !amount || !transactionId || !screenshot) {
      console.log('Validation failed:', { plan, amount, transactionId, hasScreenshot: !!screenshot })
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if transaction ID already exists
    const existingTransaction = await db.pendingPayment.findUnique({
      where: { txnId: transactionId }
    })

    if (existingTransaction) {
      console.log('Duplicate transaction ID found:', transactionId)
      return NextResponse.json(
        { error: 'Transaction ID already exists. Please use a unique transaction ID.' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'payment-proofs')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename with sanitized name
    const timestamp = Date.now()
    
    // Sanitize filename: remove spaces, special characters, and make it URL-safe
    const originalName = screenshot.name
    const fileExtension = originalName.split('.').pop()
    const nameWithoutExtension = originalName.substring(0, originalName.lastIndexOf('.'))
    
    // Replace spaces and special characters with underscores
    const sanitizedName = nameWithoutExtension
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    
    const filename = `${timestamp}_${sanitizedName}.${fileExtension}`
    const filepath = path.join(uploadsDir, filename)

    // Save screenshot
    const bytes = await screenshot.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Create pending payment record
    const pendingPayment = await db.pendingPayment.create({
      data: {
        userId: user.id,
        amount,
        plan,
        txnId: transactionId,
        screenshotUrl: `/uploads/payment-proofs/${filename}`,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Update user subscription status to PENDING
    await db.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'PENDING',
        updatedAt: new Date()
      }
    })

    // Send notification to admins about new payment submission
    try {
      const notificationResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/payment-submitted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          plan,
          amount,
          transactionId
        })
      })
      
      if (!notificationResponse.ok) {
        console.error('Failed to send admin notification:', await notificationResponse.text())
      }
    } catch (notificationError) {
      console.error('Error sending admin notification:', notificationError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Payment proof submitted successfully. Awaiting admin approval.',
      pendingPayment
    })

  } catch (error) {
    console.error('Payment submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}