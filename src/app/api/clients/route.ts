import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createClientSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['MEMBER', 'TREASURER', 'ADMIN']).default('MEMBER'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).default('ACTIVE'),
  societyAccountId: z.string().optional(),
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

    // Hash password if provided
    let hashedPassword = null
    if (validatedData.password) {
      hashedPassword = await bcrypt.hash(validatedData.password, 12)
    }

    // Create client
    const client = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        status: validatedData.status,
        societyAccountId: validatedData.societyAccountId,
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
        status: client.status,
        isActive: client.isActive
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
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      clients: clients
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