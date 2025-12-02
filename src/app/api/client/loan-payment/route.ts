import { NextRequest, NextResponse } from 'next/server';
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

    // Get the loan details
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

    // Calculate interest for this payment (simplified - you can implement proper interest calculation)
    const interestAmount = paymentAmount * 0.01; // 1% interest as example
    const principalAmount = paymentAmount - interestAmount;

    // Create passbook entry for loan payment
    await db.passbookEntry.create({
      data: {
        memberId: memberId,
        loanRequestId: loanId,
        depositAmount: 0,
        loanInstallment: principalAmount,
        interestAuto: interestAmount,
        fineAuto: 0,
        mode: paymentMode,
        description: `Loan EMI payment - Principal: ₹${principalAmount.toFixed(2)}, Interest: ₹${interestAmount.toFixed(2)}`,
        transactionDate: new Date()
      }
    });

    // Update loan remaining balance
    const newRemainingBalance = Math.max(0, loan.remainingBalance - paymentAmount);
    const loanStatus = newRemainingBalance <= 0 ? 'completed' : 'active';

    await db.loan.update({
      where: { id: loanId },
      data: {
        remainingBalance: newRemainingBalance,
        status: loanStatus,
        updatedAt: new Date(),
        nextDueDate: loanStatus === 'active' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next month
          : loan.nextDueDate
      }
    });

    // Create notification for member
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
        principalAmount,
        interestAmount,
        remainingBalance: newRemainingBalance,
        loanStatus
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