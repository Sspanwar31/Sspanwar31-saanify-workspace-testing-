import { NextRequest, NextResponse } from 'next/server';
import { generateMaturityRecords } from '@/lib/maturity-service';

export async function POST() {
  try {
    const result = await generateMaturityRecords();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating maturity records:', error);
    return NextResponse.json(
      { error: 'Failed to generate maturity records' },
      { status: 500 }
    );
  }
}