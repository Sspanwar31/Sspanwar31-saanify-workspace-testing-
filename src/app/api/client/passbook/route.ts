import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/lib/services/transaction.service';
import { LoanService } from '@/lib/services/loan.service';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100); // Limit max page size
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // If no memberId provided, return ALL entries for global view (admin view)
    if (!memberId) {
      console.log(`📋 Fetching ALL passbook entries (global view), page: ${page}, pageSize: ${pageSize}`);
      
      // Get all passbook entries with member and loan details
      const allEntries = await db.passbookEntry.findMany({
        include: { 
          member: true, // MUST include member details to show names
          loan: true 
        },
        orderBy: { transactionDate: 'desc' }
      });

      console.log(`📊 Retrieved ${allEntries.length} total entries for global view`);

      // Apply date filtering if provided
      let filteredEntries = allEntries;
      if (from || to) {
        filteredEntries = allEntries.filter(entry => {
          const entryDate = new Date(entry.transactionDate);
          if (from && entryDate < new Date(from)) return false;
          if (to && entryDate > new Date(to)) return false;
          return true;
        });
      }

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const paginatedEntries = filteredEntries.slice(startIndex, startIndex + pageSize);

      console.log(`📄 Returning ${paginatedEntries.length} entries for page ${page} (global view)`);

      // Format response for global view
      const entriesWithBalance = paginatedEntries.map(entry => {
        const deposit = entry.depositAmount || 0;
        const installment = entry.loanInstallment || 0;
        const interest = entry.interestAuto || 0;
        const fine = entry.fineAuto || 0;
        
        // Calculate balance for this entry: Deposit + Installment + Interest + Fine
        let balance = deposit + installment + interest + fine;
        
        // Ensure balance is never negative
        balance = Math.max(0, balance);

        return {
          id: entry.id,
          memberId: entry.memberId,
          memberName: entry.member?.name || 'Unknown',
          date: entry.transactionDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          deposit: deposit,
          installment: installment,
          interest: interest,
          fine: fine,
          mode: entry.mode || 'CASH',
          description: entry.description || '',
          balance: balance,
          loanBalance: entry.loan?.loanAmount || 0,
          remainingLoan: entry.loan?.remainingBalance || 0,
          loanId: entry.loanRequestId,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt
        };
      });

      // Calculate global summary statistics
      const globalSummary = {
        totalDeposits: filteredEntries.reduce((sum, entry) => sum + (entry.depositAmount || 0), 0),
        totalInstallments: filteredEntries.reduce((sum, entry) => sum + (entry.loanInstallment || 0), 0),
        totalInterest: filteredEntries.reduce((sum, entry) => sum + (entry.interestAuto || 0), 0),
        totalFines: filteredEntries.reduce((sum, entry) => sum + (entry.fineAuto || 0), 0),
        uniqueMembers: new Set(filteredEntries.map(entry => entry.memberId)).size,
        activeLoans: filteredEntries.filter(entry => entry.loanRequestId).length
      };

      const response = {
        entries: entriesWithBalance,
        pagination: {
          page,
          pageSize,
          totalCount: filteredEntries.length,
          totalPages: Math.ceil(filteredEntries.length / pageSize)
        },
        summary: globalSummary,
        isGlobalView: true
      };

      console.log(`✅ Successfully returning global passbook data with ${entriesWithBalance.length} entries`);
      return NextResponse.json(response);
    }

    // Original single member view logic continues below...
    console.log(`📋 Fetching passbook for member: ${memberId}, page: ${page}, pageSize: ${pageSize}`);

    // Get transaction history using TransactionService with reasonable limit
    const transactions = await TransactionService.getTransactionHistory(memberId, pageSize);
    
    // Get current balance
    const currentBalance = await TransactionService.getCurrentBalance(memberId);
    
    // Get active loan information
    const activeLoans = await LoanService.getMemberLoans(memberId, false);
    const activeLoan = activeLoans.length > 0 ? activeLoans[0] : null;

    console.log(`📊 Retrieved ${transactions.length} transactions, active loan: ${activeLoan ? 'yes' : 'no'}`);

    // Apply date filtering if provided
    let filteredTransactions = transactions;
    if (from || to) {
      filteredTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.transactionDate);
        if (from && transactionDate < new Date(from)) return false;
        if (to && transactionDate > new Date(to)) return false;
        return true;
      });
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

    console.log(`📄 Returning ${paginatedTransactions.length} transactions for page ${page}`);

    // Format response with additional calculations
    const entriesWithBalance = await Promise.all(paginatedTransactions.map(async (transaction) => {
      const deposit = transaction.depositAmount || 0;
      const installment = transaction.loanInstallment || 0;
      const interest = transaction.interestAuto || 0;
      const fine = transaction.fineAuto || 0;
      
      // Calculate balance for this entry: Deposit + Installment + Interest + Fine
      let balance = deposit + installment + interest + fine;
      
      // Ensure balance is never negative
      balance = Math.max(0, balance);

      // Get loan information if this transaction is linked to a loan
      let loanBalance = 0;
      let remainingLoan = 0;
      let loanId = transaction.loanRequestId;

      if (loanId && activeLoan && activeLoan.id === loanId) {
        // Use active loan information
        loanBalance = activeLoan.loanAmount;
        remainingLoan = activeLoan.remainingBalance;
      } else if (loanId) {
        // Find the loan associated with this transaction
        const associatedLoan = activeLoans.find(loan => loan.id === loanId);
        if (associatedLoan) {
          loanBalance = associatedLoan.loanAmount;
          remainingLoan = associatedLoan.remainingBalance;
        }
      }

      return {
        id: transaction.id,
        memberId: transaction.memberId,
        memberName: transaction.member?.name || 'Unknown',
        date: transaction.transactionDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        deposit: deposit,
        installment: installment,
        interest: interest,
        fine: fine,
        mode: transaction.mode || 'CASH',
        description: transaction.description || '',
        balance: balance,
        loanBalance: loanBalance,
        remainingLoan: remainingLoan,
        loanId: loanId,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      };
    }));

    const response = {
      entries: entriesWithBalance,
      pagination: {
        page,
        pageSize,
        totalCount: filteredTransactions.length,
        totalPages: Math.ceil(filteredTransactions.length / pageSize)
      },
      summary: {
        currentBalance,
        activeLoanBalance: activeLoan?.remainingBalance || 0,
        totalDeposits: await TransactionService.getTotalDeposits(memberId),
        totalInstallments: await TransactionService.getTotalInstallments(memberId),
        activeLoanAmount: activeLoan?.loanAmount || 0,
        activeLoanId: activeLoan?.id || null
      }
    };

    console.log(`✅ Successfully returning passbook data with ${entriesWithBalance.length} entries`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in passbook GET API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch passbook entries: ' + error.message },
      { status: 500 }
    );
  }
}