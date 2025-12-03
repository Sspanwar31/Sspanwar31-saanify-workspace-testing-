import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const memberId = searchParams.get('memberId');

    // If specific member is requested
    if (memberId) {
      const member = await db.member.findUnique({
        where: { id: memberId }
      });
      
      if (!member) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }

      // Get member's current balance from passbook
      const memberPassbook = await db.passbookEntry.findMany({
        where: { memberId },
        orderBy: { transactionDate: 'asc' }
      });

      // Calculate total deposits (sum of all deposits only)
      const totalDeposits = memberPassbook.reduce((sum, entry) => sum + (entry.depositAmount || 0), 0);
      
      // Calculate current balance (deposits - installments + interest + fines)
      let currentBalance = 0;
      memberPassbook.forEach(entry => {
        const depositAmt = entry.depositAmount || 0;
        const installmentAmt = entry.loanInstallment || 0;
        const interestAmt = entry.interestAuto || 0;
        const fineAmt = entry.fineAuto || 0;
        
        currentBalance = currentBalance + depositAmt - installmentAmt + interestAmt + fineAmt;
      });

      // Get active loan for the member
      const activeLoan = await db.loan.findFirst({
        where: { 
          memberId,
          status: 'active'
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({
        member: {
          id: member.id,
          name: member.name,
          phone: member.phone || '',
          email: null, // No email field in database
          joinDate: member.joiningDate,
          address: member.address || '',
          createdAt: member.createdAt,
          updatedAt: member.updatedAt
        },
        currentBalance,
        totalDeposits,
        activeLoan: activeLoan ? {
          loanId: activeLoan.id,
          outstandingBalance: activeLoan.remainingBalance,
          loanAmount: activeLoan.loanAmount,
          interestRate: activeLoan.interestRate
        } : null
      });
    }

    // Get all members from database
    let membersQuery = {
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        joiningDate: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    };

    let members = await db.member.findMany(membersQuery);

    // If search is provided, filter members
    if (search) {
      const searchLower = search.toLowerCase();
      members = members.filter(member =>
        member.name.toLowerCase().includes(searchLower) ||
        member.phone?.includes(search) ||
        member.address?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      members: members.map(member => ({
        id: member.id,
        name: member.name,
        phone: member.phone || '',
        email: null, // No email field in database
        joinDate: member.joiningDate,
        address: member.address || '',
        createdAt: member.createdAt,
        updatedAt: member.updatedAt
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, address, joinDate } = body;

    // Validate required fields
    if (!name || !address || !joinDate) {
      return NextResponse.json(
        { error: 'Name, address, and join date are required' },
        { status: 400 }
      );
    }

    // Check if member with same phone already exists (skip if phone empty)
    if (phone && phone.trim() !== '') {
      const existingMember = await db.member.findFirst({
        where: { phone }
      });

      if (existingMember) {
        return NextResponse.json(
          { error: 'Member with this phone number already exists' },
          { status: 409 }
        );
      }
    }

    // Create new member
    const newMember = await db.member.create({
      data: {
        name,
        phone: phone || null,
        address,
        joiningDate: new Date(joinDate),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      member: {
        id: newMember.id,
        name: newMember.name,
        phone: newMember.phone || '',
        email: null, // No email field in database
        joinDate: newMember.joiningDate,
        address: newMember.address,
        createdAt: newMember.createdAt,
        updatedAt: newMember.updatedAt
      }
    });

  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    );
  }
}