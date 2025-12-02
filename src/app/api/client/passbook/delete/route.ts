import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('id');
    
    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    // Get the entry before deletion to handle loan balance adjustment
    const entry = await db.passbookEntry.findUnique({
      where: { id: entryId },
      include: { loan: true }
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    const installmentAmount = entry.loanInstallment || 0;

    // Delete the passbook entry
    await db.passbookEntry.delete({
      where: { id: entryId }
    });

    // If this was an installment payment and there's an associated loan, adjust loan balance
    if (installmentAmount > 0 && entry.loanRequestId) {
      const activeLoan = await db.loan.findUnique({
        where: { id: entry.loanRequestId }
      });

      if (activeLoan) {
        // Add back the installment amount to the remaining balance
        const newRemainingBalance = activeLoan.remainingBalance + installmentAmount;
        
        await db.loan.update({
          where: { id: activeLoan.id },
          data: { 
            remainingBalance: newRemainingBalance,
            // If loan was completed, reactivate it
            ...(activeLoan.status === 'completed' && newRemainingBalance > 0 && { status: 'active' })
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Entry deleted successfully'
    });

  } catch (error) {
    console.error('Error in passbook delete API:', error);
    return NextResponse.json(
      { error: 'Failed to delete passbook entry' },
      { status: 500 }
    );
  }
}