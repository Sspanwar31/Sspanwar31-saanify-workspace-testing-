import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const generateTokens = (user: any) => {
  const payload = { 
    userId: user.id, 
    email: user.email, 
    role: user.role,
    societyAccountId: user.societyAccountId
  }
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
  const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
  return { accessToken, refreshToken }
}

const unifiedLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🔐 Unified Login Attempt for:", body.email)

    const validatedData = unifiedLoginSchema.parse(body)

    // 1. Find User
    const user = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!user) {
      console.log("❌ Error: User Not Found in DB")
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }
    
    console.log("✅ User Found:", { role: user.role, id: user.id, name: user.name })

    // 2. Check Password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password || "")
    
    if (!isPasswordValid) {
      console.log("❌ Error: Password Mismatch")
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    console.log("✅ Password Matched")

    // 3. Check if user is active
    if (!user.isActive) {
      console.log("❌ Error: User is inactive")
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 })
    }

    // 4. Update Last Login
    try { 
      await db.user.update({ 
        where: { id: user.id }, 
        data: { lastLoginAt: new Date() } 
      }) 
    } catch(e) {
      console.log("⚠️ Could not update last login time")
    }

    // 5. Generate Tokens
    const tokens = generateTokens(user)
    
    // 6. Determine user type and redirect URL
    let userType = 'client'
    let redirectUrl = '/dashboard/client'
    
    if (user.role === 'ADMIN') {
      userType = 'admin'
      redirectUrl = '/admin'
    } else if (user.role === 'SUPERADMIN') {
      userType = 'admin'
      redirectUrl = '/admin'
    }
    
    console.log(`🎯 Redirecting ${userType} to: ${redirectUrl}`)
    
    // 7. Create Response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        userType
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      redirectUrl
    })

    // 8. Set Cookies
    const cookieOptions = { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax' as const,
      path: '/'
    }
    
    response.cookies.set('auth-token', tokens.accessToken, { 
      ...cookieOptions, 
      maxAge: 15 * 60 // 15 minutes
    })
    
    response.cookies.set('refresh-token', tokens.refreshToken, { 
      ...cookieOptions, 
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    console.log("✅ Unified Login Successful!")
    return response

  } catch (error) {
    console.error('🔥 Unified Login Crash:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}