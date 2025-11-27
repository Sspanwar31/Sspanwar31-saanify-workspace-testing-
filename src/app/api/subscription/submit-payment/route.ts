import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { NotificationService } from '@/lib/notifications'

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

    // Check if transaction ID already exists in pending payments
    const existingPendingPayment = await db.pendingPayment.findFirst({
      where: { 
        txnId: validatedData.transactionId,
        status: { not: 'REJECTED' }
      }
    })

    if (existingPendingPayment) {
      return NextResponse.json(
        { error: 'Transaction ID already exists or was previously rejected' },
        { status: 400 }
      )
    }

    // Set expiry date (24 hours from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // Create pending payment record
    const pendingPayment = await db.pendingPayment.create({
      data: {
        userEmail: userDetails.email || user.email,
        plan: validatedData.plan.toUpperCase(),
        amount: validatedData.amount,
        txnId: validatedData.transactionId,
        proof_url: validatedData.screenshot,
        status: 'PENDING',
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Update user's subscription status to PENDING
    await db.user.update({
      where: { id: user.userId },
      data: {
        subscriptionStatus: 'PENDING',
        plan: validatedData.plan.toUpperCase(),
        updatedAt: new Date()
      }
    })

    // Also create payment proof record for backward compatibility
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

    // Notify admins about new payment
    await NotificationService.notifyPaymentUploaded(
      userDetails.email || user.email,
      userDetails.name || 'User',
      validatedData.plan.toUpperCase(),
      validatedData.amount
    )

    return NextResponse.json({
      success: true,
      message: 'Payment submitted successfully. Your payment is now under review.',
      paymentId: pendingPayment.id,
      paymentData: {
        id: pendingPayment.id,
        amount: pendingPayment.amount,
        plan: pendingPayment.plan,
        transactionId: pendingPayment.txnId,
        status: pendingPayment.status,
        expiresAt: pendingPayment.expiresAt,
        createdAt: pendingPayment.createdAt
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