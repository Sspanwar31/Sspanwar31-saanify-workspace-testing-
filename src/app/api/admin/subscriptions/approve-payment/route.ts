import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { NotificationService } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.userId || !body.plan) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: userId, plan' 
        },
        { status: 400 }
      );
    }

    // Validate plan
    const validPlans = ['basic', 'standard', 'premium', 'enterprise'];
    if (!validPlans.includes(body.plan.toLowerCase())) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid plan. Must be one of: basic, standard, premium, enterprise' 
        },
        { status: 400 }
      );
    }

    // Calculate expiry date (default 1 month if not specified)
    const duration = body.duration ? parseInt(body.duration) : 1;
    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid duration. Must be a positive number' 
        },
        { status: 400 }
      );
    }
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + duration);

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

    // Update user subscription status
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'active',
        plan: plan.toLowerCase(),
        expiryDate: expiryDate,
        updatedAt: new Date()
      }
    });

    // Update society account subscription if exists
    if (user.societyAccount) {
      await db.societyAccount.update({
        where: { id: user.societyAccount.id },
        data: {
          subscriptionPlan: plan.toUpperCase(),
          subscriptionEndsAt: expiryDate,
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      });
    }

    // Update pending payment status and add admin notes
    const updateData: any = {
      status: 'approved',
      updatedAt: new Date()
    };

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

    // Send notification to user
    try {
      await NotificationService.sendPaymentApprovalNotification(
        user.email!,
        user.name || 'User',
        plan,
        expiryDate
      );
    } catch (notificationError) {
      console.error('Failed to send approval notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Payment approved successfully',
      data: {
        userId: updatedUser.id,
        plan: updatedUser.plan,
        subscriptionStatus: updatedUser.subscriptionStatus,
        expiryDate: updatedUser.expiryDate,
        activatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error approving payment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to approve payment' 
      },
      { status: 500 }
    );
  }
}