import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get all loans with member information
    const loans = await db.loan.findMany({
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format response and calculate additional details
    const formattedLoans = await Promise.all(loans.map(async (loan) => {
      // Calculate paid installments for this loan
      const paidInstallmentsResult = await db.passbookEntry.aggregate({
        where: {
          loanRequestId: loan.id,
          loanInstallment: {
            gt: 0
          }
        },
        _sum: {
          loanInstallment: true
        },
        _count: {
          id: true
        }
      });

      const totalPaid = paidInstallmentsResult._sum.loanInstallment || 0;
      const paidCount = paidInstallmentsResult._count.id || 0;
      
      // Calculate EMI if not present
      const emi = loan.loanAmount && loan.interestRate ? 
        calculateEMI(loan.loanAmount, loan.interestRate, 12) : 0;

      return {
        id: loan.id,
        memberId: loan.memberId,
        memberName: loan.member.name,
        memberPhone: loan.member.phone,
        memberAddress: loan.member.address,
        amount: loan.loanAmount,
        interest: loan.interestRate,
        duration: 12, // Default duration, you can store this in DB
        emi: emi,
        status: loan.status,
        startDate: loan.loanDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        endDate: calculateEndDate(loan.loanDate, 12),
        remainingBalance: Math.max(0, loan.remainingBalance - totalPaid),
        paidInstallments: paidCount,
        totalInstallments: 12,
        description: `Loan of ₹${loan.loanAmount.toFixed(2)}`,
        created_at: loan.createdAt.toISOString(),
        updated_at: loan.updatedAt.toISOString()
      };
    }));

    return NextResponse.json({
      success: true,
      loans: formattedLoans,
      count: formattedLoans.length
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

function calculateEndDate(startDate: Date | null, tenureMonths: number): string {
  if (!startDate) return new Date().toISOString().split('T')[0];
  
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + tenureMonths);
  return endDate.toISOString().split('T')[0];
}