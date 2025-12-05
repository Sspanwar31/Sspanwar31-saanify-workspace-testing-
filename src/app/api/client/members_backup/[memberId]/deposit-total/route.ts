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
      orderBy: { transactionDate: 'asc' }
    });

    // Calculate total deposits
    const totalDeposits = passbookEntries.reduce((sum, entry) => sum + (entry.depositAmount || 0), 0);

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