import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Find the active loan for the member
    const activeLoan = await db.loan.findFirst({
      where: {
        memberId: memberId,
        status: 'active'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!activeLoan) {
      return NextResponse.json({
        loanBalance: 0,
        remainingLoan: 0,
        activeLoan: false
      });
    }

    // Calculate total installments paid for this loan
    const totalInstallments = await db.passbookEntry.aggregate({
      where: {
        memberId: memberId,
        loanRequestId: activeLoan.id,
        loanInstallment: {
          gt: 0
        }
      },
      _sum: {
        loanInstallment: true
      }
    });

    const totalPaid = totalInstallments._sum.loanInstallment || 0;
    const remainingLoan = activeLoan.remainingBalance - totalPaid;

    return NextResponse.json({
      loanBalance: activeLoan.loanAmount,
      remainingLoan: Math.max(0, remainingLoan),
      activeLoan: {
        loanId: activeLoan.id,
        outstandingBalance: Math.max(0, remainingLoan),
        loanAmount: activeLoan.loanAmount,
        interestRate: activeLoan.interestRate
      }
    });

  } catch (error) {
    console.error('Error in member loan status API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member loan status' },
      { status: 500 }
    );
  }
}