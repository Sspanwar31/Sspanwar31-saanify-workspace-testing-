import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-it'

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

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  userType: z.enum(['client', 'admin']).optional(),
  rememberMe: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("1. Login Attempt for:", body.email); // LOG

    const validatedData = loginSchema.parse(body)

    // 1. Find User
    const user = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!user) {
      console.log("❌ Error: User Not Found in DB"); // LOG
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }
    
    console.log("2. User Found:", { role: user.role, id: user.id }); // LOG

    // 2. Check Password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password || "")
    
    if (!isPasswordValid) {
      console.log("❌ Error: Password Mismatch"); // LOG
      console.log("   Input Password:", validatedData.password); 
      console.log("   DB Hash (First 10 chars):", user.password?.substring(0, 10));
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    console.log("3. Password Matched ✅"); // LOG

    // 3. Check Role
    if (validatedData.userType === 'admin') {
       if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
          console.log("❌ Error: Role Mismatch. Required Admin, Got:", user.role); // LOG
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
       }
    }

    // 4. Success
    console.log("4. Login Successful! Generating Tokens..."); // LOG
    
    // Update Last Login (Ignore error if any)
    try { await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }) } catch(e) {}

    const tokens = generateTokens(user)
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    })

    response.cookies.set('auth-token', tokens.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60 })
    response.cookies.set('refresh-token', tokens.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 })

    return response

  } catch (error) {
    console.error('🔥 Login Crash:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
