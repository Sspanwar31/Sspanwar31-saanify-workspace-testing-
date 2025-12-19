import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if email already exists in either User or SocietyAccount
    const existingUser = await db.user.findFirst({
      where: { email }
    })

    const existingSociety = await db.societyAccount.findFirst({
      where: { email }
    })

    const exists = !!(existingUser || existingSociety)

    return NextResponse.json({
      success: true,
      exists: exists
    })

  } catch (error) {
    console.error('Email check error:', error)
    return NextResponse.json(
      { error: 'Failed to check email availability' },
      { status: 500 }
    )
  }
}