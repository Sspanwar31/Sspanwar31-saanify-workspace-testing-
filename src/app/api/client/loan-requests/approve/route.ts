import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      loanId, 
      finalLoanAmount, 
      interestRate, 
      installmentsCount, 
      installmentAmount,
      override = false,
      disburse = false
    } = body;

    if (!loanId || !finalLoanAmount || !interestRate || !installmentsCount || !installmentAmount) {
      return NextResponse.json(
        { error: 'All fields are required: loanId, finalLoanAmount, interestRate, installmentsCount, installmentAmount' },
        { status: 400 }
      );
    }

    // Get the loan request with member
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

    // A) ELIGIBILITY CHECK (MOST IMPORTANT)
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

    // Check 80% eligibility
    if (finalLoanAmount > eligibleAmount && !override) {
      return NextResponse.json(
        { 
          error: 'Loan amount exceeds 80% of total deposits',
          eligibleAmount,
          requestedAmount: finalLoanAmount,
          totalDeposits: memberTotalDeposits,
          requiresOverride: true
        },
        { status: 400 }
      );
    }

    // Calculate total payable amount
    const totalPayable = installmentAmount * installmentsCount;
    const totalInterest = totalPayable - finalLoanAmount;

    // Use transaction for data consistency
    const result = await db.$transaction(async (tx) => {
      // B) END DATE RULES - Active loan has no end date
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          loanAmount: finalLoanAmount,
          interestRate: interestRate,
          status: 'active',
          remainingBalance: totalPayable, // C) REMAINING BALANCE FIX
          startDate: new Date(), // Set start date to today
          endDate: null, // Active loans have no end date
          description: loan.description || 'No description provided',
          updatedAt: new Date()
        }
      });

      // D) PASSBOOK ENTRY FIX - Only create if disburse = true
      if (disburse) {
        await tx.passbookEntry.create({
          data: {
            memberId: loan.memberId,
            loanRequestId: loanId,
            depositAmount: finalLoanAmount,
            loanInstallment: 0,
            interestAuto: 0,
            fineAuto: 0,
            mode: 'loanCredit', // Use loanCredit, NOT deposit
            description: `Loan disbursed - Amount: ₹${finalLoanAmount.toFixed(2)}, Interest: ${interestRate}%, Installments: ${installmentsCount}, EMI: ₹${installmentAmount.toFixed(2)}`,
            transactionDate: new Date()
          }
        });
      }

      // E) Create notification (separate from passbook)
      await tx.notification.create({
        data: {
          memberId: loan.memberId,
          title: "Loan Update",
          message: `Your loan request has been approved for ₹${finalLoanAmount.toFixed(2)}.`,
          type: "loan",
          read: false,
        }
      });

      return updatedLoan;
    });

    // Also send via notification API for consistency
    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/client/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: loan.memberId,
          loanId: loanId,
          notificationType: 'loan_approved',
          message: `Your loan request has been approved for ₹${finalLoanAmount.toFixed(2)}.`
        })
      });
    } catch (error) {
      console.log('Notification API call failed, but database operations succeeded:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Loan approved successfully',
      loan: result,
      approvalDetails: {
        finalLoanAmount,
        interestRate,
        installmentsCount,
        installmentAmount,
        totalPayable,
        totalInterest,
        eligibleAmount,
        totalDeposits: memberTotalDeposits,
        disbursementMade: disburse
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