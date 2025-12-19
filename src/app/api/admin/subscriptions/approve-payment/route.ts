import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { NotificationService } from '@/lib/notifications';
import { subscriptionPlanStorage } from '@/lib/subscription-storage';

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

    const body = await request.json();
    
    // Validate required fields
    if (!body.userId || !body.plan) {
      return NextResponse.json({
        authenticated: true,
        success: false,
        error: 'Missing required fields: userId, plan'
      }, { status: 200 });
    }

    // Get available plans from subscription storage
    let validPlans = ['basic', 'standard', 'premium', 'enterprise'];
    
    try {
      // Get plans from in-memory storage (including inactive ones for validation)
      const storagePlans = subscriptionPlanStorage.getAllPlansIncludingInactive();
      if (storagePlans && storagePlans.length > 0) {
        // Extract plan names and create valid plans array
        validPlans = storagePlans.map(plan => {
          // Convert plan name to lowercase and remove spaces for validation
          return plan.name.toLowerCase().replace(/\s+/g, '');
        });
        
        // Also keep to original mapping for backwards compatibility
        validPlans.push('basic', 'standard', 'premium', 'enterprise');
      }
    } catch (error) {
      console.log('Could not fetch subscription plans from storage, using default plans');
    }

    // Normalize and validate plan
    let normalizedPlan = body.plan.toLowerCase().trim();
    
    // Enhanced plan mapping that includes custom plans
    const planMapping: { [key: string]: string } = {
      'basic plan': 'basic',
      'standard plan': 'standard', 
      'premium plan': 'premium',
      'pro_monthly': 'premium',
      'pro monthly': 'premium',
      'enterprise annual': 'enterprise',
      'enterprise plan': 'enterprise',
      'enterprise': 'enterprise'
    };
    
    // Apply mapping if found
    if (planMapping[normalizedPlan]) {
      normalizedPlan = planMapping[normalizedPlan];
    }
    
    // For custom plans, also check if plan exists in our valid plans (without spaces)
    const planWithoutSpaces = normalizedPlan.replace(/\s+/g, '');
    const isValidCustomPlan = validPlans.some(plan => plan === planWithoutSpaces || plan === normalizedPlan);
    
    // Special case: If plan exists in any payment record, allow it even if not in current plans
    // This handles cases where plans were deactivated but payments still exist
    let isLegacyPlan = false;
    if (!validPlans.includes(normalizedPlan) && !isValidCustomPlan) {
      try {
        // Check if this plan exists in any payment record
        const existingPayment = await db.pendingPayment.findFirst({
          where: {
            plan: {
              contains: body.plan,
              mode: 'insensitive'
            }
          }
        });
        
        if (existingPayment) {
          isLegacyPlan = true;
          console.log(`Allowing legacy plan "${body.plan}" found in existing payment records`);
        }
      } catch (error) {
        console.log('Could not check for legacy plan in payments');
      }
    }
    
    if (!validPlans.includes(normalizedPlan) && !isValidCustomPlan && !isLegacyPlan) {
      return NextResponse.json({
        authenticated: true,
        success: false,
        error: `Invalid plan "${body.plan}". Available plans: ${validPlans.join(', ')}`
      }, { status: 200 });
    }

    // Calculate expiry date (default 1 month if not specified)
    const duration = body.duration ? parseInt(body.duration) : 1;
    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json({
        authenticated: true,
        success: false,
        error: 'Invalid duration. Must be a positive number'
      }, { status: 200 });
    }
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + duration);

    // Get user details
    const user = await db.user.findUnique({
      where: { id: body.userId },
      include: {
        societyAccount: true
      }
    });

    if (!user) {
      return NextResponse.json({
        authenticated: true,
        success: false,
        error: 'User not found'
      }, { status: 200 });
    }

    // Update user subscription status
    const updatedUser = await db.user.update({
      where: { id: body.userId },
      data: {
        subscriptionStatus: 'ACTIVE',
        plan: normalizedPlan,
        expiryDate: expiryDate,
        updatedAt: new Date()
      }
    });

    // Update society account subscription if exists
    if (user.societyAccount) {
      await db.societyAccount.update({
        where: { id: user.societyAccount.id },
        data: {
          subscriptionPlan: normalizedPlan.toUpperCase(),
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
          userId: body.userId,
          status: 'pending'
        },
        data: updateData
      });
    }

    // Create payment proof record for approved payments
    if (body.paymentId) {
      const pendingPayment = await db.pendingPayment.findUnique({
        where: { id: body.paymentId }
      });

      if (pendingPayment) {
        await db.paymentProof.create({
          data: {
            userId: pendingPayment.userId,
            amount: pendingPayment.amount,
            plan: pendingPayment.plan,
            txnId: pendingPayment.transactionId, // Fixed field name
            screenshotUrl: pendingPayment.screenshotUrl,
            status: 'approved',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    }

    // Send notification to user
    try {
      await NotificationService.sendPaymentApprovalNotification(
        user.email!,
        user.name || 'User',
        normalizedPlan,
        expiryDate
      );
    } catch (notificationError) {
      console.error('Failed to send approval notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      authenticated: true,
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
    return NextResponse.json({
      authenticated: true,
      success: false,
      error: 'Failed to approve payment'
    }, { status: 200 });
  }
}