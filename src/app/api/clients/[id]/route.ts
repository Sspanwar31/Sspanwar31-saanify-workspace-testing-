import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/clients/[id] - Get a single client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id

    const client = await db.societyAccount.findUnique({
      where: { id: clientId },
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
        },
        societies: {
          select: {
            id: true,
            name: true,
            description: true,
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

// PATCH /api/clients/[id] - Update client status or other properties
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action, plan } = body
    const clientId = params.id

    // Find the client
    const client = await db.societyAccount.findUnique({
      where: { id: clientId }
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
      
      case 'extend_trial':
        const { days } = body
        const newTrialEnd = new Date()
        newTrialEnd.setDate(newTrialEnd.getDate() + days)
        updateData = {
          status: 'TRIAL',
          trialEndsAt: newTrialEnd
        }
        break
      
      case 'renew':
        if (!plan) {
          return NextResponse.json(
            { error: 'Plan is required for renewal' },
            { status: 400 }
          )
        }
        
        // Calculate subscription end date based on plan
        const now = new Date()
        let subscriptionEndsAt: Date
        
        switch (plan.toUpperCase()) {
          case 'BASIC':
            subscriptionEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 1 month
            break
          case 'PRO':
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
        
        updateData = {
          status: 'ACTIVE',
          subscriptionPlan: plan.toUpperCase(),
          subscriptionEndsAt,
          trialEndsAt: null
        }
        break
      
      case 'renew_basic':
        subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 1 month
        updateData = {
          status: 'ACTIVE',
          subscriptionPlan: 'BASIC',
          subscriptionEndsAt,
          trialEndsAt: null
        }
        break
      
      case 'renew_pro':
        subscriptionEndsAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 3 months
        updateData = {
          status: 'ACTIVE',
          subscriptionPlan: 'PRO',
          subscriptionEndsAt,
          trialEndsAt: null
        }
        break
      
      case 'renew_enterprise':
        subscriptionEndsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 12 months
        updateData = {
          status: 'ACTIVE',
          subscriptionPlan: 'ENTERPRISE',
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
      
      case 'refresh':
        // Just return the updated client data
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const updatedClient = updateData && Object.keys(updateData).length > 0
      ? await db.societyAccount.update({
          where: { id: clientId },
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
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id

    // Find the client
    const client = await db.societyAccount.findUnique({
      where: { id: clientId },
      include: {
        users: true,
        societies: true
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Delete all related users
    await db.user.deleteMany({
      where: { societyAccountId: clientId }
    })

    // Delete all related societies
    await db.society.deleteMany({
      where: { societyAccountId: clientId }
    })

    // Delete the society account
    await db.societyAccount.delete({
      where: { id: clientId }
    })

    return NextResponse.json({
      message: 'Client deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}