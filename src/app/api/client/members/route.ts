import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { membersData } from '@/data/membersData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const memberId = searchParams.get('memberId');

    // If specific member is requested
    if (memberId) {
      const member = membersData.find(m => m.id === memberId);
      if (!member) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }

      // Get member's current balance from passbook
      const memberPassbook = await db.passbookEntry.findMany({
        where: { memberId },
        orderBy: { transactionDate: 'asc' }
      });

      const currentBalance = memberPassbook.length > 0 
        ? memberPassbook[memberPassbook.length - 1]?.depositAmount || 0
        : 0;

      // Get active loan for the member
      const activeLoan = await db.loan.findFirst({
        where: { 
          memberId,
          status: 'active'
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({
        member,
        currentBalance,
        activeLoan: activeLoan ? {
          loanId: activeLoan.id,
          outstandingBalance: activeLoan.remainingBalance,
          loanAmount: activeLoan.loanAmount,
          interestRate: activeLoan.interestRate
        } : null
      });
    }

    // If search is provided, filter members
    let filteredMembers = membersData;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMembers = membersData.filter(member =>
        member.name.toLowerCase().includes(searchLower) ||
        member.phone.includes(search) ||
        member.email?.toLowerCase().includes(searchLower)
      );
    }

    // Only return active members for dropdown
    const activeMembers = filteredMembers.filter(member => member.status === 'active');

    return NextResponse.json({
      members: activeMembers.map(member => ({
        id: member.id,
        name: member.name,
        phone: member.phone,
        email: member.email,
        status: member.status
      }))
    });

  } catch (error) {
    console.error('Error in members API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}