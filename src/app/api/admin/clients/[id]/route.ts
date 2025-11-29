import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/auth-middleware'

// GET /api/admin/clients/[id] - Get a single client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const client = await db.societyAccount.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Add mock statistics for demonstration
    const clientWithStats = {
      ...client,
      totalMembers: client.users.length,
      totalLoans: Math.floor(Math.random() * 50) + 10, // Mock data
      totalRevenue: client.subscriptionPlan === 'TRIAL' ? 0 :
                   client.subscriptionPlan === 'BASIC' ? 99 :
                   client.subscriptionPlan === 'PRO' ? 299 : 999
    }

    return NextResponse.json({
      client: clientWithStats
    })
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/clients/[id] - Update client status or other properties
export const PATCH = withAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, plan } = body

    // Find client
    const client = await db.societyAccount.findUnique({
      where: { id }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'lock':
        updateData = { status: 'LOCKED' }
        break
        
      case 'unlock':
        updateData = { status: 'ACTIVE' }
        break
        
      case 'activate':
        updateData = {
          status: 'ACTIVE',
          subscriptionEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          trialEndsAt: null
        }
        break
        
      case 'expire':
        updateData = { status: 'EXPIRED' }
        break
        
      case 'renew':
        if (!plan) {
          return NextResponse.json(
            { error: 'Plan is required for renewal' },
            { status: 400 }
          )
        }
        
        // STEP 1: Clear previous subscription for same client
        await db.societyAccount.update({
          where: { id },
          data: {
            subscriptionPlan: "BASIC",
            subscriptionEndsAt: null,
            trialEndsAt: null
          }
        });
        
        // Calculate subscription end date based on plan
        const now = new Date()
        let subscriptionEndsAt: Date
        
        switch (plan.toUpperCase()) {
          case 'BASIC':
            subscriptionEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 1 month
            break
          case 'STANDARD':
            subscriptionEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 1 month
            break
          case 'PRO':
            subscriptionEndsAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 3 months
            break
          case 'PREMIUM':
            subscriptionEndsAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 3 months
            break
          case 'ENTERPRISE':
            subscriptionEndsAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 12 months
            break
          default:
            return NextResponse.json(
              { error: 'Invalid plan specified' },
              { status: 400 }
            )
        }
        
        // STEP 2: Apply new subscription
        updateData = {
          status: 'ACTIVE',
          subscriptionPlan: plan.toUpperCase(),
          subscriptionEndsAt,
          trialEndsAt: null
        }
        break
        
      case 'edit':
        const { name, adminName, email, phone, address, subscriptionPlan, status } = body
        updateData = {
          name,
          adminName,
          email,
          phone,
          address,
          subscriptionPlan,
          status
        }
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const updatedClient = updateData && Object.keys(updateData).length > 0
      ? await db.societyAccount.update({
          where: { id },
          data: updateData
        })
      : client

    return NextResponse.json({
      message: `Client ${action} successfully`,
      client: {
        id: updatedClient.id,
        name: updatedClient.name,
        status: updatedClient.status,
        subscriptionPlan: updatedClient.subscriptionPlan,
        trialEndsAt: updatedClient.trialEndsAt?.toISOString(),
        subscriptionEndsAt: updatedClient.subscriptionEndsAt?.toISOString(),
        startDate: updatedClient.createdAt?.toISOString(),
        expiryDate: updatedClient.subscriptionEndsAt?.toISOString() || updatedClient.trialEndsAt?.toISOString()
      }
    })
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    console.log(`Updating client ${id} with data:`, body)

    // Update client in society account
    const updatedClient = await db.societyAccount.update({
      where: { id },
      data: body
    })

    console.log('Updated client:', updatedClient)

    return NextResponse.json({
      success: true,
      message: 'Client updated successfully',
      client: updatedClient
    })

  } catch (error) {
    console.error('Update client error:', error)
    return NextResponse.json(
      { error: 'Failed to update client: ' + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`Deleting client: ${id}`)

    // Delete society account
    await db.societyAccount.delete({
      where: { id }
    })

    console.log('Client deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    })

  } catch (error) {
    console.error('Delete client error:', error)
    return NextResponse.json(
      { error: 'Failed to delete client: ' + error.message },
      { status: 500 }
    )
  }
}