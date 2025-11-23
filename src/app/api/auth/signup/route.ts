import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema
const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  company: z.string().min(2, 'Company name must be at least 2 characters'),
  role: z.enum(['developer', 'designer', 'manager', 'founder', 'other']),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = signupSchema.parse(body)

    // Check if user already exists (in a real app, you'd check your database)
    // For demo purposes, we'll simulate this check
    const existingUser = await checkUserExists(validatedData.email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create user (in a real app, you'd save to your database)
    const user = await createUser(validatedData)

    // Generate JWT token (in a real app, you'd use a proper JWT library)
    const token = generateToken(user)

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        role: user.role,
        createdAt: user.createdAt
      },
      token
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

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions (in a real app, these would interact with your database)
async function checkUserExists(email: string): Promise<boolean> {
  // Simulate database check
  // In a real app, you'd query your database
  return false
}

async function createUser(data: any) {
  // Simulate user creation
  // In a real app, you'd save to your database with proper hashing
  return {
    id: Math.random().toString(36).substr(2, 9),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

function generateToken(user: any): string {
  // Simulate JWT generation
  // In a real app, you'd use a proper JWT library
  return Buffer.from(JSON.stringify({ userId: user.id, email: user.email })).toString('base64')
}