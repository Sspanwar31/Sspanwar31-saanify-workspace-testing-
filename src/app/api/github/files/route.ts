import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Return empty files array for now
    return NextResponse.json({ files: [] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}