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
      orderBy: { transactionDate: 'asc' }
    });

    // Calculate total deposits (same logic as members API)
    const totalDeposits = memberPassbook.reduce((sum, entry) => sum + (entry.depositAmount || 0), 0);

    // Show individual entries for debugging
    const depositEntries = memberPassbook
      .filter(entry => entry.depositAmount && entry.depositAmount > 0)
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