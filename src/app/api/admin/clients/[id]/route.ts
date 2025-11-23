import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id
    const body = await request.json()
    const { name, email, phone, address, plan } = body

    // Get user
    const user = await db.user.findUnique({
      where: { id: clientId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Update user
    await db.user.update({
      where: { id: clientId },
      data: {
        name: name,
        email: email,
      }
    })

    // Update society account if exists
    if (user.societyAccountId) {
      await db.societyAccount.update({
        where: { id: user.societyAccountId },
        data: {
          name: name,
          email: email,
          phone: phone,
          address: address,
          subscriptionPlan: plan,
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Client updated successfully'
    })

  } catch (error) {
    console.error('Failed to update client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id

    // Get user
    const user = await db.user.findUnique({
      where: { id: clientId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Find and delete society account if exists
    if (user.societyAccountId) {
      const societyAccount = await db.societyAccount.findUnique({
        where: { id: user.societyAccountId }
      })
      
      if (societyAccount) {
        await db.societyAccount.delete({
          where: { id: user.societyAccountId }
        })
      }
    }

    // Delete user
    await db.user.delete({
      where: { id: clientId }
    })

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    })

  } catch (error) {
    console.error('Failed to delete client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}