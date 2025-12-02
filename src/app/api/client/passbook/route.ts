import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const whereClause: any = {};
    
    if (memberId) {
      whereClause.memberId = memberId;
    }
    
    if (from || to) {
      whereClause.transactionDate = {};
      if (from) {
        whereClause.transactionDate.gte = new Date(from);
      }
      if (to) {
        whereClause.transactionDate.lte = new Date(to);
      }
    }

    // Get total count for pagination
    const totalCount = await db.passbookEntry.count({
      where: whereClause
    });

    // Fetch passbook entries with pagination
    const entries = await db.passbookEntry.findMany({
      where: whereClause,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        loan: {
          select: {
            id: true,
            loanAmount: true,
            status: true
          }
        }
      },
      orderBy: {
        transactionDate: 'desc'
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    // Calculate running balance for each entry
    const allEntries = await db.passbookEntry.findMany({
      where: whereClause,
      orderBy: { transactionDate: 'asc' }
    });

    const balanceMap = new Map();
    let runningBalance = 0;

    allEntries.forEach(entry => {
      const deposit = entry.depositAmount || 0;
      const installment = entry.loanInstallment || 0;
      const interest = entry.interestAuto || 0;
      const fine = entry.fineAuto || 0;
      
      runningBalance = runningBalance + deposit - installment + interest + fine;
      balanceMap.set(entry.id, runningBalance);
    });

    // Get loan information for each entry
    const entriesWithBalance = await Promise.all(entries.map(async (entry) => {
      let loanBalance = 0;
      let remainingLoan = 0;

      if (entry.loanRequestId) {
        const loan = await db.loan.findUnique({
          where: { id: entry.loanRequestId }
        });

        if (loan) {
          loanBalance = loan.loanAmount;
          
          // Calculate total installments for this loan
          const totalInstallments = await db.passbookEntry.aggregate({
            where: {
              memberId: entry.memberId,
              loanRequestId: loan.id,
              loanInstallment: { gt: 0 }
            },
            _sum: { loanInstallment: true }
          });
          
          const totalPaid = totalInstallments._sum.loanInstallment || 0;
          remainingLoan = Math.max(0, loan.remainingBalance - totalPaid);
        }
      }

      return {
        id: entry.id,
        memberId: entry.memberId,
        memberName: entry.member.name,
        date: entry.transactionDate.toISOString().split('T')[0],
        deposit: entry.depositAmount || 0,
        installment: entry.loanInstallment || 0,
        interest: entry.interestAuto || 0,
        fine: entry.fineAuto || 0,
        mode: entry.mode,
        description: entry.description || '',
        balance: balanceMap.get(entry.id) || 0,
        loanBalance: loanBalance,
        remainingLoan: remainingLoan,
        loanId: entry.loanRequestId,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      };
    }));

    return NextResponse.json({
      entries: entriesWithBalance,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });

  } catch (error) {
    console.error('Error in passbook GET API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch passbook entries' },
      { status: 500 }
    );
  }
}