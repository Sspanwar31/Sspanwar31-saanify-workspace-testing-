import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Generate mock signup data for last 7 days
    const signupData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      signupData.push({
        date: date.toLocaleDateString(),
        count: Math.floor(Math.random() * 15) + 2 // Random between 2-17
      })
    }

    return NextResponse.json({
      success: true,
      signupData,
      totalSignups: signupData.reduce((sum, d) => sum + d.count, 0),
      averageDaily: Math.round(signupData.reduce((sum, d) => sum + d.count, 0) / signupData.length)
    })
  } catch (error) {
    console.error('Failed to fetch signup stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch signup statistics' },
      { status: 500 }
    )
  }
}