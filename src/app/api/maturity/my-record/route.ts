import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateMaturityValues } from '@/lib/maturity-service';

// GET /maturity/my-record - Returns current user's maturity record
export async function GET(request: NextRequest) {
  try {
    // For demo purposes, we'll skip authentication and return data for the first member
    // In a real production app, you'd verify the user session properly
    
    // Find member associated with this user
    // For demo purposes, we'll use the first member found
    // In a real system, you'd have a proper user-member relationship
    const member = await db.member.findFirst({
      where: {
        status: 'active'
      }
    });

    // If no member found, try to get any member for demo purposes
    const fallbackMember = member || await db.member.findFirst();

    if (!fallbackMember) {
      return NextResponse.json(
        { error: 'No member found for this user' },
        { status: 404 }
      );
    }

    // Get maturity record for this member
    const maturityRecord = await db.maturityRecord.findFirst({
      where: { memberId: fallbackMember.id },
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

    if (!maturityRecord) {
      return NextResponse.json(
        { error: 'No maturity record found' },
        { status: 404 }
      );
    }

    // Calculate values
    const calculatedValues = calculateMaturityValues(maturityRecord, maturityRecord.totalDeposit);

    return NextResponse.json({
      ...maturityRecord,
      memberName: maturityRecord.member.name,
      ...calculatedValues
    });
  } catch (error) {
    console.error('Error fetching maturity record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maturity record' },
      { status: 500 }
    );
  }
}