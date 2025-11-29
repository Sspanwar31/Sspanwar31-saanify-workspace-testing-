import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { NotificationService } from '@/lib/notifications';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
               request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return { authenticated: false, error: 'No token provided' };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return { authenticated: true, error: 'Access denied - Admin privileges required' };
    }

    return { authenticated: true, userId: decoded.userId };
  } catch (error) {
    return { authenticated: false, error: 'Invalid token' };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin
    const auth = await authenticateAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({
        authenticated: false,
        success: false,
        error: auth.error
      }, { status: 200 });
    }

    if (auth.error) {
      return NextResponse.json({
        authenticated: true,
        success: false,
        error: auth.error
      }, { status: 200 });
    }

    const { paymentId, adminNotes, rejectionReason } = await request.json();
    
    if (!paymentId) {
      return NextResponse.json({
        authenticated: true,
        success: false,
        error: 'Payment ID is required'
      }, { status: 200 });
    }

    // Find the payment record
    const payment = await db.pendingPayment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json({
        authenticated: true,
        success: false,
        error: 'Payment not found'
      }, { status: 200 });
    }

    // Update payment status to rejected
    const updatedPayment = await db.pendingPayment.update({
      where: { id: paymentId },
      data: {
        status: 'rejected',
        rejectionReason: rejectionReason || adminNotes || 'Payment proof rejected by admin',
        adminNotes: adminNotes,
        updatedAt: new Date()
      }
    });

    // Create a payment proof record for the rejected payment
    await db.paymentProof.create({
      data: {
        userId: payment.userId,
        amount: payment.amount,
        plan: payment.plan,
        txnId: payment.transactionId, // Fixed field name
        screenshotUrl: payment.screenshotUrl,
        status: 'rejected',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Update user subscription status back to trial or expired
    await db.user.update({
      where: { id: payment.userId },
      data: {
        subscriptionStatus: 'TRIAL',
        plan: null,
        expiryDate: null,
        updatedAt: new Date()
      }
    });

    // Send rejection notification to user
    try {
      await NotificationService.sendPaymentRejectionNotification(
        payment.user.email!,
        payment.user.name || 'User',
        rejectionReason || adminNotes || 'Payment proof rejected by admin'
      );
    } catch (notificationError) {
      console.error('Failed to send rejection notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      authenticated: true,
      success: true,
      message: 'Payment rejected successfully',
      payment: updatedPayment
    });

  } catch (error) {
    console.error('Error rejecting payment:', error);
    return NextResponse.json({
      authenticated: true,
      success: false,
      error: 'Failed to reject payment'
    }, { status: 200 });
  }
}