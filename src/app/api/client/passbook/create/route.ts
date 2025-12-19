import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/lib/services/transaction.service';

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

    // FIXED: Handle mixed transactions (both deposit and installment in same entry)
    // Now creates a SINGLE database record instead of two separate records
    if (deposit && installment && deposit > 0 && installment > 0) {
      console.log(`🔥 MIXED TRANSACTION: Deposit ₹${deposit} + Installment ₹${installment}`)
      
      // Create a SINGLE transaction record with both deposit and installment
      const result = await TransactionService.createEntry({
        memberId,
        type: 'MIXED',
        amount: deposit + installment, // Total amount for reference
        description: note || 'Mixed transaction (Deposit + Installment)',
        mode,
        transactionDate: new Date(date),
        // Mixed transaction specific fields
        depositAmount: deposit,
        installmentAmount: installment
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error, message: result.message },
          { status: 400 }
        );
      }

      console.log(`   ✅ Mixed transaction created: ${result.data.passbookEntry.id}`)

      // Get current balance and loan information
      const currentBalance = await TransactionService.getCurrentBalance(memberId);
      const activeLoan = await (await import('@/lib/services/loan.service')).LoanService.getMemberLoans(memberId, false);
      const currentLoan = activeLoan.length > 0 ? activeLoan[0] : null;

      // CRITICAL FIX: Get real-time updated loan information
      // This ensures frontend gets most current loan balance after transaction
      let updatedLoanBalance = 0;
      if (currentLoan?.id) {
        const freshLoanData = await (await import('@/lib/db')).db.loan.findUnique({
          where: { id: currentLoan.id }
        });
        updatedLoanBalance = freshLoanData?.remainingBalance || 0;
      }

      return NextResponse.json({
        success: true,
        entry: {
          id: result.data.passbookEntry.id, // Single entry ID
          memberId: result.data.passbookEntry.memberId,
          date: result.data.passbookEntry.transactionDate?.toISOString().split('T')[0] || date,
          // Both values in the SAME record
          deposit: result.data.passbookEntry.depositAmount || 0,
          installment: result.data.passbookEntry.loanInstallment || 0,
          interest: result.data.passbookEntry.interestAuto || 0,
          fine: result.data.passbookEntry.fineAuto || 0,
          mode: mode,
          description: note || '',
          balance: currentBalance,
          loanBalance: currentLoan?.loanAmount || 0,
          // CRITICAL FIX: Use real-time updated loan balance
          remainingLoan: updatedLoanBalance,
          loanId: currentLoan?.id || null,
          createdAt: result.data.passbookEntry.createdAt,
          updatedAt: result.data.passbookEntry.updatedAt,
          // Fixed: Single transaction created
          transactionsCreated: 1,
          // Add debug info for troubleshooting
          debugInfo: {
            originalLoanBalance: currentLoan?.remainingBalance || 0,
            updatedLoanBalance: updatedLoanBalance,
            loanUpdated: result.data.loanUpdated,
            mixedTransaction: result.data.mixedTransaction,
            depositAmount: result.data.depositAmount,
            installmentAmount: result.data.installmentAmount
          }
        },
        message: 'Mixed transaction (Deposit + Installment) created successfully as single record',
        // Add timestamp to indicate real-time data
        timestamp: new Date().toISOString()
      });
    }

    // Handle single transaction type (existing logic)
    let transactionType: 'DEPOSIT' | 'INSTALLMENT' | 'FINE' | 'OTHER' = 'OTHER';
    let amount = 0;

    if (deposit && deposit > 0) {
      transactionType = 'DEPOSIT';
      amount = deposit;
    } else if (installment && installment > 0) {
      transactionType = 'INSTALLMENT';
      amount = installment;
    }

    if (fine && fine > 0) {
      transactionType = 'FINE';
      amount = fine;
    }

    // Use TransactionService to create entry with proper business logic
    const result = await TransactionService.createEntry({
      memberId,
      type: transactionType,
      amount,
      description: note || `${transactionType} transaction`,
      mode,
      transactionDate: new Date(date)
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 400 }
      );
    }

    // Use actual created entry from TransactionService result
    const createdEntry = result.data.passbookEntry;
    
    // Get current balance and loan information
    const currentBalance = await TransactionService.getCurrentBalance(memberId);
    
    // Get active loan information
    const activeLoan = await (await import('@/lib/services/loan.service')).LoanService.getMemberLoans(memberId, false);
    const currentLoan = activeLoan.length > 0 ? activeLoan[0] : null;

    // CRITICAL FIX: Get real-time updated loan information
    // This ensures frontend gets most current loan balance after transaction
    let updatedLoanBalance = 0;
    if (currentLoan?.id) {
      const freshLoanData = await (await import('@/lib/db')).db.loan.findUnique({
        where: { id: currentLoan.id }
        });
      updatedLoanBalance = freshLoanData?.remainingBalance || 0;
    }

    return NextResponse.json({
      success: true,
      entry: {
        id: createdEntry.id,
        memberId: createdEntry.memberId,
        date: createdEntry.transactionDate?.toISOString().split('T')[0] || date,
        deposit: createdEntry.depositAmount || 0,
        installment: createdEntry.loanInstallment || 0,
        interest: createdEntry.interestAuto || 0,
        fine: createdEntry.fineAuto || 0,
        mode: createdEntry.mode || mode,
        description: createdEntry.description || note || '',
        balance: currentBalance,
        loanBalance: currentLoan?.loanAmount || 0,
        // CRITICAL FIX: Use real-time updated loan balance
        remainingLoan: updatedLoanBalance,
        loanId: createdEntry.loanRequestId || null,
        createdAt: createdEntry.createdAt,
        updatedAt: createdEntry.updatedAt
      },
      message: result.message,
      // Add timestamp to indicate real-time data
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in passbook create API:', error);
    return NextResponse.json(
      { error: 'Failed to create passbook entry' },
      { status: 500 }
    );
  }
}