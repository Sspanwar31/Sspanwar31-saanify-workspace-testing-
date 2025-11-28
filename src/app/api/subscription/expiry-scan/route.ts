import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// This endpoint runs the subscription expiry scan
// It should be called by a cron job or scheduler every 12 hours
export async function POST(request: NextRequest) {
  try {
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
      task: 'subscription_expiry_scan',
      updatedUsers: 0,
      status: 'error',
      message: 'Internal server error during expiry scan',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint for manual trigger or status check
export async function GET(request: NextRequest) {
  try {
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
          subscriptionStatus: 'PENDING_ADMIN_REVIEW'
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
      task: 'subscription_status_overview',
      status: 'error',
      message: 'Internal server error during status check',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}