import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get all pending loans with member information
    const pendingLoans = await db.loan.findMany({
      where: {
        status: 'pending'
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedLoans = pendingLoans.map(loan => ({
      id: loan.id,
      memberId: loan.memberId,
      memberName: loan.member.name,
      memberPhone: loan.member.phone,
      memberAddress: loan.member.address,
      loanAmount: loan.loanAmount,
      interestRate: loan.interestRate,
      status: loan.status,
      createdAt: loan.createdAt,
      description: loan.description || 'No description provided'
    }));

    return NextResponse.json({
      success: true,
      pendingLoans: formattedLoans,
      count: formattedLoans.length
    });

  } catch (error) {
    console.error('Error fetching pending loan requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending loan requests' },
      { status: 500 }
    );
  }
}