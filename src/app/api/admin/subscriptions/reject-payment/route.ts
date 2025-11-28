import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { NotificationService } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required field: userId' 
        },
        { status: 400 }
      );
    }

    // Get user details
    const user = await db.user.findUnique({
      where: { id: body.userId },
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
      where: { id: body.userId },
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

    // Update by userId if proofId not provided, otherwise update by proofId
    if (body.proofId) {
      await db.pendingPayment.update({
        where: { id: body.proofId },
        data: updateData
      });
    } else {
      await db.pendingPayment.updateMany({
        where: { 
          userId: body.userId,
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