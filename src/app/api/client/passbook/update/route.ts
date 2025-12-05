import { NextRequest, NextResponse } from 'next/server';
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

    // Get the original entry to see what changed
    const originalEntry = await db.passbookEntry.findUnique({
      where: { id: entryId },
      include: { loan: true }
    });

    if (!originalEntry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Get active loan for auto-calculation
    const activeLoan = await db.loan.findFirst({
      where: {
        memberId: memberId,
        status: 'active'
      },
      orderBy: { createdAt: 'desc' }
    });

    // Auto-calculate interest and fine if not provided or zero
    let calculatedInterest = interest || 0;
    let calculatedFine = fine || 0;
    
    if (activeLoan && (interest === 0 || fine === 0)) {
      // Calculate interest: 1% of outstanding loan
      if (interest === 0) {
        calculatedInterest = Math.round((activeLoan.remainingBalance * 0.01) * 100) / 100;
      }
      
      // Calculate fine: ₹10 per day after 15th of month
      if (fine === 0) {
        const depositDateObj = new Date(date);
        const dayOfMonth = depositDateObj.getDate();
        const daysLate = Math.max(0, dayOfMonth - 15);
        calculatedFine = daysLate * 10;
      }
    }

    const originalInstallment = originalEntry.loanInstallment || 0;
    const installmentDifference = (installment || 0) - originalInstallment;

    // Update passbook entry
    const updatedEntry = await db.passbookEntry.update({
      where: { id: entryId },
      data: {
        depositAmount: deposit || 0,
        loanInstallment: installment || 0,
        interestAuto: calculatedInterest,
        fineAuto: calculatedFine,
        mode: mode,
        description: note || '',
        transactionDate: new Date(date),
      }
    });

    // If installment amount changed and there's an associated loan, update loan balance
    if (installmentDifference !== 0 && originalEntry.loanRequestId) {
      const activeLoan = await db.loan.findUnique({
        where: { id: originalEntry.loanRequestId }
      });

      if (activeLoan) {
        // Calculate new remaining balance
        // Since we're updating an installment, we need to adjust the remaining balance
        const newRemainingBalance = Math.max(0, activeLoan.remainingBalance - installmentDifference);
        
        await db.loan.update({
          where: { id: activeLoan.id },
          data: { 
            remainingBalance: newRemainingBalance,
            // If loan is fully paid, update status
            ...(newRemainingBalance === 0 && { status: 'completed' })
          }
        });
      }
    }

    // Calculate balance - CURRENT ENTRY ONLY
    // As per requirement: NEW BALANCE = इस entry में user ने जो भरा है उनका total
    const currentEntryTotal = (deposit || 0) + (installment || 0) + calculatedInterest + calculatedFine;
    const entryBalance = currentEntryTotal;

    // Get updated loan status
    let loanBalance = 0;
    let remainingLoan = 0;
    
    if (originalEntry.loanRequestId) {
      const loan = await db.loan.findUnique({
        where: { id: originalEntry.loanRequestId }
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
        remainingLoan = Math.max(0, loan.remainingBalance - totalPaid);
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
      }
    });

  } catch (error) {
    console.error('Error in passbook update API:', error);
    return NextResponse.json(
      { error: 'Failed to update passbook entry' },
      { status: 500 }
    );
  }
}