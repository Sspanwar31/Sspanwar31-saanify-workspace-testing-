import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Validation schema
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  plan: z.enum(['trial', 'basic', 'pro', 'enterprise']).default('trial')
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

    // Calculate trial end date (15 days from now) for trial plans
    let trialEndsAt = null
    let subscriptionEndsAt = null
    let subscriptionPlan = 'TRIAL'

    if (validatedData.plan === 'trial') {
      trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 15)
      subscriptionPlan = 'TRIAL'
    } else {
      // For paid plans, set subscription plan but don't activate until payment is approved
      subscriptionPlan = validatedData.plan.toUpperCase()
    }

    // Create user with appropriate plan settings
    const user = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        role: 'CLIENT',
        isActive: true,
        trialEndsAt,
        subscriptionEndsAt,
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
        createdAt: true
      }
    })

    // Create society account for the user
    const societyAccount = await db.societyAccount.create({
      data: {
        name: `${validatedData.name}'s Society`,
        email: validatedData.email.toLowerCase(),
        subscriptionPlan,
        status: validatedData.plan === 'trial' ? 'TRIAL' : 'PENDING_PAYMENT',
        trialEndsAt,
        subscriptionEndsAt,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Update user with society account reference
    await db.user.update({
      where: { id: user.id },
      data: { societyAccountId: societyAccount.id }
    })

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: validatedData.plan === 'trial' 
        ? 'Account created successfully with 15-day trial'
        : `Account created successfully. Please complete payment for ${subscriptionPlan} plan.`,
      user,
      plan: validatedData.plan,
      redirectUrl: validatedData.plan === 'trial' 
        ? '/dashboard/client' 
        : `/subscription/payment-upload?plan=${validatedData.plan}`
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