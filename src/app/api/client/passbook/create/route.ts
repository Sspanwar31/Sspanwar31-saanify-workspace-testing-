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

    // Validation
    if (!memberId || !date || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: memberId, date, mode' },
        { status: 400 }
      );
    }

    if ((deposit || 0) < 0 || (installment || 0) < 0) {
      return NextResponse.json(
        { error: 'Deposit and installment amounts must be non-negative' },
        { status: 400 }
      );
    }

    if ((!deposit || deposit === 0) && (!installment || installment === 0)) {
      return NextResponse.json(
        { error: 'Either deposit or installment amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Verify member exists
    const member = await db.member.findUnique({
      where: { id: memberId }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Calculate new running balance
    const lastEntry = await db.passbookEntry.findFirst({
      where: { memberId },
      orderBy: { transactionDate: 'desc' }
    });

    const previousBalance = lastEntry?.depositAmount || 0;
    const newBalance = previousBalance + (deposit || 0) - (installment || 0) + (interest || 0) + (fine || 0);

    // Create new passbook entry
    const newEntry = await db.passbookEntry.create({
      data: {
        memberId,
        depositAmount: deposit || null,
        loanInstallment: installment || null,
        interestAuto: interest || null,
        fineAuto: fine || null,
        mode,
        transactionDate: new Date(date),
        description: note || null
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    // Return response with calculated balance
    const responseEntry = {
      id: newEntry.id,
      memberId: newEntry.memberId,
      memberName: newEntry.member.name,
      date: newEntry.transactionDate.toISOString().split('T')[0],
      deposit: newEntry.depositAmount || 0,
      installment: newEntry.loanInstallment || 0,
      interest: newEntry.interestAuto || 0,
      fine: newEntry.fineAuto || 0,
      mode: newEntry.mode,
      description: newEntry.description || '',
      balance: newBalance,
      createdAt: newEntry.createdAt,
      updatedAt: newEntry.updatedAt
    };

    return NextResponse.json({
      success: true,
      entry: responseEntry,
      message: 'Passbook entry created successfully'
    });

  } catch (error) {
    console.error('Error in passbook create API:', error);
    return NextResponse.json(
      { error: 'Failed to create passbook entry' },
      { status: 500 }
    );
  }
}