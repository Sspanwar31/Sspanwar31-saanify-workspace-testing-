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
        authenticated: false,
        error: 'No token provided' 
      }, { status: 200 });
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ 
        authenticated: false,
        error: 'Invalid token' 
      }, { status: 200 });
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ 
        authenticated: true,
        error: 'Access denied - Admin privileges required' 
      }, { status: 200 });
    }

    const now = new Date();

    // Get comprehensive statistics
    const [
      totalUsers,
      activeSubscriptions,
      expiredSubscriptions,
      trialUsers,
      pendingPayments,
      approvedPayments,
      rejectedPayments,
      recentPayments,
      expiringSoon
    ] = await Promise.all([
      // Total users count
      db.user.count({
        where: {
          role: 'CLIENT'
        }
      }),
      
      // Active subscriptions
      db.user.count({
        where: {
          subscriptionStatus: 'ACTIVE',
          expiryDate: {
            gt: now
          }
        }
      }),
      
      // Expired subscriptions
      db.user.count({
        where: {
          subscriptionStatus: 'EXPIRED'
        }
      }),
      
      // Trial users
      db.user.count({
        where: {
          subscriptionStatus: 'TRIAL',
          trialEndsAt: {
            gt: now
          }
        }
      }),
      
      // Pending payments count
      db.pendingPayment.count({
        where: {
          status: 'pending'
        }
      }),
      
      // Approved payments count
      db.pendingPayment.count({
        where: {
          status: 'approved'
        }
      }),
      
      // Rejected payments count
      db.pendingPayment.count({
        where: {
          status: 'rejected'
        }
      }),
      
      // Recent payments (last 7 days)
      db.pendingPayment.findMany({
        where: {
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }),
      
      // Users expiring in next 7 days
      db.user.findMany({
        where: {
          subscriptionStatus: 'ACTIVE',
          expiryDate: {
            gt: now,
            lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          expiryDate: true
        },
        orderBy: {
          expiryDate: 'asc'
        },
        take: 10
      })
    ]);

    // Calculate revenue statistics
    const [totalRevenue, monthlyRevenue] = await Promise.all([
      // Total revenue from approved payments
      db.pendingPayment.aggregate({
        where: {
          status: 'approved'
        },
        _sum: {
          amount: true
        }
      }),
      
      // Current month revenue
      db.pendingPayment.aggregate({
        where: {
          status: 'approved',
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1)
          }
        },
        _sum: {
          amount: true
        }
      })
    ]);

    // Get subscription plan distribution
    const planDistribution = await db.user.groupBy({
      by: ['plan'],
      where: {
        subscriptionStatus: 'ACTIVE',
        plan: {
          not: null
        }
      },
      _count: {
        plan: true
      }
    });

    // Get payment mode setting
    const paymentModeSetting = await db.systemSetting.findUnique({
      where: {
        key: 'PAYMENT_MODE'
      }
    });

    return NextResponse.json({
      authenticated: true,
      success: true,
      dashboard: {
        overview: {
          totalUsers,
          activeSubscriptions,
          expiredSubscriptions,
          trialUsers,
          pendingPayments,
          approvedPayments,
          rejectedPayments
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          monthly: monthlyRevenue._sum.amount || 0
        },
        planDistribution: planDistribution.map(item => ({
          plan: item.plan,
          count: item._count.plan
        })),
        recentActivity: {
          recentPayments: recentPayments.map(payment => ({
            id: payment.id,
            user: payment.user,
            plan: payment.plan,
            amount: payment.amount,
            status: payment.status,
            createdAt: payment.createdAt
          })),
          expiringSoon: expiringSoon.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            plan: user.plan,
            expiryDate: user.expiryDate,
            daysUntilExpiry: Math.ceil((new Date(user.expiryDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          }))
        },
        settings: {
          paymentMode: paymentModeSetting?.value || 'MANUAL'
        }
      },
      lastUpdated: now.toISOString()
    });

  } catch (error: any) {
    console.error('Admin dashboard fetch error:', error);
    return NextResponse.json({
      authenticated: false,
      error: 'Internal server error'
    }, { status: 200 });
  }
}