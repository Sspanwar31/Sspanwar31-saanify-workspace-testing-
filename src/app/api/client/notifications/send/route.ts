import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId, loanId, notificationType, message } = body;

    if (!memberId || !notificationType || !message) {
      return NextResponse.json(
        { error: 'Member ID, notification type, and message are required' },
        { status: 400 }
      );
    }

    // Create notification entry in passbook
    await db.passbookEntry.create({
      data: {
        memberId: memberId,
        loanRequestId: loanId,
        depositAmount: 0,
        loanInstallment: 0,
        interestAuto: 0,
        fineAuto: 0,
        mode: 'Notification',
        description: message,
        transactionDate: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}