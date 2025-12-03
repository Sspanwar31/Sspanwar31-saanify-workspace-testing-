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

    // Create proper notification for member
    await db.notification.create({
      data: {
        memberId: loan.memberId,
        title: "Loan Update",
        message: "Your loan request has been rejected.",
        type: "loan",
        read: false,
      }
    });

    // NOTE: Loan rejections should NOT create passbook entries
    // Only loan approvals should appear in passbook
    // This prevents unwanted "Loan Rejected" entries in passbook

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