import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Validation schema
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  plan: z.string().optional().default('trial'),
  paymentToken: z.string().optional()
})

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = signupSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Calculate trial end date (15 days from now)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 15)

    // Create user with trial subscription
    const user = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        role: 'CLIENT',
        isActive: true,
        trialEndsAt,
        // Set subscription fields based on plan
        subscriptionStatus: validatedData.plan === 'trial' ? 'TRIAL' : 'ACTIVE',
        plan: validatedData.plan.toUpperCase(),
        expiryDate: validatedData.plan === 'trial' ? trialEndsAt : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for paid plans
        createdAt: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        subscriptionStatus: true,
        plan: true,
        expiryDate: true,
        createdAt: true
      }
    })

    // Create JWT token with subscription info
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
        plan: user.plan,
        expiryDate: user.expiryDate
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: validatedData.plan === 'trial' 
        ? 'Account created successfully with 15-day trial'
        : `Account created successfully with ${validatedData.plan} plan`,
      user,
      plan: validatedData.plan,
      redirectUrl: '/dashboard/client'
    })

    // Set the token as an HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return response

  } catch (error: any) {
    console.error('Signup error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      errors: error.errors,
      issues: error.issues
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}