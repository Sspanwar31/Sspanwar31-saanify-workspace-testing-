import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loanId, finalLoanAmount, interestRate, installmentsCount, installmentAmount } = body;

    if (!loanId || !finalLoanAmount || !interestRate || !installmentsCount || !installmentAmount) {
      return NextResponse.json(
        { error: 'All fields are required: loanId, finalLoanAmount, interestRate, installmentsCount, installmentAmount' },
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

    // Calculate total payable amount
    const totalPayable = installmentAmount * installmentsCount;
    const totalInterest = totalPayable - finalLoanAmount;

    // Update the loan with approved details
    const updatedLoan = await db.loan.update({
      where: { id: loanId },
      data: {
        loanAmount: finalLoanAmount,
        interestRate: interestRate,
        status: 'active',
        remainingBalance: totalPayable,
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        description: loan.description || 'No description provided',
        updatedAt: new Date()
      }
    });

    // Create passbook entry for loan approval
    await db.passbookEntry.create({
      data: {
        memberId: loan.memberId,
        loanRequestId: loanId,
        depositAmount: finalLoanAmount,
        loanInstallment: 0,
        interestAuto: 0,
        fineAuto: 0,
        mode: 'Loan Approved',
        description: `Loan approved - Amount: ₹${finalLoanAmount.toFixed(2)}, Interest: ${interestRate}%, Installments: ${installmentsCount}, EMI: ₹${installmentAmount.toFixed(2)}`,
        transactionDate: new Date()
      }
    });

    // Create proper notification for member
    await db.notification.create({
      data: {
        memberId: loan.memberId,
        title: "Loan Update",
        message: "Your loan has been approved successfully.",
        type: "loan",
        read: false,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Loan approved successfully',
      loan: updatedLoan,
      approvalDetails: {
        finalLoanAmount,
        interestRate,
        installmentsCount,
        installmentAmount,
        totalPayable,
        totalInterest
      }
    });

  } catch (error) {
    console.error('Error approving loan:', error);
    return NextResponse.json(
      { error: 'Failed to approve loan' },
      { status: 500 }
    );
  }
}