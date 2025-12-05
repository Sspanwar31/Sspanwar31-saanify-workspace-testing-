import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Params Helper for Next.js 15
type RouteParams = { params: Promise<{ memberId: string }> };

// Enhanced GET method with comprehensive logging
export async function GET(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    const { memberId } = await params;
    
    console.log('🔍 [BACKEND] GET request received', {
      url: request.url,
      method: request.method,
      memberId,
      timestamp: new Date().toISOString(),
    });

    if (!memberId) {
      console.error('❌ [BACKEND] Missing member ID', { memberId });
      return NextResponse.json(
        { 
          error: 'Member ID is required',
          details: 'Please provide a valid member ID in the URL'
        },
        { status: 400 }
      );
    }

    console.log('🗄️ [BACKEND] Fetching member from database', { memberId });

    const member = await db.member.findUnique({
      where: { id: memberId },
      include: { 
        loans: { 
          where: { status: 'active' },
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        } 
      }
    });

    if (!member) {
      console.error('❌ [BACKEND] Member not found', { memberId });
      return NextResponse.json(
        { 
          error: 'Member not found',
          details: `No member exists with ID: ${memberId}`
        },
        { status: 404 }
      );
    }

    const duration = Date.now() - startTime;
    console.log('✅ [BACKEND] Member fetched successfully', {
      memberId,
      duration: `${duration}ms`,
      hasActiveLoans: member.loans.length > 0,
      activeLoansCount: member.loans.length
    });

    return NextResponse.json({ 
      success: true,
      member: {
        id: member.id,
        name: member.name,
        phone: member.phone || '',
        address: member.address || '',
        joiningDate: member.joiningDate.toISOString(),
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
        activeLoans: member.loans
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('💥 [BACKEND] Error in GET operation', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      url: request.url
    });

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch member'
      },
      { status: 500 }
    );
  }
}

