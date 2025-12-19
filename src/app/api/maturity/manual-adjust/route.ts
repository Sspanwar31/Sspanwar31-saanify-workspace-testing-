import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /maturity/manual-adjust - Updates fullInterest manually when toggle = ON
export async function POST(request: NextRequest) {
  try {
    const { recordId, adjustedInterest, manualOverride } = await request.json();

    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    // Validate adjustedInterest if manualOverride is true
    if (manualOverride && (adjustedInterest === undefined || adjustedInterest === null)) {
      return NextResponse.json(
        { error: 'Adjusted interest is required when manual override is enabled' },
        { status: 400 }
      );
    }

    // Update the maturity record
    const updatedRecord = await db.maturityRecord.update({
      where: { id: recordId },
      data: {
        manualOverride: manualOverride || false,
        adjustedInterest: manualOverride ? adjustedInterest : null
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      }
    });

    // Recalculate values
    const currentInterest = updatedRecord.totalDeposit * 0.0333333333 * updatedRecord.monthsCompleted;
    const fullInterest = updatedRecord.totalDeposit * 0.12;
    const finalAdjustedInterest = manualOverride ? adjustedInterest : fullInterest;
    const currentAdjustment = finalAdjustedInterest - currentInterest;

    return NextResponse.json({
      ...updatedRecord,
      memberName: updatedRecord.member.name,
      currentInterest,
      fullInterest,
      adjustedInterest: finalAdjustedInterest,
      currentAdjustment
    });
  } catch (error) {
    console.error('Error adjusting maturity record:', error);
    return NextResponse.json(
      { error: 'Failed to adjust maturity record' },
      { status: 500 }
    );
  }
}