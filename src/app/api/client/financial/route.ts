import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withClient, AuthenticatedRequest } from '@/lib/auth-middleware'

// Get client financial summary (Client only)
export const GET = withClient(async (req: AuthenticatedRequest) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        societyAccount: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Mock financial data (in a real app, this would come from financial tables)
    const financialData = {
      accountBalance: 125750.50,
      monthlyIncome: 8500.00,
      monthlyExpenses: 3200.00,
      netMonthly: 5300.00,
      yearToDate: 63600.00,
      lastTransaction: {
        date: '2024-01-15T10:30:00Z',
        description: 'Maintenance Payment',
        amount: -250.00,
        type: 'expense'
      },
      transactions: [
        {
          id: '1',
          date: '2024-01-15T10:30:00Z',
          description: 'Maintenance Payment',
          amount: -250.00,
          type: 'expense',
          category: 'Maintenance',
          status: 'completed'
        },
        {
          id: '2',
          date: '2024-01-10T14:20:00Z',
          description: 'Monthly Contribution',
          amount: 1500.00,
          type: 'income',
          category: 'Contribution',
          status: 'completed'
        },
        {
          id: '3',
          date: '2024-01-05T09:15:00Z',
          description: 'Parking Fee',
          amount: -50.00,
          type: 'expense',
          category: 'Parking',
          status: 'completed'
        }
      ],
      societyInfo: user.societyAccount ? {
        name: user.societyAccount.name,
        status: user.societyAccount.status,
        subscriptionPlan: user.societyAccount.subscriptionPlan,
        totalMembers: user.societyAccount.totalMembers
      } : null
    }

    return NextResponse.json({
      success: true,
      data: financialData
    })

  } catch (error) {
    console.error('Get financial data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial data' },
      { status: 500 }
    )
  }
})