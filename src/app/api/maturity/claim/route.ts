import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { recordId } = await request.json();

    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    // Update the maturity record as claimed
    const updatedRecord = await db.maturityRecord.update({
      where: { id: recordId },
      data: {
        status: 'claimed',
        claimedAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Error claiming maturity:', error);
    return NextResponse.json(
      { error: 'Failed to claim maturity' },
      { status: 500 }
    );
  }
}