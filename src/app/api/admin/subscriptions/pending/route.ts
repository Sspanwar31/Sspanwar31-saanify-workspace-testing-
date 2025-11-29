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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status')?.toLowerCase();
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const whereClause: any = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      whereClause.status = status;
    }

    // Get pending payments with user details and pagination
    const [payments, totalCount] = await Promise.all([
      db.pendingPayment.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              subscriptionStatus: true,
              plan: true,
              expiryDate: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.pendingPayment.count({ where: whereClause })
    ]);

    // Also get payment proofs for complete picture
    const paymentProofs = await db.paymentProof.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            subscriptionStatus: true,
            plan: true,
            expiryDate: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    // Combine and format all payments
    const allPayments = [
      ...payments.map(payment => ({
        ...payment,
        source: 'pending_payments',
        screenshotUrl: payment.screenshotUrl,
        adminNotes: payment.adminNotes,
        rejectionReason: payment.rejectionReason
      })),
      ...paymentProofs.map(proof => ({
        ...proof,
        source: 'payment_proofs',
        adminNotes: null,
        rejectionReason: null
      }))
    ].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // Calculate statistics
    const stats = {
      total: totalCount + paymentProofs.length,
      pending: allPayments.filter(p => p.status === 'pending').length,
      approved: allPayments.filter(p => p.status === 'approved').length,
      rejected: allPayments.filter(p => p.status === 'rejected').length,
      totalAmount: allPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    };

    return NextResponse.json({
      authenticated: true,
      success: true,
      payments: allPayments.slice((page - 1) * limit, page * limit),
      pagination: {
        page,
        limit,
        total: allPayments.length,
        totalPages: Math.ceil(allPayments.length / limit)
      },
      stats,
      filters: {
        status,
        sortBy,
        sortOrder
      }
    });

  } catch (error: any) {
    console.error('Pending payments fetch error:', error);
    return NextResponse.json({
      authenticated: false,
      error: 'Internal server error'
    }, { status: 200 });
  }
}