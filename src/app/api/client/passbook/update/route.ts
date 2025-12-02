import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      deposit,
      installment,
      interest,
      fine,
      date,
      note,
      mode
    } = body;

    // Validation
    if ((deposit || 0) < 0 || (installment || 0) < 0) {
      return NextResponse.json(
        { error: 'Deposit and installment amounts must be non-negative' },
        { status: 400 }
      );
    }

    if ((!deposit || deposit === 0) && (!installment || installment === 0)) {
      return NextResponse.json(
        { error: 'Either deposit or installment amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Check if entry exists
    const existingEntry = await db.passbookEntry.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Passbook entry not found' },
        { status: 404 }
      );
    }

    // Update the entry
    const updatedEntry = await db.passbookEntry.update({
      where: { id },
      data: {
        depositAmount: deposit !== undefined ? deposit : existingEntry.depositAmount,
        loanInstallment: installment !== undefined ? installment : existingEntry.loanInstallment,
        interestAuto: interest !== undefined ? interest : existingEntry.interestAuto,
        fineAuto: fine !== undefined ? fine : existingEntry.fineAuto,
        transactionDate: date ? new Date(date) : existingEntry.transactionDate,
        description: note !== undefined ? note : existingEntry.description,
        mode: mode || existingEntry.mode
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    // Recalculate running balance for this member's entries
    const allMemberEntries = await db.passbookEntry.findMany({
      where: { memberId: existingEntry.memberId },
      orderBy: { transactionDate: 'asc' }
    });

    let runningBalance = 0;
    const balanceMap = new Map();

    allMemberEntries.forEach(entry => {
      const depositAmount = entry.depositAmount || 0;
      const installmentAmount = entry.loanInstallment || 0;
      const interestAmount = entry.interestAuto || 0;
      const fineAmount = entry.fineAuto || 0;
      
      runningBalance = runningBalance + depositAmount - installmentAmount + interestAmount + fineAmount;
      balanceMap.set(entry.id, runningBalance);
    });

    // Return response with calculated balance
    const responseEntry = {
      id: updatedEntry.id,
      memberId: updatedEntry.memberId,
      memberName: updatedEntry.member.name,
      date: updatedEntry.transactionDate.toISOString().split('T')[0],
      deposit: updatedEntry.depositAmount || 0,
      installment: updatedEntry.loanInstallment || 0,
      interest: updatedEntry.interestAuto || 0,
      fine: updatedEntry.fineAuto || 0,
      mode: updatedEntry.mode,
      description: updatedEntry.description || '',
      balance: balanceMap.get(id) || 0,
      createdAt: updatedEntry.createdAt,
      updatedAt: updatedEntry.updatedAt
    };

    return NextResponse.json({
      success: true,
      entry: responseEntry,
      affectedEntries: allMemberEntries.length,
      message: 'Passbook entry updated successfully'
    });

  } catch (error) {
    console.error('Error in passbook update API:', error);
    return NextResponse.json(
      { error: 'Failed to update passbook entry' },
      { status: 500 }
    );
  }
}