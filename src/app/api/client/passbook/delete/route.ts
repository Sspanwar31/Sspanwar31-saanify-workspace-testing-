import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    // Check if entry exists and get member info
    const existingEntry = await db.passbookEntry.findUnique({
      where: { id },
      select: {
        id: true,
        memberId: true,
        transactionDate: true,
        depositAmount: true,
        loanInstallment: true,
        interestAuto: true,
        fineAuto: true,
        mode: true,
        description: true
      }
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Passbook entry not found' },
        { status: 404 }
      );
    }

    // Delete the entry
    await db.passbookEntry.delete({
      where: { id }
    });

    // Recalculate running balances for remaining entries
    const remainingEntries = await db.passbookEntry.findMany({
      where: { memberId: existingEntry.memberId },
      orderBy: { transactionDate: 'asc' }
    });

    let runningBalance = 0;
    const updatedBalances = new Map();

    remainingEntries.forEach(entry => {
      const depositAmount = entry.depositAmount || 0;
      const installmentAmount = entry.loanInstallment || 0;
      const interestAmount = entry.interestAuto || 0;
      const fineAmount = entry.fineAuto || 0;
      
      runningBalance = runningBalance + depositAmount - installmentAmount + interestAmount + fineAmount;
      updatedBalances.set(entry.id, runningBalance);
    });

    return NextResponse.json({
      success: true,
      deletedEntry: {
        id: existingEntry.id,
        memberId: existingEntry.memberId,
        date: existingEntry.transactionDate.toISOString().split('T')[0],
        deposit: existingEntry.depositAmount || 0,
        installment: existingEntry.loanInstallment || 0,
        interest: existingEntry.interestAuto || 0,
        fine: existingEntry.fineAuto || 0,
        mode: existingEntry.mode,
        description: existingEntry.description || ''
      },
      remainingEntriesCount: remainingEntries.length,
      newBalance: runningBalance,
      message: 'Passbook entry deleted successfully'
    });

  } catch (error) {
    console.error('Error in passbook delete API:', error);
    return NextResponse.json(
      { error: 'Failed to delete passbook entry' },
      { status: 500 }
    );
  }
}