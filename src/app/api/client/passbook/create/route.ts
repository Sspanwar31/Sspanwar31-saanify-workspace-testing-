import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
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

    if (!deposit && !installment) {
      return NextResponse.json(
        { error: 'Either deposit or installment must be provided' },
        { status: 400 }
      );
    }

    // Get member's current active loan
    const activeLoan = await db.loan.findFirst({
      where: {
        memberId: memberId,
        status: 'active'
      },
      orderBy: {
        createdAt: 'desc'
      }
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

    // Create passbook entry
    const passbookEntry = await db.passbookEntry.create({
      data: {
        memberId: memberId,
        depositAmount: deposit || 0,
        loanInstallment: installment || 0,
        interestAuto: calculatedInterest,
        fineAuto: calculatedFine,
        mode: mode,
        loanRequestId: activeLoan?.id,
        description: note || '',
        transactionDate: new Date(date),
      }
    });

    // If there's an installment payment, update the loan remaining balance
    if (installment && installment > 0 && activeLoan) {
      const newRemainingBalance = Math.max(0, activeLoan.remainingBalance - installment);
      
      await db.loan.update({
        where: { id: activeLoan.id },
        data: { 
          remainingBalance: newRemainingBalance,
          // If loan is fully paid, update status
          ...(newRemainingBalance === 0 && { status: 'completed' })
        }
      });
    }

    // Calculate new member balance
    const allEntries = await db.passbookEntry.findMany({
      where: { memberId: memberId },
      orderBy: { transactionDate: 'asc' }
    });

    let runningBalance = 0;
    allEntries.forEach(entry => {
      const depositAmt = entry.depositAmount || 0;
      const installmentAmt = entry.loanInstallment || 0;
      const interestAmt = entry.interestAuto || 0;
      const fineAmt = entry.fineAuto || 0;
      
      runningBalance = runningBalance + depositAmt - installmentAmt + interestAmt + fineAmt;
    });

    // Get updated loan status
    let loanBalance = 0;
    let remainingLoan = 0;
    
    if (activeLoan) {
      const totalInstallments = await db.passbookEntry.aggregate({
        where: {
          memberId: memberId,
          loanRequestId: activeLoan.id,
          loanInstallment: { gt: 0 }
        },
        _sum: { loanInstallment: true }
      });
      
      const totalPaid = totalInstallments._sum.loanInstallment || 0;
      loanBalance = activeLoan.loanAmount;
      remainingLoan = Math.max(0, activeLoan.remainingBalance - totalPaid);
    }

    return NextResponse.json({
      success: true,
      entry: {
        id: passbookEntry.id,
        memberId: passbookEntry.memberId,
        date: passbookEntry.transactionDate.toISOString().split('T')[0],
        deposit: passbookEntry.depositAmount || 0,
        installment: passbookEntry.loanInstallment || 0,
        interest: passbookEntry.interestAuto || 0,
        fine: passbookEntry.fineAuto || 0,
        mode: passbookEntry.mode,
        description: passbookEntry.description || '',
        balance: runningBalance,
        loanBalance: loanBalance,
        remainingLoan: remainingLoan,
        createdAt: passbookEntry.createdAt,
        updatedAt: passbookEntry.updatedAt
      }
    });

  } catch (error) {
    console.error('Error in passbook create API:', error);
    return NextResponse.json(
      { error: 'Failed to create passbook entry' },
      { status: 500 }
    );
  }
}