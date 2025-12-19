import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    // Validate required fields
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: id, status' },
        { status: 400 }
      )
    }

    // Validate status value
    const validStatuses = ['active', 'matured', 'claimed', 'overdue']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if maturity record exists
    const existingRecord = await db.maturityRecord.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            name: true
          }
        }
      }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Maturity record not found' },
        { status: 404 }
      )
    }

    // Update only the status column
    const updatedRecord = await db.maturityRecord.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        member: {
          select: {
            name: true
          }
        }
      }
    })

    // Calculate days remaining for response
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maturity = new Date(updatedRecord.maturityDate)
    maturity.setHours(0, 0, 0, 0)
    
    const diffTime = maturity.getTime() - today.getTime()
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // Return updated record matching frontend interface
    const response = {
      id: updatedRecord.id,
      memberName: updatedRecord.member.name,
      schemeName: updatedRecord.schemeName,
      principalAmount: updatedRecord.principalAmount,
      maturityAmount: updatedRecord.maturityAmount,
      interestRate: updatedRecord.interestRate,
      startDate: updatedRecord.startDate.toISOString().split('T')[0],
      maturityDate: updatedRecord.maturityDate.toISOString().split('T')[0],
      status: updatedRecord.status,
      daysRemaining: Math.max(0, daysRemaining),
      description: `${updatedRecord.schemeName} - ${updatedRecord.interestRate}% interest`,
      updatedAt: updatedRecord.updatedAt.toISOString().split('T')[0]
    }

    // Future-proof hook: Email/SMS alerts placeholder
    if (status === 'matured') {
      // Placeholder for maturity notification
      console.log(`🔔 FUTURE: Send maturity notification to ${updatedRecord.member.name} for scheme ${updatedRecord.schemeName}`)
      // TODO: Implement email/SMS alert service
    }

    if (status === 'claimed') {
      // Placeholder for claim confirmation
      console.log(`🔔 FUTURE: Send claim confirmation to ${updatedRecord.member.name} for scheme ${updatedRecord.schemeName}`)
      // TODO: Implement claim confirmation notification
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating maturity record status:', error)
    return NextResponse.json(
      { error: 'Failed to update maturity record status' },
      { status: 500 }
    )
  }
}