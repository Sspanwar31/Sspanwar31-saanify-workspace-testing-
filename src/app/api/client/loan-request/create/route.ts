import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId, amount } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Check if member exists
    const member = await db.member.findUnique({
      where: { id: memberId }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check if there's already an active loan
    const existingActiveLoan = await db.loan.findFirst({
      where: {
        memberId: memberId,
        status: 'active'
      }
    });

    if (existingActiveLoan) {
      return NextResponse.json(
        { error: 'Member already has an active loan' },
        { status: 400 }
      );
    }

    // Create a loan request (could be a separate table or just create the loan directly)
    // For now, we'll create the loan directly with "pending" status
    const loanAmount = amount || 0; // If no amount specified, set to 0 (admin to decide)
    
    const newLoan = await db.loan.create({
      data: {
        memberId: memberId,
        loanAmount: loanAmount,
        interestRate: 1.0,
        status: 'pending', // Admin needs to approve
        remainingBalance: loanAmount,
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }
    });

    // Create a passbook entry to track the loan request
    if (loanAmount > 0) {
      await db.passbookEntry.create({
        data: {
          memberId: memberId,
          loanRequestId: newLoan.id,
          loanInstallment: 0,
          interestAuto: 0,
          fineAuto: 0,
          mode: 'Loan',
          description: `Loan request of ₹${loanAmount.toFixed(2)} - pending approval`,
          transactionDate: new Date(),
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Loan request submitted successfully',
      loanId: newLoan.id,
      status: 'pending'
    });

  } catch (error) {
    console.error('Error in loan request API:', error);
    return NextResponse.json(
      { error: 'Failed to create loan request' },
      { status: 500 }
    );
  }
}