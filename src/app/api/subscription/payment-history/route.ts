import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const token = request.cookies.get('auth-token')?.value || 
                 request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ 
        error: 'No token provided',
        authenticated: false 
      }, { status: 200 });
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid token',
        authenticated: false 
      }, { status: 200 });
    }

    // Get user's payment history from both tables
    const [pendingPayments, paymentProofs] = await Promise.all([
      db.pendingPayment.findMany({
        where: {
          userId: decoded.userId
        },
        select: {
          id: true,
          plan: true,
          amount: true,
          txnId: true,
          status: true,
          screenshotUrl: true,
          adminNotes: true,
          rejectionReason: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      db.paymentProof.findMany({
        where: {
          userId: decoded.userId
        },
        select: {
          id: true,
          plan: true,
          amount: true,
          txnId: true,
          status: true,
          screenshotUrl: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ]);

    // Combine and format payment history
    const allPayments = [
      ...pendingPayments.map(payment => ({
        ...payment,
        source: 'pending_payments',
        status: payment.status.toLowerCase()
      })),
      ...paymentProofs.map(payment => ({
        ...payment,
        source: 'payment_proofs',
        status: payment.status.toLowerCase(),
        adminNotes: null,
        rejectionReason: null
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      authenticated: true,
      payments: allPayments.map(payment => ({
        id: payment.id,
        plan: payment.plan,
        amount: payment.amount,
        transactionId: payment.txnId,
        status: payment.status,
        screenshotUrl: payment.screenshotUrl,
        adminNotes: payment.adminNotes,
        rejectionReason: payment.rejectionReason,
        source: payment.source,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString()
      })),
      summary: {
        total: allPayments.length,
        pending: allPayments.filter(p => p.status === 'pending').length,
        approved: allPayments.filter(p => p.status === 'approved').length,
        rejected: allPayments.filter(p => p.status === 'rejected').length
      }
    });

  } catch (error: any) {
    console.error('Payment history fetch error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      authenticated: false
    }, { status: 200 });
  }
}