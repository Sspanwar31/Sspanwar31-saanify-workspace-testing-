import { NextRequest, NextResponse } from 'next/server';
import { MaturityService } from '@/lib/services/maturity.service';

export async function POST() {
  try {
    const result = await MaturityService.updateAllMaturityRecords();
    return NextResponse.json({
      success: true,
      ...result,
      message: `Maturity records updated: ${result.updated} updated, ${result.errors} errors`
    });
  } catch (error) {
    console.error('Error generating maturity records:', error);
    return NextResponse.json(
      { error: 'Failed to generate maturity records' },
      { status: 500 }
    );
  }
}