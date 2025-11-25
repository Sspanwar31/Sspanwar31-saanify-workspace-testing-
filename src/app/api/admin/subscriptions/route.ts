import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get society accounts with their subscription information
    const societyAccounts = await db.societyAccount.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get user count for each society account
    const userCounts = await db.user.groupBy({
      by: ['societyAccountId'],
      where: {
        societyAccountId: {
          not: null
        }
      },
      _count: {
        id: true
      }
    });

    // Create a map of societyAccountId to user count
    const userCountMap = userCounts.reduce((acc, item) => {
      if (item.societyAccountId) {
        acc[item.societyAccountId] = item._count.id;
      }
      return acc;
    }, {} as Record<string, number>);

    // Transform the data to include subscription status
    const subscriptions = societyAccounts.map(account => {
      const now = new Date();
      const trialEndsAt = account.trialEndsAt ? new Date(account.trialEndsAt) : null;
      const subscriptionEndsAt = account.subscriptionEndsAt ? new Date(account.subscriptionEndsAt) : null;
      
      let subscriptionStatus = 'inactive';
      if (account.isActive) {
        if (trialEndsAt && trialEndsAt > now) {
          subscriptionStatus = 'trial';
        } else if (subscriptionEndsAt && subscriptionEndsAt > now) {
          subscriptionStatus = 'active';
        } else if (!subscriptionEndsAt && account.subscriptionPlan === 'basic') {
          subscriptionStatus = 'active'; // Basic plan is free
        }
      }

      return {
        id: account.id,
        societyName: account.name,
        email: account.email,
        plan: account.subscriptionPlan || 'basic',
        status: subscriptionStatus,
        trialEndsAt: account.trialEndsAt,
        subscriptionEndsAt: account.subscriptionEndsAt,
        isActive: account.isActive,
        memberCount: userCountMap[account.id] || 0,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      };
    });

    return NextResponse.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch subscriptions' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.societyAccountId || !body.plan) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: societyAccountId, plan' 
        },
        { status: 400 }
      );
    }

    // Update the society account's subscription
    const updatedAccount = await db.societyAccount.update({
      where: {
        id: body.societyAccountId
      },
      data: {
        subscriptionPlan: body.plan,
        subscriptionEndsAt: body.subscriptionEndsAt ? new Date(body.subscriptionEndsAt) : null,
        isActive: body.isActive !== undefined ? body.isActive : true,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedAccount.id,
        societyName: updatedAccount.name,
        plan: updatedAccount.subscriptionPlan,
        subscriptionEndsAt: updatedAccount.subscriptionEndsAt,
        isActive: updatedAccount.isActive,
        updatedAt: updatedAccount.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update subscription' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required field: id' 
        },
        { status: 400 }
      );
    }

    // Update the subscription
    const updatedAccount = await db.societyAccount.update({
      where: {
        id: body.id
      },
      data: {
        subscriptionPlan: body.plan,
        subscriptionEndsAt: body.subscriptionEndsAt ? new Date(body.subscriptionEndsAt) : null,
        trialEndsAt: body.trialEndsAt ? new Date(body.trialEndsAt) : null,
        isActive: body.isActive !== undefined ? body.isActive : true,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedAccount.id,
        societyName: updatedAccount.name,
        plan: updatedAccount.subscriptionPlan,
        subscriptionEndsAt: updatedAccount.subscriptionEndsAt,
        trialEndsAt: updatedAccount.trialEndsAt,
        isActive: updatedAccount.isActive,
        updatedAt: updatedAccount.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update subscription' 
      },
      { status: 500 }
    );
  }
}