// Enhanced PUT method with comprehensive error handling and validation
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    const { memberId } = await params;
    
    console.log('🔄 [BACKEND] PUT request received', {
      url: request.url,
      method: request.method,
      memberId,
      contentType: request.headers.get('content-type'),
      timestamp: new Date().toISOString(),
    });

    // Validate member ID
    if (!memberId) {
      console.error('❌ [BACKEND] Missing member ID', { memberId });
      return NextResponse.json(
        { 
          error: 'Member ID is required',
          details: 'Please provide a valid member ID in the URL'
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    let updateData;
    try {
      updateData = await request.json();
      console.log('📝 [BACKEND] Update data received', { updateData });
    } catch (error) {
      console.error('❌ [BACKEND] Invalid JSON in request body', { 
        error: error instanceof Error ? error.message : error,
        contentType: request.headers.get('content-type')
      });
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          details: 'Please ensure your request body contains valid JSON'
        },
        { status: 400 }
      );
    }

    // Destructure and validate fields
    const { name, phone, address, email, joinDate } = updateData;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      console.error('❌ [BACKEND] Invalid name provided', { name });
      return NextResponse.json(
        { 
          error: 'Valid name is required',
          details: 'Name cannot be empty and must be a string'
        },
        { status: 400 }
      );
    }

    // Validate and parse date
    let validJoiningDate = undefined;
    if (joinDate) {
      const parsedDate = new Date(joinDate);
      if (isNaN(parsedDate.getTime())) {
        console.error('❌ [BACKEND] Invalid date received', { joinDate });
        return NextResponse.json(
          { 
            error: 'Invalid date format',
            details: 'Please provide a valid date in ISO format (YYYY-MM-DD)'
          },
          { status: 400 }
        );
      }
      validJoiningDate = parsedDate;
    }

    // Check if member exists
    console.log('🔍 [BACKEND] Checking if member exists', { memberId });
    const existingMember = await db.member.findUnique({ 
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        joiningDate: true
      }
    });
    
    if (!existingMember) {
      console.error('❌ [BACKEND] Member not found', { memberId });
      return NextResponse.json(
        { 
          error: 'Member not found',
          details: `No member exists with ID: ${memberId}`
        },
        { status: 404 }
      );
    }

    console.log('✅ [BACKEND] Member exists', { 
      memberId, 
      existingName: existingMember.name,
      existingPhone: existingMember.phone 
    });

    // Check for phone conflicts (if phone is being updated)
    if (phone && phone !== existingMember.phone) {
      console.log('🔍 [BACKEND] Checking for phone conflicts', { 
        newPhone: phone, 
        currentPhone: existingMember.phone 
      });
      
      const duplicate = await db.member.findFirst({
        where: { 
          phone: phone.trim(),
          id: { not: memberId } 
        }
      });
      
      if (duplicate) {
        console.error('❌ [BACKEND] Phone already exists', { 
          phone: phone.trim(),
          duplicateId: duplicate.id 
        });
        return NextResponse.json(
          { 
            error: 'Phone number already exists',
            details: `Another member with phone number ${phone.trim()} is already registered`,
            duplicateId: duplicate.id
          },
          { status: 409 }
        );
      }
    }

    // Prepare update data with sanitization
    const sanitizedUpdateData = {
      name: name.trim(),
      phone: phone ? phone.trim() : null,
      email: email ? email.trim() : null,
      address: address ? address.trim() : '',
      ...(validJoiningDate && { joiningDate: validJoiningDate }),
      updatedAt: new Date()
    };

    console.log('🗄️ [BACKEND] Updating member in database', {
      memberId,
      updateData: sanitizedUpdateData,
      previousData: existingMember
    });

    // Update member
    const updatedMember = await db.member.update({
      where: { id: memberId },
      data: sanitizedUpdateData,
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        joiningDate: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const duration = Date.now() - startTime;
    console.log('✅ [BACKEND] Member updated successfully', {
      memberId,
      duration: `${duration}ms`,
      updatedFields: Object.keys(sanitizedUpdateData),
      updatedMember: {
        id: updatedMember.id,
        name: updatedMember.name,
        phone: updatedMember.phone,
        address: updatedMember.address,
        joiningDate: updatedMember.joiningDate,
        updatedAt: updatedMember.updatedAt
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Member updated successfully',
      member: updatedMember
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('💥 [BACKEND] Error in PUT operation', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      url: request.url,
      memberId: await params.then(p => p.memberId).catch(() => 'unknown')
    });

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { 
            error: 'Data constraint violation',
            details: 'A member with this information already exists'
          },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { 
            error: 'Member not found',
            details: 'The member you are trying to update no longer exists'
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Failed to update member'
      },
      { status: 500 }
    );
  }
}

// Enhanced DELETE method with comprehensive validation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    const { memberId } = await params;
    
    console.log('🗑️ [BACKEND] DELETE request received', {
      url: request.url,
      method: request.method,
      memberId,
      timestamp: new Date().toISOString(),
    });

    if (!memberId) {
      console.error('❌ [BACKEND] Missing member ID', { memberId });
      return NextResponse.json(
        { 
          error: 'Member ID is required',
          details: 'Please provide a valid member ID in the URL'
        },
        { status: 400 }
      );
    }

    // Check if member exists
    console.log('🔍 [BACKEND] Checking if member exists', { memberId });
    const member = await db.member.findUnique({ 
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        phone: true
      }
    });
    
    if (!member) {
      console.error('❌ [BACKEND] Member not found', { memberId });
      return NextResponse.json(
        { 
          error: 'Member not found',
          details: `No member exists with ID: ${memberId}`
        },
        { status: 404 }
      );
    }

    console.log('✅ [BACKEND] Member exists', { 
      memberId, 
      memberName: member.name,
      memberPhone: member.phone 
    });

    // Check for active loans
    console.log('🔍 [BACKEND] Checking for active loans', { memberId });
    const activeLoans = await db.loan.findMany({ 
      where: { memberId, status: 'active' },
      select: {
        id: true,
        amount: true,
        status: true
      }
    });
    
    if (activeLoans.length > 0) {
      console.error('❌ [BACKEND] Cannot delete member with active loans', {
        memberId,
        activeLoansCount: activeLoans.length,
        activeLoans: activeLoans.map(loan => ({
          id: loan.id,
          amount: loan.amount
        }))
      });
      return NextResponse.json(
        { 
          error: 'Cannot delete member with active loans',
          details: `Member has ${activeLoans.length} active loan(s). Please close all loans before deleting the member.`,
          activeLoansCount: activeLoans.length
        },
        { status: 400 }
      );
    }

    console.log('✅ [BACKEND] No active loans found, proceeding with deletion', { memberId });

    // Perform deletion in a transaction
    console.log('🗄️ [BACKEND] Starting transaction to delete member', { memberId });
    
    await db.$transaction([
      db.passbookEntry.deleteMany({ where: { memberId } }),
      db.member.delete({ where: { id: memberId } })
    ]);

    const duration = Date.now() - startTime;
    console.log('✅ [BACKEND] Member deleted successfully', {
      memberId,
      memberName: member.name,
      duration: `${duration}ms`
    });

    return NextResponse.json({ 
      success: true,
      message: 'Member deleted successfully',
      deletedMember: {
        id: member.id,
        name: member.name,
        phone: member.phone
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('💥 [BACKEND] Error in DELETE operation', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      url: request.url,
      memberId: await params.then(p => p.memberId).catch(() => 'unknown')
    });

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { 
            error: 'Cannot delete member',
            details: 'Member is referenced by other records. Please remove all related data first.'
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Failed to delete member'
      },
      { status: 500 }
    );
  }
}