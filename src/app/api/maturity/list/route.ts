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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build where clause
    let whereClause: any = {}
    
    if (status && status !== 'all') {
      whereClause.status = status
    }
    
    if (search) {
      whereClause.OR = [
        {
          member: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          schemeName: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Fetch maturity records with member names
    const maturityRecords = await db.maturityRecord.findMany({
      where: whereClause,
      include: {
        member: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        startDate: 'desc' // Performance rule: sort by startDate descending
      }
    })

    // Transform data to match frontend interface with calculated fields
    const transformedRecords = maturityRecords.map(record => {
      const calculatedStatus = calculateStatus(record.maturityDate, record.status)
      const daysRemaining = calculateDaysRemaining(record.maturityDate)

      return {
        id: record.id,
        memberName: record.member.name,
        schemeName: record.schemeName,
        principalAmount: record.principalAmount,
        maturityAmount: record.maturityAmount,
        interestRate: record.interestRate,
        startDate: record.startDate.toISOString().split('T')[0],
        maturityDate: record.maturityDate.toISOString().split('T')[0],
        status: calculatedStatus,
        daysRemaining,
        description: `${record.schemeName} - ${record.interestRate}% interest`
      }
    })

    return NextResponse.json(transformedRecords)
  } catch (error) {
    console.error('Error fetching maturity records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maturity records' },
      { status: 500 }
    )
  }
}