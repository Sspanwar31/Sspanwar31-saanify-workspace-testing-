import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/lib/services/transaction.service';
import { db } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('id');
    
    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      memberId, 
      date, 
      deposit, 
      installment, 
      interest, 
      fine, 
      mode, 
      note 
    } = body;

    if (!memberId || !date || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: memberId, date, mode' },
        { status: 400 }
      );
    }

    // Use TransactionService for proper ledger reversal logic
    const result = await TransactionService.updateEntry({
      entryId,
      memberId,
      deposit: deposit || 0,
      installment: installment || 0,
      interest: interest || 0,
      fine: fine || 0,
      mode: mode,
      description: note || '',
      transactionDate: new Date(date)
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update entry' },
        { status: 400 }
      );
    }

    const updatedEntry = result.data.updatedEntry;

    // Calculate balance - CURRENT ENTRY ONLY
    // As per requirement: NEW BALANCE = इस entry में user ने जो भरा है उनका total
    const currentEntryTotal = (deposit || 0) + (installment || 0) + (interest || 0) + (fine || 0);
    const entryBalance = currentEntryTotal;

    // Get updated loan status
    let loanBalance = 0;
    let remainingLoan = 0;
    
    if (updatedEntry.loanRequestId) {
      const loan = await db.loan.findUnique({
        where: { id: updatedEntry.loanRequestId }
      });
      
      if (loan) {
        const totalInstallments = await db.passbookEntry.aggregate({
          where: {
            memberId: memberId,
            loanRequestId: loan.id,
            loanInstallment: { gt: 0 }
          },
          _sum: { loanInstallment: true }
        });
        
        const totalPaid = totalInstallments._sum.loanInstallment || 0;
        loanBalance = loan.loanAmount;
        remainingLoan = Math.max(0, loan.remainingBalance);
      }
    }

    return NextResponse.json({
      success: true,
      entry: {
        id: updatedEntry.id,
        memberId: updatedEntry.memberId,
        date: updatedEntry.transactionDate.toISOString().split('T')[0],
        deposit: updatedEntry.depositAmount || 0,
        installment: updatedEntry.loanInstallment || 0,
        interest: updatedEntry.interestAuto || 0,
        fine: updatedEntry.fineAuto || 0,
        mode: updatedEntry.mode,
        description: updatedEntry.description || '',
        balance: entryBalance,
        loanBalance: loanBalance,
        remainingLoan: remainingLoan,
        createdAt: updatedEntry.createdAt,
        updatedAt: updatedEntry.updatedAt
      },
      ledgerReversalApplied: result.data.ledgerReversalApplied,
      oldInstallmentAmount: result.data.oldInstallmentAmount,
      newInstallmentAmount: result.data.newInstallmentAmount
    });

  } catch (error) {
    console.error('Error in passbook update API:', error);
    return NextResponse.json(
      { error: 'Failed to update passbook entry' },
      { status: 500 }
    );
  }
}