import { NextRequest, NextResponse } from 'next/server'
import { getProfitLossStatement } from '@/data/reportsData'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    
    // Get maturity data from the request body or calculate it
    let maturityData = []
    try {
      const body = await request.json()
      maturityData = body.maturityData || []
    } catch {
      // If no body provided, we'll calculate it without maturity data
    }

    const profitLoss = getProfitLossStatement(startDate, endDate, maturityData)

    return NextResponse.json({
      success: true,
      data: profitLoss,
      message: maturityData.length > 0 
        ? 'P&L report generated with maturity interest projections'
        : 'P&L report generated (maturity data not provided)'
    })

  } catch (error) {
    console.error('Error generating P&L report:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate P&L report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { startDate, endDate, maturityData } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'startDate and endDate are required' 
        },
        { status: 400 }
      )
    }

    const profitLoss = getProfitLossStatement(startDate, endDate, maturityData)

    return NextResponse.json({
      success: true,
      data: profitLoss,
      message: 'P&L report generated with maturity interest projections'
    })

  } catch (error) {
    console.error('Error generating P&L report:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate P&L report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}