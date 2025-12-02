import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loanId } = body;

    if (!loanId) {
      return NextResponse.json(
        { error: 'Loan ID is required' },
        { status: 400 }
      );
    }

    // Get the loan request
    const loan = await db.loan.findUnique({
      where: { id: loanId },
      include: { member: true }
    });

    if (!loan) {
      return NextResponse.json(
        { error: 'Loan request not found' },
        { status: 404 }
      );
    }

    if (loan.status !== 'pending') {
      return NextResponse.json(
        { error: 'Loan request is not in pending status' },
        { status: 400 }
      );
    }

    // Update loan status to rejected
    const updatedLoan = await db.loan.update({
      where: { id: loanId },
      data: {
        status: 'rejected',
        updatedAt: new Date()
      }
    });

    // Create notification for member
    await db.passbookEntry.create({
      data: {
        memberId: loan.memberId,
        loanRequestId: loanId,
        depositAmount: 0,
        loanInstallment: 0,
        interestAuto: 0,
        fineAuto: 0,
        mode: 'Notification',
        description: 'Your loan request has been rejected.',
        transactionDate: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Loan request rejected successfully',
      loan: updatedLoan
    });

  } catch (error) {
    console.error('Error rejecting loan:', error);
    return NextResponse.json(
      { error: 'Failed to reject loan' },
      { status: 500 }
    );
  }
}