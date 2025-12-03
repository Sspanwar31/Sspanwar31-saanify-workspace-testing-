import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to calculate status based on dates
function calculateStatus(maturityDate: Date, currentStatus: string): 'active' | 'matured' | 'claimed' | 'overdue' {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maturity = new Date(maturityDate)
  maturity.setHours(0, 0, 0, 0)

  // If already claimed, keep claimed status
  if (currentStatus === 'claimed') {
    return 'claimed'
  }

  // Calculate status based on dates
  if (today < maturity) {
    return 'active'
  } else if (today.getTime() === maturity.getTime()) {
    return 'matured'
  } else {
    return 'overdue'
  }
}

// Helper function to calculate days remaining
function calculateDaysRemaining(maturityDate: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maturity = new Date(maturityDate)
  maturity.setHours(0, 0, 0, 0)
  
  const diffTime = maturity.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Maturity record ID is required' },
        { status: 400 }
      )
    }

    // Fetch maturity record with member details
    const maturityRecord = await db.maturityRecord.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            name: true,
            phone: true,
            address: true
          }
        }
      }
    })

    if (!maturityRecord) {
      return NextResponse.json(
        { error: 'Maturity record not found' },
        { status: 404 }
      )
    }

    // Calculate status and days remaining
    const calculatedStatus = calculateStatus(maturityRecord.maturityDate, maturityRecord.status)
    const daysRemaining = calculateDaysRemaining(maturityRecord.maturityDate)

    // Calculate interest breakdown
    const interestEarned = maturityRecord.maturityAmount - maturityRecord.principalAmount

    // Return detailed record with chart-ready format
    const detailedRecord = {
      id: maturityRecord.id,
      memberName: maturityRecord.member.name,
      memberDetails: {
        phone: maturityRecord.member.phone,
        address: maturityRecord.member.address
      },
      schemeName: maturityRecord.schemeName,
      principalAmount: maturityRecord.principalAmount,
      maturityAmount: maturityRecord.maturityAmount,
      interestRate: maturityRecord.interestRate,
      startDate: maturityRecord.startDate.toISOString().split('T')[0],
      maturityDate: maturityRecord.maturityDate.toISOString().split('T')[0],
      status: calculatedStatus,
      daysRemaining,
      description: `${maturityRecord.schemeName} - ${maturityRecord.interestRate}% interest`,
      
      // Principal breakdown for detailed view
      principalBreakdown: {
        principal: maturityRecord.principalAmount,
        interestEarned: parseFloat(interestEarned.toFixed(2)),
        totalMaturity: maturityRecord.maturityAmount
      },

      // Interest calculation details
      interestCalculation: {
        principal: maturityRecord.principalAmount,
        rate: maturityRecord.interestRate,
        formula: `${maturityRecord.principalAmount} + (${maturityRecord.principalAmount} * ${maturityRecord.interestRate} / 100) = ${maturityRecord.maturityAmount}`,
        interestEarned: parseFloat(interestEarned.toFixed(2))
      },

      // Chart-ready data
      chartData: {
        principal: maturityRecord.principalAmount,
        interest: parseFloat(interestEarned.toFixed(2)),
        total: maturityRecord.maturityAmount,
        principalPercentage: parseFloat(((maturityRecord.principalAmount / maturityRecord.maturityAmount) * 100).toFixed(2)),
        interestPercentage: parseFloat(((interestEarned / maturityRecord.maturityAmount) * 100).toFixed(2))
      },

      // Metadata
      createdAt: maturityRecord.createdAt.toISOString().split('T')[0],
      updatedAt: maturityRecord.updatedAt.toISOString().split('T')[0]
    }

    return NextResponse.json(detailedRecord)
  } catch (error) {
    console.error('Error fetching maturity record:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maturity record' },
      { status: 500 }
    )
  }
}