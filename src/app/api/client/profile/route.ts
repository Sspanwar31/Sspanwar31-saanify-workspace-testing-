import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withClient, AuthenticatedRequest } from '@/lib/auth-middleware'

// Get client profile (Client only)
export const GET = withClient(async (req: AuthenticatedRequest) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        societyAccount: {
          select: {
            id: true,
            name: true,
            status: true,
            subscriptionPlan: true,
            trialEndsAt: true,
            subscriptionEndsAt: true,
            totalMembers: true,
            address: true,
            city: true,
            state: true,
            postalCode: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
})

// Update client profile (Client only)
export const PATCH = withClient(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { name, phone } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone

    const updatedUser = await db.user.update({
      where: { id: req.user!.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
})