import { NextRequest, NextResponse } from 'next/server';
import { LoanService } from '@/lib/services/loan.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const includeClosed = searchParams.get('includeClosed') === 'true';

    let loans;

    if (memberId) {
      // Get loans for specific member
      loans = await LoanService.getMemberLoans(memberId, includeClosed);
    } else {
      // Get all active loans (for admin dashboard)
      loans = includeClosed ? 
        await LoanService.getMemberLoans('', true) : // This would need to be implemented
        await LoanService.getActiveLoans();
    }

    // Format response and calculate additional details
    const formattedLoans = await Promise.all(loans.map(async (loan) => {
      // Calculate EMI if not present
      const emi = loan.loanAmount && loan.interestRate ? 
        calculateEMI(loan.loanAmount, loan.interestRate, 12) : 0;

      // FIXED: Calculate total paid from passbook entries with REAL-TIME data
      // This ensures we have the most up-to-date payment information
      const totalPaid = loan.passbookEntries?.reduce((sum, entry) => {
        return sum + (entry.loanInstallment || 0);
      }, 0) || 0;

      const totalInterestEarned = loan.passbookEntries?.reduce((sum, entry) => {
        return sum + (entry.interestAuto || 0);
      }, 0) || 0;

      const paidCount = loan.passbookEntries?.filter(entry => 
        entry.loanInstallment && entry.loanInstallment > 0
      ).length || 0;

      // CRITICAL FIX: Use real-time remainingBalance from database
      // This ensures consistency between Add Entry Modal and All Loans Table
      const realTimeRemainingBalance = loan.remainingBalance || 0;

      return {
        id: loan.id,
        memberId: loan.memberId,
        memberName: loan.member?.name || 'Unknown',
        memberPhone: loan.member?.phone || '',
        memberAddress: loan.member?.address || '',
        amount: loan.loanAmount,
        interest: loan.interestRate,
        duration: 12, // Default duration, you can store this in DB
        emi: emi,
        status: loan.status,
        startDate: loan.loanDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        endDate: calculateEndDate(loan.loanDate, 12),
        // FIXED: Use real-time balance from database for consistency
        remainingBalance: realTimeRemainingBalance,
        loanBalance: loan.loanAmount, // Add this field
        paidInstallments: paidCount,
        totalInstallments: 12,
        totalInterestEarned: totalInterestEarned,
        description: loan.description || `Loan of ₹${loan.loanAmount.toFixed(2)}`,
        created_at: loan.createdAt?.toISOString(),
        updated_at: loan.updatedAt?.toISOString(),
        nextDueDate: loan.nextDueDate?.toISOString().split('T')[0],
        // Add debug info for troubleshooting
        debugInfo: {
          totalPaidFromEntries: totalPaid,
          loanAmountMinusPaid: loan.loanAmount - totalPaid,
          databaseRemainingBalance: realTimeRemainingBalance,
          calculatedRemainingBalance: Math.max(0, loan.loanAmount - totalPaid)
        }
      };
    }));

    return NextResponse.json({
      success: true,
      loans: formattedLoans,
      count: formattedLoans.length,
      // Add timestamp to indicate real-time data
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loans' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (!principal || !annualRate || !tenureMonths) return 0;
  
  const monthlyRate = annualRate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
}

function calculateEndDate(startDate: Date | null | undefined, tenureMonths: number): string {
  if (!startDate) return new Date().toISOString().split('T')[0];
  
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + tenureMonths);
  return endDate.toISOString().split('T')[0];
}