import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Params Helper for Next.js 15
type RouteParams = { params: Promise<{ memberId: string }> };

// 1. GET Method
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params;
    
    // Find member
    const member = await db.member.findUnique({
      where: { id: memberId }
    });

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    // Calculate total deposits from passbook entries
    // GOLDEN RULE: Sum ALL depositAmount values regardless of entry type
    // Even if entry type is 'INSTALLMENT' or 'MIXED', if depositAmount > 0, count it
    const depositAggregation = await db.passbookEntry.aggregate({
      where: { 
        memberId,
        depositAmount: {
          gt: 0
        }
      },
      _sum: {
        depositAmount: true
      }
    });
    
    const totalDeposits = depositAggregation._sum.depositAmount || 0;
    
    // Calculate other totals
    const installmentAggregation = await db.passbookEntry.aggregate({
      where: { 
        memberId,
        loanInstallment: {
          gt: 0
        }
      },
      _sum: {
        loanInstallment: true
      }
    });
    
    const totalInstallments = installmentAggregation._sum.loanInstallment || 0;
    
    const interestAggregation = await db.passbookEntry.aggregate({
      where: { 
        memberId,
        interestAuto: {
          gt: 0
        }
      },
      _sum: {
        interestAuto: true
      }
    });
    
    const totalInterest = interestAggregation._sum.interestAuto || 0;
    
    const fineAggregation = await db.passbookEntry.aggregate({
      where: { 
        memberId,
        fineAuto: {
          gt: 0
        }
      },
      _sum: {
        fineAuto: true
      }
    });
    
    const totalFines = fineAggregation._sum.fineAuto || 0;
    
    // Current balance = totalDeposits - totalInstallments + totalInterest + totalFines
    const currentBalance = totalDeposits - totalInstallments + totalInterest + totalFines;

    console.log(`🔍 MEMBER DETAILS API DEBUG:`)
    console.log(`   Member ID: ${memberId}`)
    console.log(`   Total Deposits (ALL depositAmount): ₹${totalDeposits}`)
    console.log(`   Total Installments: ₹${totalInstallments}`)
    console.log(`   Total Interest: ₹${totalInterest}`)
    console.log(`   Total Fines: ₹${totalFines}`)
    console.log(`   Current Balance: ₹${currentBalance}`)

    // Find active loan
    const activeLoan = await db.loan.findFirst({
      where: {
        memberId: memberId,
        status: 'active'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // CRITICAL FIX: Use remainingBalance directly from Loan model
    // Do NOT recalculate manually - this was causing the sync issue
    let outstandingBalance = 0;
    if (activeLoan) {
      // FIXED: Return actual remainingBalance from loan table
      // This ensures consistency with "All Loans" table
      outstandingBalance = activeLoan.remainingBalance;
      
      console.log(`🔍 MEMBER DETAILS API DEBUG:`)
      console.log(`   Active Loan ID: ${activeLoan.id}`)
      console.log(`   Loan Amount: ₹${activeLoan.loanAmount}`)
      console.log(`   Remaining Balance (from DB): ₹${activeLoan.remainingBalance}`)
      console.log(`   Outstanding Balance (returned): ₹${outstandingBalance}`)
    }

    return NextResponse.json({ 
      member: {
        id: member.id,
        name: member.name,
        phone: member.phone || '',
        address: member.address || '',
        joiningDate: member.joiningDate.toISOString(),
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
      },
      currentBalance: currentBalance,
      totalDeposits: totalDeposits,
      activeLoan: activeLoan ? {
        loanId: activeLoan.id,
        // CRITICAL FIX: Use remainingBalance directly from Loan model
        outstandingBalance: outstandingBalance,
        loanAmount: activeLoan.loanAmount,
        interestRate: activeLoan.interestRate
      } : null
    });

  } catch (error) {
    console.error('Error fetching member details:', error);
      return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
  }

// 2. PUT Method (Updated with Safety Checks)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params;
    
    // Body ko parse karein
    const body = await request.json();
    console.log("📥 PUT Received Body:", body); // Terminal me check karein ye kya aa raha hai

    // Destructure fields, ignoring id field from frontend
    const { name, phone, address, joinDate, id: frontendId, email } = body;

    if (!memberId) return NextResponse.json({ error: 'ID missing' }, { status: 400 });

    // 1. Validate Date (Sabse main crash point yehi hota hai)
    let validJoiningDate = undefined;
    if (joinDate) {
        const d = new Date(joinDate);
        if (!isNaN(d.getTime())) {
            validJoiningDate = d;
        } else {
            console.error("❌ Invalid Date Received:", joinDate);
            // Agar date invalid hai, to hum purani date hi rehne ya undefined
            // Agar date invalid hai, to hum purani date hi rehne
            // Agar date invalid hai, to hum purani date hi rehne
        }
    }

    // 2. Check Existance
    const existingMember = await db.member.findUnique({ where: { id: memberId } });
    if (!existingMember) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    // 3. Check Phone Duplicate
    if (phone && phone !== existingMember.phone) {
      const duplicate = await db.member.findFirst({
        where: { phone, id: { not: memberId } }
      });
      if (duplicate) return NextResponse.json({ error: 'Phone already in use' }, { status: 409 });
    }

    // 4. Update Operation - NOTE: Member model has no email field, so we ignore it
    const updatedMember = await db.member.update({
      where: { id: memberId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(address !== undefined && { address }),
        // Sirf tab update karein jab date valid ho
        ...(validJoiningDate && { joiningDate: validJoiningDate }),
        updatedAt: new Date()
      }
    });

    console.log("✅ Update Success:", updatedMember.id);
    return NextResponse.json({ 
      success: true, 
      member: {
        ...updatedMember,
        joiningDate: updatedMember.joiningDate.toISOString(),
        createdAt: updatedMember.createdAt.toISOString(),
        updatedAt: updatedMember.updatedAt.toISOString(),
      }
    });

  } catch (error) {
    console.error("💥 PUT CRASH ERROR:", error); // Ye line sabse zaroori hai
    // Error object ko string me convert karke bhejein taaki frontend pe dikhe
    // Error object ko string me convert karke bhejein taaki frontend pe dikhe
    return NextResponse.json({ 
      error: 'Update Failed', 
      details: error instanceof Error ? error.message : 'Unknown Server Error' 
    }, { status: 500 });
    }
  }

