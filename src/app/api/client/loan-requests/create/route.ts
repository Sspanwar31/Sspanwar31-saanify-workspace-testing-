import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId, amount, description } = body;

    console.log('Loan request API received:', { memberId, amount, description });

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

    // Active loan check removed - members can now request multiple loans
    // const existingActiveLoan = await db.loan.findFirst({
    //   where: {
    //     memberId: memberId,
    //     status: 'active'
    //   }
    // });

    // if (existingActiveLoan) {
    //   return NextResponse.json(
    //     { error: 'Member already has an active loan' },
    //     { status: 400 }
    //   );
    // }

    // Use amount if provided; otherwise store 0
    const loanAmount = amount && amount > 0 ? amount : 0;
    const requestAmount = amount && amount > 0 ? amount : 0;

    // Create loan request
    const newLoan = await db.loan.create({
      data: {
        memberId: memberId,
        loanAmount: loanAmount,
        interestRate: 1.0,
        status: 'pending',
        remainingBalance: 0,
        description: description || 'Loan request',
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Loan request submitted successfully',
      loanId: newLoan.id,
      status: 'pending',
      loanAmount: loanAmount
    });

  } catch (error: any) {
    console.error('Error in loan request API:', error);
    return NextResponse.json(
      { error: 'Failed to create loan request', details: error.message },
      { status: 500 }
    );
  }
}