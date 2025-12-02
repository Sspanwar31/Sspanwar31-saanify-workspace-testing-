import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId, loanId, emiAmount, dueDate } = body;

    if (!memberId || !loanId || !emiAmount || !dueDate) {
      return NextResponse.json(
        { error: 'Member ID, loan ID, EMI amount, and due date are required' },
        { status: 400 }
      );
    }

    // Create EMI reminder notification
    await db.passbookEntry.create({
      data: {
        memberId: memberId,
        loanRequestId: loanId,
        depositAmount: 0,
        loanInstallment: 0,
        interestAuto: 0,
        fineAuto: 0,
        mode: 'EMI Reminder',
        description: `Your EMI for Loan #${loanId} is due. Amount: ₹${emiAmount.toFixed(2)}. Please deposit before the 15th of this month.`,
        transactionDate: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'EMI reminder created successfully'
    });

  } catch (error) {
    console.error('Error creating EMI reminder:', error);
    return NextResponse.json(
      { error: 'Failed to create EMI reminder' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Get all active loans for the member
    const activeLoans = await db.loan.findMany({
      where: {
        memberId: memberId,
        status: 'active'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Create EMI reminders for all active loans (for the 10th of current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const tenthDay = new Date(currentYear, currentMonth, 10);

    for (const loan of activeLoans) {
      // Check if reminder already exists for this month
      const existingReminder = await db.passbookEntry.findFirst({
        where: {
          memberId: memberId,
          loanRequestId: loan.id,
          mode: 'EMI Reminder',
          transactionDate: {
            gte: new Date(currentYear, currentMonth, 1),
            lt: new Date(currentYear, currentMonth + 1, 1)
          }
        }
      });

      if (!existingReminder) {
        await db.passbookEntry.create({
          data: {
            memberId: memberId,
            loanRequestId: loan.id,
            depositAmount: 0,
            loanInstallment: 0,
            interestAuto: 0,
            fineAuto: 0,
            mode: 'EMI Reminder',
            description: `Your EMI for Loan #${loan.id} is due. Amount: ₹${loan.loanAmount.toFixed(2)}. Please deposit before the 15th of this month.`,
            transactionDate: tenthDay
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'EMI reminders processed successfully',
      remindersCreated: activeLoans.length
    });

  } catch (error) {
    console.error('Error processing EMI reminders:', error);
    return NextResponse.json(
      { error: 'Failed to process EMI reminders' },
      { status: 500 }
    );
  }
}