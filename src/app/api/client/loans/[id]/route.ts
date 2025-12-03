import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const { loanAmount, interestRate, remainingBalance, status, startDate, endDate } = body;

    // Validate required fields
    if (!loanAmount || loanAmount <= 0) {
      return NextResponse.json(
        { error: 'Loan amount is required and must be greater than 0' },
        { status: 400 }
      );
    }

    if (!interestRate || interestRate < 0) {
      return NextResponse.json(
        { error: 'Interest rate is required and must be non-negative' },
        { status: 400 }
      );
    }

    // Check if loan exists
    const existingLoan = await db.loan.findUnique({
      where: { id }
    });

    if (!existingLoan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }

    // Update loan
    const updatedLoan = await db.loan.update({
      where: { id },
      data: {
        loanAmount: parseFloat(loanAmount),
        interestRate: parseFloat(interestRate),
        remainingBalance: parseFloat(remainingBalance) || 0,
        status: status || existingLoan.status,
        loanDate: startDate ? new Date(startDate) : existingLoan.loanDate,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Loan updated successfully',
      loan: updatedLoan
    });

  } catch (error) {
    console.error('Error updating loan:', error);
    return NextResponse.json(
      { error: 'Failed to update loan' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Check if loan exists
    const existingLoan = await db.loan.findUnique({
      where: { id },
      include: {
        passbookEntries: {
          select: { id: true }
        }
      }
    });

    if (!existingLoan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }

    // Check if loan has any payments/passbook entries
    if (existingLoan.passbookEntries && existingLoan.passbookEntries.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete loan with existing payment records. Please close the loan instead.' },
        { status: 400 }
      );
    }

    // Delete the loan
    await db.loan.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Loan deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting loan:', error);
    return NextResponse.json(
      { error: 'Failed to delete loan' },
      { status: 500 }
    );
  }
}