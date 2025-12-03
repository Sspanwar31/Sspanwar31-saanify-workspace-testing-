import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { memberId, schemeName, principalAmount, interestRate, startDate } = body

    // Validate required fields
    if (!memberId || !schemeName || !principalAmount || !interestRate || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: memberId, schemeName, principalAmount, interestRate, startDate' },
        { status: 400 }
      )
    }

    // Validate member exists
    const member = await db.member.findUnique({
      where: { id: memberId }
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Calculate maturity amount using the specified formula
    const maturityAmount = principalAmount + (principalAmount * interestRate / 100)

    // Calculate maturity date based on scheme duration
    // For now, we'll add a default duration. This can be enhanced later.
    let maturityDate = new Date(startDate)
    
    // Extract duration from scheme name if possible (e.g., "Fixed Deposit - 2 Years")
    const durationMatch = schemeName.match(/(\d+)\s*(year|month|years|months)/i)
    if (durationMatch) {
      const duration = parseInt(durationMatch[1])
      const unit = durationMatch[2].toLowerCase()
      
      if (unit.includes('year')) {
        maturityDate.setFullYear(maturityDate.getFullYear() + duration)
      } else if (unit.includes('month')) {
        maturityDate.setMonth(maturityDate.getMonth() + duration)
      }
    } else {
      // Default to 1 year if no duration found
      maturityDate.setFullYear(maturityDate.getFullYear() + 1)
    }

    // Create maturity record
    const maturityRecord = await db.maturityRecord.create({
      data: {
        memberId,
        schemeName,
        principalAmount: parseFloat(principalAmount),
        maturityAmount: parseFloat(maturityAmount.toFixed(2)),
        interestRate: parseFloat(interestRate),
        startDate: new Date(startDate),
        maturityDate,
        status: 'active'
      },
      include: {
        member: {
          select: {
            name: true
          }
        }
      }
    })

    // Calculate days remaining
    const today = new Date()
    const daysRemaining = Math.ceil((maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // Return formatted response matching frontend interface
    const response = {
      id: maturityRecord.id,
      memberName: maturityRecord.member.name,
      schemeName: maturityRecord.schemeName,
      principalAmount: maturityRecord.principalAmount,
      maturityAmount: maturityRecord.maturityAmount,
      interestRate: maturityRecord.interestRate,
      startDate: maturityRecord.startDate.toISOString().split('T')[0],
      maturityDate: maturityRecord.maturityDate.toISOString().split('T')[0],
      status: maturityRecord.status,
      daysRemaining: Math.max(0, daysRemaining),
      description: `${schemeName} - ${interestRate}% interest`
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating maturity record:', error)
    return NextResponse.json(
      { error: 'Failed to create maturity record' },
      { status: 500 }
    )
  }
}