// 3. DELETE Method
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params;
    console.log("🗑️ DELETE Request for ID:", memberId);

    if (!memberId) {
      return NextResponse.json({ error: 'ID is missing' }, { status: 400 });
    }

    // Check if member exists
    const member = await db.member.findUnique({ where: { id: memberId } });
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check for active loans
    const activeLoans = await db.loan.findMany({ where: { memberId, status: 'active' } });
    if (activeLoans.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete member with active loans',
        activeLoans: activeLoans.map(loan => ({ id: loan.id, amount: loan.loanAmount }))
      }, { status: 400 });
    }

    // Perform deletion in a transaction
    console.log("🔄 Starting transaction to delete member and related data...");
    
    const result = await db.$transaction(async (tx) => {
      // Delete related passbook entries first
      const deletedPassbookEntries = await tx.passbookEntry.deleteMany({ 
        where: { memberId } 
      });
      console.log(`📝 Deleted ${deletedPassbookEntries.count} passbook entries`);

      // Delete related notifications
      const deletedNotifications = await tx.notification.deleteMany({ 
        where: { memberId } 
      });
      console.log(`🔔 Deleted ${deletedNotifications.count} notifications`);

      // Delete related maturity records
      const deletedMaturityRecords = await tx.maturityRecord.deleteMany({ 
        where: { memberId } 
      });
      console.log(`📅 Deleted ${deletedMaturityRecords.count} maturity records`);

      // Delete any related loans (should be none if active loans check passed)
      const deletedLoans = await tx.loan.deleteMany({ 
        where: { memberId } 
      });
      console.log(`💰 Deleted ${deletedLoans.count} loans`);

      // Finally delete the member
      const deletedMember = await tx.member.delete({ 
        where: { id: memberId } 
      });
      console.log(`👤 Deleted member: ${deletedMember.name}`);

      return {
        deletedMember,
        deletedCounts: {
          passbookEntries: deletedPassbookEntries.count,
          notifications: deletedNotifications.count,
          maturityRecords: deletedMaturityRecords.count,
          loans: deletedLoans.count
        }
      };
    });

    console.log("✅ Transaction completed successfully");
    
    return NextResponse.json({ 
      success: true, 
      message: 'Member and all related data deleted successfully',
      deletedMemberId: result.deletedMember.id,
      deletedMemberName: result.deletedMember.name,
      deletedCounts: result.deletedCounts
    });

  } catch (error) {
    console.error("💥 DELETE Error:", error);
    console.error("Error details:", error instanceof Error ? error.message : 'Unknown error');
    
    // Check for specific database constraint errors
    if (error instanceof Error) {
      if (error.message.includes('record to delete does not exist')) {
        return NextResponse.json({ error: 'Member not found or already deleted' }, { status: 404 });
      }
      if (error.message.includes('FOREIGN KEY constraint failed')) {
        return NextResponse.json({ 
          error: 'Cannot delete member due to database constraints. Please check for related records.' 
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to delete member', 
      details: error instanceof Error ? error.message : 'Unknown server error' 
    }, { status: 500 });
  }
}