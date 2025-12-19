import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
    }

    // Get member info
    const member = await db.member.findUnique({
      where: { id: memberId }
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get member's passbook entries
    const memberPassbook = await db.passbookEntry.findMany({
      where: { memberId },
      select: {
        depositAmount: true,
        loanInstallment: true,
        interestAuto: true,
        fineAuto: true,
        mode: true,
        loanRequestId: true,
        transactionDate: true,
        description: true,
        id: true
      },
      orderBy: { transactionDate: 'asc' }
    });

    // Calculate total deposits (excluding loan disbursements)
    const totalDeposits = memberPassbook.reduce((sum, entry) => {
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

    // Show individual entries for debugging (excluding loan disbursements)
    const depositEntries = memberPassbook
      .filter(entry => {
        const isLoanRelated = entry.loanRequestId !== null || 
                             entry.mode.toLowerCase().includes('loan') ||
                             entry.mode.toLowerCase().includes('disbursal') ||
                             entry.mode.toLowerCase().includes('approved');
        return !isLoanRelated && entry.depositAmount && entry.depositAmount > 0;
      })
      .map(entry => ({
        id: entry.id,
        date: entry.transactionDate,
        mode: entry.mode,
        depositAmount: entry.depositAmount,
        description: entry.description
      }));

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        name: member.name
      },
      totalDeposits,
      eightyPercentLimit: totalDeposits * 0.8,
      totalEntries: memberPassbook.length,
      depositEntries,
      allEntries: memberPassbook.map(entry => ({
        id: entry.id,
        date: entry.transactionDate,
        mode: entry.mode,
        depositAmount: entry.depositAmount,
        loanInstallment: entry.loanInstallment,
        interestAuto: entry.interestAuto,
        fineAuto: entry.fineAuto,
        description: entry.description
      }))
    });

  } catch (error) {
    console.error('Error in debug deposit API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch debug deposit info' 
      },
      { status: 500 }
    );
  }
}