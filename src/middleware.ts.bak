import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Routes that require authentication
const protectedRoutes = ['/dashboard/admin', '/dashboard/client', '/dashboard']
const publicRoutes = ['/', '/login', '/signup', '/api/auth/login', '/api/auth/signup', '/api/auth/check-session', '/api/auth/refresh']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Get token from cookie
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    // Redirect to home if no token
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Check role-based access
    if (pathname.startsWith('/dashboard/admin') && decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (pathname.startsWith('/dashboard/client') && decoded.role !== 'CLIENT') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Add user info to headers for server-side usage
    const response = NextResponse.next()
    response.headers.set('x-user-id', decoded.userId)
    response.headers.set('x-user-role', decoded.role)
    response.headers.set('x-user-email', decoded.email)
    
    return response

  } catch (error) {
    // Invalid token - redirect to home
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}