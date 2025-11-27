import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

// Validation schema
const paymentSubmissionSchema = z.object({
  plan: z.enum(['basic', 'pro', 'enterprise']),
  amount: z.number().positive(),
  transactionId: z.string().min(1, 'Transaction ID is required'),
  paymentMethod: z.string().default('UPI'),
  notes: z.string().optional(),
  screenshot: z.string().optional()
})

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return null
  }

  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string }
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to submit payment' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = paymentSubmissionSchema.parse(body)

    // Check if transaction ID already exists
    const existingPayment = await db.paymentProof.findFirst({
      where: { 
        txnId: validatedData.transactionId,
        status: { not: 'rejected' }
      }
    })

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Transaction ID already exists or was previously rejected' },
        { status: 400 }
      )
    }

    // Get user details
    const userDetails = await db.user.findUnique({
      where: { id: user.userId },
      include: { societyAccount: true }
    })

    if (!userDetails) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create payment proof record
    const paymentProof = await db.paymentProof.create({
      data: {
        userId: user.userId,
        amount: validatedData.amount,
        plan: validatedData.plan.toUpperCase(),
        txnId: validatedData.transactionId,
        screenshotUrl: validatedData.screenshot,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Update society account status
    if (userDetails.societyAccount) {
      await db.societyAccount.update({
        where: { id: userDetails.societyAccount.id },
        data: {
          subscriptionPlan: validatedData.plan.toUpperCase(),
          status: 'PENDING_PAYMENT',
          updatedAt: new Date()
        }
      })
    }

    // Create notification for user
    await db.notification.create({
      data: {
        userId: user.userId,
        title: 'Payment Submitted',
        message: `Your payment of ₹${validatedData.amount} for ${validatedData.plan.toUpperCase()} plan has been submitted for review.`,
        type: 'info',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Create notification for admin
    const adminUsers = await db.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } }
    })

    for (const admin of adminUsers) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: 'New Payment Approval Required',
          message: `${userDetails.name} has submitted payment of ₹${validatedData.amount} for ${validatedData.plan.toUpperCase()} plan.`,
          type: 'payment',
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment submitted successfully. Your payment is now under review.',
      paymentProof: {
        id: paymentProof.id,
        amount: paymentProof.amount,
        plan: paymentProof.plan,
        transactionId: paymentProof.txnId,
        status: paymentProof.status,
        createdAt: paymentProof.createdAt
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('Payment submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}