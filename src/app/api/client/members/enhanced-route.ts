import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Enhanced POST route handler with comprehensive error handling and logging
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  console.log('➕ [BACKEND] POST request received', {
    url: request.url,
    method: request.method,
    contentType: request.headers.get('content-type'),
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
  });

  try {
    // Parse and validate request body
    let memberData;
    try {
      memberData = await request.json();
      console.log('📝 [BACKEND] Member data received', { memberData });
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

    // Validate required fields
    const requiredFields = ['name'];
    const missingFields = requiredFields.filter(field => !memberData[field]);
    if (missingFields.length > 0) {
      console.error('❌ [BACKEND] Missing required fields', { 
        missingFields,
        receivedData: memberData 
      });
      return NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          details: 'Please provide all required fields in your request'
        },
        { status: 400 }
      );
    }

    // Sanitize input data
    const sanitizedData = {
      name: memberData.name?.trim(),
      phone: memberData.phone?.trim() || null,
      address: memberData.address?.trim() || '',
      joiningDate: memberData.joinDate ? new Date(memberData.joinDate) : new Date()
    };

    // Validate sanitized data
    if (!sanitizedData.name || sanitizedData.name.length === 0) {
      console.error('❌ [BACKEND] Invalid name after sanitization', { 
        originalName: memberData.name,
        sanitizedName: sanitizedData.name 
      });
      return NextResponse.json(
        { 
          error: 'Invalid name provided',
          details: 'Name cannot be empty or contain only whitespace'
        },
        { status: 400 }
      );
    }

    // Check for existing member with same phone
    if (sanitizedData.phone) {
      console.log('🔍 [BACKEND] Checking for existing member', { phone: sanitizedData.phone });
      
      try {
        const existingMember = await db.member.findFirst({
          where: { phone: sanitizedData.phone }
        });

        if (existingMember) {
          console.error('❌ [BACKEND] Member already exists', { 
            phone: sanitizedData.phone,
            existingMemberId: existingMember.id 
          });
          return NextResponse.json(
            { 
              error: 'Member with this phone number already exists',
              details: `A member with phone number ${sanitizedData.phone} is already registered`,
              existingMemberId: existingMember.id
            },
            { status: 409 }
          );
        }
      } catch (dbError) {
        console.error('💥 [BACKEND] Database error during duplicate check', {
          error: dbError instanceof Error ? dbError.message : dbError,
          phone: sanitizedData.phone
        });
        return NextResponse.json(
          { 
            error: 'Database error during validation',
            details: 'Unable to validate member uniqueness'
          },
          { status: 500 }
        );
      }
    }

    // Create new member
    console.log('🗄️ [BACKEND] Creating new member in database', { 
      sanitizedData: {
        ...sanitizedData,
        joiningDate: sanitizedData.joiningDate.toISOString()
      }
    });
    
    try {
      const newMember = await db.member.create({
        data: {
          name: sanitizedData.name,
          phone: sanitizedData.phone,
          address: sanitizedData.address,
          joiningDate: sanitizedData.joiningDate
        }
      });

      const duration = Date.now() - startTime;
      console.log('✅ [BACKEND] Member created successfully', {
        memberId: newMember.id,
        duration: `${duration}ms`,
        member: {
          id: newMember.id,
          name: newMember.name,
          phone: newMember.phone,
          address: newMember.address,
          joiningDate: newMember.joiningDate,
          createdAt: newMember.createdAt
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Member created successfully',
        member: {
          id: newMember.id,
          name: newMember.name,
          phone: newMember.phone || '',
          email: null, // No email field in database
          joinDate: newMember.joiningDate,
          address: newMember.address || '',
          createdAt: newMember.createdAt,
          updatedAt: newMember.updatedAt
        }
      }, { status: 201 });

    } catch (createError) {
      console.error('💥 [BACKEND] Database error during member creation', {
        error: createError instanceof Error ? createError.message : createError,
        stack: createError instanceof Error ? createError.stack : undefined,
        sanitizedData
      });

      // Handle specific database constraint errors
      if (createError instanceof Error && createError.message.includes('Unique constraint')) {
        return NextResponse.json(
          { 
            error: 'Member with this information already exists',
            details: 'A database constraint was violated during member creation'
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to create member',
          details: process.env.NODE_ENV === 'development' ? createError.message : 'Database operation failed'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('💥 [BACKEND] Unexpected error in POST operation', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      url: request.url
    });

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

// Enhanced GET route handler with comprehensive logging
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  console.log('📋 [BACKEND] GET request received', {
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString(),
  });

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    console.log('🔍 [BACKEND] Query parameters', { page, limit, search, skip });

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      console.error('❌ [BACKEND] Invalid pagination parameters', { page, limit });
      return NextResponse.json(
        { 
          error: 'Invalid pagination parameters',
          details: 'Page must be >= 1 and limit must be between 1 and 100'
        },
        { status: 400 }
      );
    }

    // Build where clause for search
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
        { address: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    console.log('🔍 [BACKEND] Database query where clause', { where });

    try {
      // Get total count for pagination
      const totalMembers = await db.member.count({ where });
      console.log('📊 [BACKEND] Total members count', { totalMembers });

      // Get members with pagination
      const members = await db.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
          joiningDate: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              loans: {
                where: { status: 'active' }
              }
            }
          }
        }
      });

      console.log('📊 [BACKEND] Retrieved members from database', { 
        count: members.length,
        page,
        limit 
      });

      // Format response
      const formattedMembers = members.map(member => ({
        id: member.id,
        name: member.name,
        phone: member.phone || '',
        email: null, // No email field in database
        joinDate: member.joiningDate,
        address: member.address || '',
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
        membershipId: 'MEM' + member.id.slice(-6).toUpperCase(),
        status: 'ACTIVE', // Default status
        lastLogin: member.updatedAt, // Using updatedAt as last login
        activeLoans: member._count.loans
      }));

      const duration = Date.now() - startTime;
      console.log('✅ [BACKEND] Members fetched successfully', {
        count: formattedMembers.length,
        totalMembers,
        duration: `${duration}ms`,
        pagination: {
          total: totalMembers,
          page,
          limit,
          pages: Math.ceil(totalMembers / limit)
        }
      });

      return NextResponse.json({
        success: true,
        members: formattedMembers,
        pagination: {
          total: totalMembers,
          page,
          limit,
          pages: Math.ceil(totalMembers / limit)
        }
      });

    } catch (dbError) {
      console.error('💥 [BACKEND] Database error during member fetch', {
        error: dbError instanceof Error ? dbError.message : dbError,
        stack: dbError instanceof Error ? dbError.stack : undefined,
        where,
        skip,
        take: limit
      });

      return NextResponse.json(
        { 
          error: 'Database error',
          details: 'Failed to fetch members from database'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('💥 [BACKEND] Unexpected error in GET operation', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      url: request.url
    });

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}