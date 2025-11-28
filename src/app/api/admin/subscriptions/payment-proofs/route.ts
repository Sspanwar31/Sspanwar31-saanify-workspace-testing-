import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const pendingPayments = await db.pendingPayment.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            societyName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the UI expectations
    const paymentProofs = pendingPayments.map(payment => ({
      id: payment.id,
      userId: payment.userId,
      amount: payment.amount || 0,
      plan: payment.plan || 'UNKNOWN',
      txnId: payment.transactionId || payment.id,
      screenshotUrl: payment.screenshotUrl,
      status: payment.status,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
      adminNotes: payment.adminNotes,
      rejectionReason: payment.rejectionReason,
      user: {
        id: payment.user.id,
        name: payment.user.name || 'Unknown User',
        email: payment.user.email || 'unknown@example.com',
        societyName: payment.user.societyName || 'N/A'
      }
    }))

    return NextResponse.json({
      success: true,
      paymentProofs
    })

  } catch (error) {
    console.error('Error fetching payment proofs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}