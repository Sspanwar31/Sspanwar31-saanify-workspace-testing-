import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { differenceInMonths } from 'date-fns';

export async function GET() {
  try {
    // Get all maturity records with member information
    const maturityRecords = await db.maturityRecord.findMany({
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate current values for each record
    const currentDate = new Date();
    const processedRecords = maturityRecords.map(record => {
      const monthsCompleted = differenceInMonths(currentDate, record.startDate);
      const remainingMonths = 36 - monthsCompleted;
      const monthlyRate = 0.0333333333;
      
      // Current Interest (Accrued)
      const currentInterest = record.totalDeposit * monthlyRate * monthsCompleted;
      
      // Full Interest (Fixed 12%)
      const fullInterest = record.totalDeposit * 0.12;
      
      // Adjusted Interest
      const adjustedInterest = record.manualOverride 
        ? (record.adjustedInterest || fullInterest)
        : fullInterest;
      
      // Current Adjustment
      const currentAdjustment = adjustedInterest - currentInterest;
      
      // Determine status
      let status = record.status;
      if (monthsCompleted < 36) {
        status = "active";
      } else if (monthsCompleted >= 36) {
        status = "matured";
      }
      if (record.claimedAt) {
        status = "claimed";
      }

      return {
        id: record.id,
        memberId: record.memberId,
        memberName: record.member.name,
        totalDeposit: record.totalDeposit,
        startDate: record.startDate.toISOString(),
        maturityDate: record.maturityDate.toISOString(),
        monthsCompleted,
        remainingMonths: Math.max(0, remainingMonths),
        monthlyInterestRate: monthlyRate,
        currentInterest,
        fullInterest,
        manualOverride: record.manualOverride,
        adjustedInterest,
        currentAdjustment,
        status,
        claimedAt: record.claimedAt?.toISOString(),
        member: record.member
      };
    });

    return NextResponse.json(processedRecords);
  } catch (error) {
    console.error('Error fetching maturity records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maturity records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { recordId, adjustedInterest } = await request.json();

    if (!recordId || adjustedInterest === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update the maturity record with manual override
    const updatedRecord = await db.maturityRecord.update({
      where: { id: recordId },
      data: {
        manualOverride: true,
        adjustedInterest: parseFloat(adjustedInterest),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Error updating maturity record:', error);
    return NextResponse.json(
      { error: 'Failed to update maturity record' },
      { status: 500 }
    );
  }
}