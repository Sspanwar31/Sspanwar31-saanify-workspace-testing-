import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

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

// This endpoint runs subscription expiry scan
// It should be called by a cron job or scheduler every 12 hours
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin for manual runs
    const auth = await authenticateAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({
        authenticated: false,
        task: 'subscription_expiry_scan',
        updatedUsers: 0,
        status: 'error',
        error: auth.error
      }, { status: 200 });
    }

    if (auth.error) {
      return NextResponse.json({
        authenticated: true,
        task: 'subscription_expiry_scan',
        updatedUsers: 0,
        status: 'error',
        error: auth.error
      }, { status: 200 });
    }

    console.log('🔄 Starting subscription expiry scan...');
    
    const now = new Date();
    
    // Find all users with ACTIVE subscriptions that have expired
    const expiredUsers = await db.user.findMany({
      where: {
        subscriptionStatus: 'ACTIVE',
        expiryDate: {
          lt: now
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
        expiryDate: true,
        plan: true
      }
    });

    console.log(`📊 Found ${expiredUsers.length} users with expired subscriptions`);

    if (expiredUsers.length === 0) {
      return NextResponse.json({
        authenticated: true,
        task: 'subscription_expiry_scan',
        updatedUsers: 0,
        status: 'success',
        message: 'No expired subscriptions found'
      });
    }

    // Update all expired users
    const updatePromises = expiredUsers.map(async (user) => {
      try {
        await db.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: 'EXPIRED',
            plan: null,
            // Keep expiryDate as is for reference
            // Keep role as is (member/admin)
          }
        });
        
        console.log(`✅ Updated user ${user.email} (${user.name}) - subscription expired`);
        
        return {
          userId: user.id,
          email: user.email,
          previousPlan: user.plan,
          previousExpiry: user.expiryDate
        };
      } catch (error) {
        console.error(`❌ Failed to update user ${user.email}:`, error);
        return null;
      }
    });

    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(result => result !== null);

    console.log(`🎉 Successfully updated ${successfulUpdates.length} expired subscriptions`);

    return NextResponse.json({
      authenticated: true,
      task: 'subscription_expiry_scan',
      updatedUsers: successfulUpdates.length,
      status: 'success',
      scanTime: now.toISOString(),
      details: {
        totalExpiredFound: expiredUsers.length,
        successfulUpdates: successfulUpdates.length,
        failedUpdates: expiredUsers.length - successfulUpdates.length,
        updatedUsers: successfulUpdates
      }
    });

  } catch (error) {
    console.error('❌ Subscription expiry scan failed:', error);
    
    return NextResponse.json({
      authenticated: false,
      task: 'subscription_expiry_scan',
      updatedUsers: 0,
      status: 'error',
      message: 'Internal server error during expiry scan',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 });
  }
}

// GET endpoint for manual trigger or status check
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin
    const auth = await authenticateAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({
        authenticated: false,
        task: 'subscription_status_overview',
        status: 'error',
        error: auth.error
      }, { status: 200 });
    }

    if (auth.error) {
      return NextResponse.json({
        authenticated: true,
        task: 'subscription_status_overview',
        status: 'error',
        error: auth.error
      }, { status: 200 });
    }

    const now = new Date();
    
    // Get current subscription statistics
    const [activeCount, expiredCount, pendingCount] = await Promise.all([
      db.user.count({
        where: {
          subscriptionStatus: 'ACTIVE',
          expiryDate: {
            gt: now
          }
        }
      }),
      db.user.count({
        where: {
          subscriptionStatus: 'EXPIRED'
        }
      }),
      db.user.count({
        where: {
          subscriptionStatus: 'PENDING'
        }
      })
    ]);

    // Get users expiring in next 7 days
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringSoon = await db.user.count({
      where: {
        subscriptionStatus: 'ACTIVE',
        expiryDate: {
          gt: now,
          lt: sevenDaysFromNow
        }
      }
    });

    return NextResponse.json({
      authenticated: true,
      task: 'subscription_status_overview',
      status: 'success',
      scanTime: now.toISOString(),
      statistics: {
        activeSubscriptions: activeCount,
        expiredSubscriptions: expiredCount,
        pendingSubscriptions: pendingCount,
        expiringInNext7Days: expiringSoon
      }
    });

  } catch (error) {
    console.error('❌ Subscription status check failed:', error);
    
    return NextResponse.json({
      authenticated: false,
      task: 'subscription_status_overview',
      status: 'error',
      message: 'Internal server error during status check',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 });
  }
}