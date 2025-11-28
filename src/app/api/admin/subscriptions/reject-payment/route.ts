import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { NotificationService } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle both paymentId and userId approaches
    let userId = body.userId
    
    // If paymentId is provided, get the payment details first
    if (body.paymentId) {
      const payment = await db.pendingPayment.findUnique({
        where: { id: body.paymentId },
        include: { user: true }
      })
      
      if (!payment) {
        return NextResponse.json(
          { success: false, error: 'Payment not found' },
          { status: 404 }
        )
      }
      
      userId = payment.userId
    }
    
    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required field: userId or paymentId' 
        },
        { status: 400 }
      );
    }

    // Get user details
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        societyAccount: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not found' 
        },
        { status: 404 }
      );
    }

    // Update user subscription status to rejected/pending
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'rejected',
        plan: null,
        expiryDate: null,
        updatedAt: new Date()
      }
    });

    // Mark pending payment as rejected with admin remarks
    const updateData: any = {
      status: 'rejected',
      updatedAt: new Date()
    };

    if (body.reason) {
      updateData.rejectionReason = body.reason;
    }

    if (body.adminNotes) {
      updateData.adminNotes = body.adminNotes;
    }

    // Update by paymentId if provided, otherwise by userId
    if (body.paymentId) {
      await db.pendingPayment.update({
        where: { id: body.paymentId },
        data: updateData
      });
    } else if (body.proofId) {
      await db.pendingPayment.update({
        where: { id: body.proofId },
        data: updateData
      });
    } else {
      await db.pendingPayment.updateMany({
        where: { 
          userId: userId,
          status: 'pending'
        },
        data: updateData
      });
    }

    // Send rejection notification to user
    try {
      await NotificationService.sendPaymentRejectionNotification(
        user.email!,
        user.name || 'User',
        body.reason || 'Payment proof could not be verified. Please contact support for more information.'
      );
    } catch (notificationError) {
      console.error('Failed to send rejection notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Payment rejected successfully',
      data: {
        userId: updatedUser.id,
        subscriptionStatus: updatedUser.subscriptionStatus,
        plan: updatedUser.plan,
        expiryDate: updatedUser.expiryDate,
        rejectedAt: new Date(),
        reason: body.reason || null
      }
    });

  } catch (error) {
    console.error('Error rejecting payment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reject payment' 
      },
      { status: 500 }
    );
  }
}