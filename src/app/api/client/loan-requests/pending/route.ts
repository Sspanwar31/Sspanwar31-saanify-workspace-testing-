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

    // Calculate member deposits for each pending loan
    const formattedLoans = await Promise.all(pendingLoans.map(async (loan) => {
      // Calculate total deposits for the member
      const totalDeposits = await db.passbookEntry.aggregate({
        where: {
          memberId: loan.memberId,
          depositAmount: { gt: 0 }
        },
        _sum: {
          depositAmount: true
        }
      });

      const memberTotalDeposits = totalDeposits._sum.depositAmount || 0;
      const eligibleAmount = memberTotalDeposits * 0.8;

      return {
        id: loan.id,
        memberId: loan.memberId,
        memberName: loan.member.name,
        memberPhone: loan.member.phone,
        memberAddress: loan.member.address,
        loanAmount: loan.loanAmount, // This is the requested amount
        requestAmount: loan.requestAmount || loan.loanAmount, // Use requestAmount if available
        interestRate: loan.interestRate,
        status: loan.status,
        createdAt: loan.createdAt,
        description: loan.description || 'No description provided',
        memberTotalDeposits,
        eligibleAmount,
        exceedsLimit: loan.loanAmount > eligibleAmount
      };
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