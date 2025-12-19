import { NextRequest, NextResponse } from 'next/server';
import { LoanService } from '@/lib/services/loan.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId, amount, description, overrideEnabled = false } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Loan amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Use LoanService to validate and create the loan
    const result = await LoanService.createLoan({
      memberId,
      loanAmount: amount,
      description,
      overrideEnabled
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error, 
          message: result.message,
          validation: await LoanService.validateLoanRequest(memberId, amount, overrideEnabled)
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      loan: result.data,
      loanId: result.data?.id,
      status: result.data?.status
    });

  } catch (error) {
    console.error('Error in loan request API:', error);
    return NextResponse.json(
      { error: 'Failed to create loan request' },
      { status: 500 }
    );
  }
}