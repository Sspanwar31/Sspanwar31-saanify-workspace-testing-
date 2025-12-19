import { NextRequest, NextResponse } from 'next/server';
import { MaturityService } from '@/lib/services/maturity.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordId } = body;

    if (!recordId) {
      return NextResponse.json(
        { error: 'Maturity record ID is required' },
        { status: 400 }
      );
    }

    // Process the maturity claim
    const result = await MaturityService.claimMaturity(recordId);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in maturity claim API:', error);
    return NextResponse.json(
      { error: 'Failed to claim maturity' },
      { status: 500 }
    );
  }
}