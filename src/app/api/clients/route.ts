import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createClientSchema = z.object({
  societyName: z.string().min(2, 'Society name is required'),
  adminName: z.string().min(2, 'Admin name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subscriptionType: z.enum(['TRIAL', 'BASIC', 'PRO', 'ENTERPRISE']).default('TRIAL'),
  trialPeriod: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = createClientSchema.parse(body)

    // Check if email already exists in SocietyAccount
    const existingClient = await db.societyAccount.findFirst({
      where: { email: validatedData.email }
    })

    if (existingClient) {
      return NextResponse.json(
        { error: 'Client with this email already exists' },
        { status: 409 }
      )
    }

    // Calculate trial end date if it's a trial
    let trialEndsAt = null
    if (validatedData.subscriptionType === 'TRIAL' && validatedData.trialPeriod) {
      const trialDays = parseInt(validatedData.trialPeriod)
      trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)
    }

    // Create society account (client)
    const client = await db.societyAccount.create({
      data: {
        name: validatedData.societyName,
        adminName: validatedData.adminName,
        email: validatedData.email,
        phone: validatedData.phone,
        subscriptionPlan: validatedData.subscriptionType,
        status: validatedData.subscriptionType === 'TRIAL' ? 'TRIAL' : 'ACTIVE',
        trialEndsAt: trialEndsAt,
        subscriptionEndsAt: validatedData.subscriptionType !== 'TRIAL' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null, // 1 year for paid plans
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Client created successfully',
      client: {
        id: client.id,
        name: client.name,
        adminName: client.adminName,
        email: client.email,
        phone: client.phone,
        subscriptionPlan: client.subscriptionPlan,
        status: client.status,
        trialEndsAt: client.trialEndsAt,
        subscriptionEndsAt: client.subscriptionEndsAt,
        isActive: client.isActive,
        createdAt: client.createdAt
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('Create client error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const clients = await db.societyAccount.findMany({
      select: {
        id: true,
        name: true,
        adminName: true,
        email: true,
        phone: true,
        subscriptionPlan: true,
        status: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform data to match expected format
    const transformedClients = clients.map(client => ({
      id: client.id,
      name: client.name,
      adminName: client.adminName,
      email: client.email,
      phone: client.phone,
      plan: client.subscriptionPlan,
      status: client.status.toLowerCase(),
      renewDate: client.subscriptionEndsAt || client.trialEndsAt ? 
        new Date(client.subscriptionEndsAt || client.trialEndsAt).toLocaleDateString() : 
        'Not set',
      users: Math.floor(Math.random() * 100) + 10, // Mock user count
      trialEndsAt: client.trialEndsAt,
      subscriptionEndsAt: client.subscriptionEndsAt,
      isActive: client.isActive,
      createdAt: client.createdAt
    }))

    return NextResponse.json({
      success: true,
      clients: transformedClients
    })

  } catch (error) {
    console.error('Get clients error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Update client
    const updatedClient = await db.societyAccount.update({
      where: { id },
      data: body
    })

    return NextResponse.json({
      success: true,
      message: 'Client updated successfully',
      client: updatedClient
    })

  } catch (error) {
    console.error('Update client error:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Delete client
    await db.societyAccount.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    })

  } catch (error) {
    console.error('Delete client error:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}