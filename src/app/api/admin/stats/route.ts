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
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get dashboard stats
    const [
      totalUsers,
      activeSubscriptions,
      pendingPayments,
      approvedPayments
    ] = await Promise.all([
      // Total users count
      db.user.count(),
      
      // Active subscriptions count
      db.user.count({
        where: {
          subscriptionStatus: 'ACTIVE'
        }
      }),
      
      // Pending payments count
      db.pendingPayment.count({
        where: {
          status: 'PENDING'
        }
      }),
      
      // Approved payments for revenue calculation
      db.pendingPayment.findMany({
        where: {
          status: 'APPROVED'
        },
        select: {
          amount: true
        }
      })
    ]);

    // Calculate total revenue
    const totalRevenue = approvedPayments.reduce((sum, payment) => sum + payment.amount, 0);

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      pendingPayments,
      totalRevenue
    });

  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}