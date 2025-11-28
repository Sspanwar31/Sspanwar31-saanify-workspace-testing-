import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { encodeImageUrl } from '@/lib/screenshot-utils'

export async function GET() {
  try {
    const pendingPayments = await db.pendingPayment.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            societyAccount: {
              select: {
                name: true
              }
            }
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
      screenshotUrl: encodeImageUrl(payment.screenshotUrl),
      status: payment.status,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
      adminNotes: payment.adminNotes,
      rejectionReason: payment.rejectionReason,
      user: {
        id: payment.user.id,
        name: payment.user.name || 'Unknown User',
        email: payment.user.email || 'unknown@example.com',
        societyName: payment.user.societyAccount?.name || 'N/A'
      }
    }))

    // Calculate stats
    const stats = {
      total: paymentProofs.length,
      pending: paymentProofs.filter(p => p.status === 'pending').length,
      approved: paymentProofs.filter(p => p.status === 'approved').length,
      rejected: paymentProofs.filter(p => p.status === 'rejected').length,
      totalAmount: paymentProofs.reduce((sum, p) => sum + (p.amount || 0), 0)
    }

    return NextResponse.json({
      success: true,
      paymentProofs,
      stats
    })

  } catch (error) {
    console.error('Error fetching payment proofs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}