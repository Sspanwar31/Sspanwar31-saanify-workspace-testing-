import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const { memberId } = params;

    // Check if member exists
    const member = await db.member.findUnique({
      where: { id: memberId }
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get all passbook entries for the member
    const passbookEntries = await db.passbookEntry.findMany({
      where: { memberId },
      select: {
        depositAmount: true,
        loanInstallment: true,
        interestAuto: true,
        fineAuto: true,
        mode: true,
        loanRequestId: true,
        transactionDate: true
      },
      orderBy: { transactionDate: 'asc' }
    });

    // Calculate total deposits (excluding loan disbursements)
    const totalDeposits = passbookEntries.reduce((sum, entry) => {
      // Only count actual deposits, not loan disbursements
      // Exclude entries that have loanRequestId (loan-related entries)
      // Exclude entries with mode indicating loan disbursement
      const isLoanRelated = entry.loanRequestId !== null || 
                           entry.mode.toLowerCase().includes('loan') ||
                           entry.mode.toLowerCase().includes('disbursal') ||
                           entry.mode.toLowerCase().includes('approved');
      
      if (!isLoanRelated && entry.depositAmount && entry.depositAmount > 0) {
        return sum + entry.depositAmount;
      }
      return sum;
    }, 0);

    return NextResponse.json({
      memberId,
      totalDeposits,
      entryCount: passbookEntries.length
    });

  } catch (error) {
    console.error('Error calculating deposit total:', error);
    return NextResponse.json(
      { error: 'Failed to calculate deposit total' },
      { status: 500 }
    );
  }
}