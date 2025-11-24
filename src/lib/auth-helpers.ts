import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthenticatedUser {
  userId: string
  email: string
  name: string
  role: string
}

export async function authenticateAndAuthorize(request: NextRequest, requiredRole: string = 'SUPERADMIN'): Promise<{ user: AuthenticatedUser; error?: string }> {
  // Get token from cookie
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    return { user: null as any, error: 'No authentication token found' }
  }

  let decoded: any
  try {
    decoded = jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return { user: null as any, error: 'Invalid or expired token' }
  }

  const userRole = decoded.role?.toUpperCase() || ""

  // Check if user has required role
  if (requiredRole === 'SUPERADMIN' && userRole !== 'SUPERADMIN') {
    return { user: null as any, error: 'Access denied - Superadmin privileges required' }
  }

  if (requiredRole === 'ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'ADMIN') {
    return { user: null as any, error: 'Access denied - Admin privileges required' }
  }

  if (requiredRole === 'CLIENT' && userRole !== 'CLIENT' && userRole !== 'SUPERADMIN') {
    return { user: null as any, error: 'Access denied - Client privileges required' }
  }

  return {
    user: {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: userRole
    }
  }
}

export function createUnauthorizedResponse(message: string) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    }
  )
}

export function createForbiddenResponse(message: string) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status: 403, 
      headers: { 'Content-Type': 'application/json' } 
    }
  )
}