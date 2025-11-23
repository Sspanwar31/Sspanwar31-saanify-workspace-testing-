import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createClientSchema = z.object({
  societyName: z.string().min(2, 'Society name is required'),
  adminName: z.string().min(2, 'Admin name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  subscriptionType: z.enum(['TRIAL', 'BASIC', 'PRO', 'ENTERPRISE']).default('TRIAL'),
  trialPeriod: z.string().optional(),
  role: z.enum(['MEMBER', 'TREASURER', 'ADMIN']).default('ADMIN'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).default('ACTIVE'),
  isActive: z.boolean().default(true)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = createClientSchema.parse(body)

    // Check if email already exists
    const existingClient = await db.user.findFirst({
      where: { email: validatedData.email }
    })

    if (existingClient) {
      return NextResponse.json(
        { error: 'Client with this email already exists' },
        { status: 409 }
      )
    }

    // Generate default password (society name + 123)
    const defaultPassword = validatedData.societyName.replace(/\s+/g, '').toLowerCase() + '123'
    const hashedPassword = await bcrypt.hash(defaultPassword, 12)

    // Calculate trial end date if it's a trial
    let trialEndsAt = null
    if (validatedData.subscriptionType === 'TRIAL') {
      const trialDays = parseInt(validatedData.trialPeriod || '15')
      trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)
    }

    // Create Society Account first
    const societyAccount = await db.societyAccount.create({
      data: {
        name: validatedData.societyName,
        adminName: validatedData.adminName,
        email: validatedData.email,
        phone: validatedData.phone,
        address: validatedData.address,
        subscriptionPlan: validatedData.subscriptionType,
        status: validatedData.subscriptionType === 'TRIAL' ? 'TRIAL' : 'ACTIVE',
        trialEndsAt: trialEndsAt,
        isActive: validatedData.isActive
      }
    })

    // Create User (Client Admin) linked to Society Account
    const client = await db.user.create({
      data: {
        name: validatedData.adminName,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        societyAccountId: societyAccount.id,
        isActive: validatedData.isActive
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Client created successfully',
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        role: client.role,
        societyAccountId: societyAccount.id,
        societyName: societyAccount.name,
        defaultPassword: defaultPassword, // Send default password for initial login
        subscriptionPlan: societyAccount.subscriptionPlan,
        trialEndsAt: societyAccount.trialEndsAt
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
    const clients = await db.user.findMany({
      where: {
        role: { in: ['MEMBER', 'TREASURER', 'ADMIN'] }
      },
      include: {
        societyAccount: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform the data to include society name
    const transformedClients = clients.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      role: client.role,
      status: client.status || 'ACTIVE',
      isActive: client.isActive,
      societyAccountId: client.societyAccountId,
      societyName: client.societyAccount?.name || 'N/A',
      subscriptionPlan: client.societyAccount?.subscriptionPlan || 'TRIAL',
      trialEndsAt: client.societyAccount?.trialEndsAt,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
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
    const { id } = request.query

    if (!id) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Update client
    const updatedClient = await db.user.update({
      where: { id },
      data: request.body
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
    const { id } = request.query

    if (!id) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Delete client
    await db.user.delete({
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