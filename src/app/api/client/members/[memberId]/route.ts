import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Params Helper for Next.js 15
type RouteParams = { params: Promise<{ memberId: string }> };

// 1. GET Method
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params;
    const member = await db.member.findUnique({
      where: { id: memberId },
      include: { loans: { where: { status: 'active' } } }
    });

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    return NextResponse.json({ 
        member: {
            ...member,
            joiningDate: member.joiningDate.toISOString(),
            createdAt: member.createdAt.toISOString(),
            updatedAt: member.updatedAt.toISOString(),
        } 
    });
  } catch (error) {
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

    // Destructure fields, ignoring the id field from frontend
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
            // Agar date invalid hai, to hum purani date hi rehne denge ya error denge
            // Abhi ke liye crash rokne ke liye ise undefined rakhte hain
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

    if (!memberId) return NextResponse.json({ error: 'ID is missing' }, { status: 400 });

    const member = await db.member.findUnique({ where: { id: memberId } });
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const activeLoans = await db.loan.findMany({ where: { memberId, status: 'active' } });
    if (activeLoans.length > 0) {
      return NextResponse.json({ error: 'Cannot delete member with active loans' }, { status: 400 });
    }

    await db.$transaction([
      db.passbookEntry.deleteMany({ where: { memberId } }),
      db.member.delete({ where: { id: memberId } })
    ]);

    return NextResponse.json({ success: true, message: 'Deleted successfully' });

  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}