import { NextRequest, NextResponse } from 'next/server';
import { MaturityService } from '@/lib/services/maturity.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Calculate maturity for the specific member
    const calculationResult = await MaturityService.calculateMaturity(memberId);

    if (!calculationResult.success) {
      return NextResponse.json(
        { error: calculationResult.error, message: calculationResult.message },
        { status: 400 }
      );
    }

    // Get or create maturity record
    const recordResult = await MaturityService.createOrUpdateMaturityRecord(memberId);

    // Get comprehensive maturity stats
    const stats = await MaturityService.getMemberMaturityStats(memberId);

    return NextResponse.json({
      success: true,
      calculation: calculationResult.data,
      record: recordResult.data,
      stats,
      message: calculationResult.message
    });

  } catch (error) {
    console.error('Error in maturity calculation API:', error);
    return NextResponse.json(
      { error: 'Failed to calculate maturity' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId, manualOverride = false } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Create or update maturity record
    const result = await MaturityService.createOrUpdateMaturityRecord(memberId, manualOverride);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message
    });

  } catch (error) {
    console.error('Error in maturity record creation API:', error);
    return NextResponse.json(
      { error: 'Failed to create/update maturity record' },
      { status: 500 }
    );
  }
}