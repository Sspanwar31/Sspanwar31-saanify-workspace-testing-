import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const { memberId } = params;

    // Get member's passbook entries
    const memberPassbook = await db.passbookEntry.findMany({
      where: { memberId },
      orderBy: { transactionDate: 'asc' }
    });

    // Calculate total deposits (sum of all deposits only) - Same logic as members API
    const totalDeposits = memberPassbook.reduce((sum, entry) => sum + (entry.depositAmount || 0), 0);

    return NextResponse.json({
      success: true,
      memberId,
      totalDeposit: totalDeposits,
      eightyPercentLimit: totalDeposits * 0.8
    });

  } catch (error) {
    console.error('Error fetching member deposit total:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch member deposit total' 
      },
      { status: 500 }
    );
  }
}