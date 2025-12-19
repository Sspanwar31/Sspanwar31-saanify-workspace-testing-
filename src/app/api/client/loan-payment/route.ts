import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/lib/services/transaction.service';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loanId, memberId, paymentAmount, paymentMode } = body;

    if (!loanId || !memberId || !paymentAmount || !paymentMode) {
      return NextResponse.json(
        { error: 'All fields are required: loanId, memberId, paymentAmount, paymentMode' },
        { status: 400 }
      );
    }

    // Get loan details to validate
    const loan = await db.loan.findUnique({
      where: { id: loanId },
      include: { member: true }
    });

    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }

    if (loan.status !== 'active') {
      return NextResponse.json(
        { error: 'Loan is not active' },
        { status: 400 }
      );
    }

    if (loan.remainingBalance <= 0) {
      return NextResponse.json(
        { error: 'Loan has already been paid off' },
        { status: 400 }
      );
    }

    // FIXED: Use TransactionService to handle payment with proper business logic
    // This prevents double deduction and ensures consistency
    const result = await TransactionService.createEntry({
      memberId,
      type: 'INSTALLMENT',
      amount: paymentAmount,
      description: `Loan EMI payment - Loan ID: ${loanId}`,
      mode: paymentMode,
      loanRequestId: loanId,
      transactionDate: new Date()
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 400 }
      );
    }

    // Get updated loan status
    const updatedLoan = await db.loan.findUnique({
      where: { id: loanId }
    });

    // Create notification for member
    const loanStatus = updatedLoan?.status === 'CLOSED' ? 'completed' : 'active';
    await db.passbookEntry.create({
      data: {
        memberId: memberId,
        loanRequestId: loanId,
        depositAmount: 0,
        loanInstallment: 0,
        interestAuto: 0,
        fineAuto: 0,
        mode: 'Notification',
        description: loanStatus === 'completed' 
          ? 'Congratulations! Your loan has been fully paid off.'
          : `EMI payment of ₹${paymentAmount.toFixed(2)} received successfully.`,
        transactionDate: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Loan payment processed successfully',
      paymentDetails: {
        paymentAmount,
        remainingBalance: updatedLoan?.remainingBalance || 0,
        loanStatus: loanStatus,
        // Return the actual transaction entry created
        transactionEntry: result.data.passbookEntry
      }
    });

  } catch (error) {
    console.error('Error processing loan payment:', error);
    return NextResponse.json(
      { error: 'Failed to process loan payment' },
      { status: 500 }
    );
  }
}