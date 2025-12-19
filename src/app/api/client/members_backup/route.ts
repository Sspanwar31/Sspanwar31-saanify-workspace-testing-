import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
        { address: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    // Get total count for pagination
    const totalMembers = await db.member.count({ where });

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
      membershipId: `MEM${member.id.slice(-6).toUpperCase()}`,
      status: 'ACTIVE', // Default status
      lastLogin: member.updatedAt, // Using updatedAt as last login
      activeLoans: member._count.loans
    }));

    return NextResponse.json({
      members: formattedMembers,
      pagination: {
        total: totalMembers,
        page,
        limit,
        pages: Math.ceil(totalMembers / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching members:', error);
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
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if member with same phone already exists
    if (phone) {
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
        address: address || '',
        joiningDate: joinDate ? new Date(joinDate) : new Date()
      }
    });

    return NextResponse.json({
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
    });

  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    );
  }
}