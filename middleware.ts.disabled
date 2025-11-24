import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Define which routes require authentication
const protectedRoutes = ['/admin', '/client']
const publicRoutes = ['/login', '/signup', '/', '/api/auth']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if route requires authentication
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      // Redirect to login if no token
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any

      // Role-based access control
      if (pathname.startsWith('/admin') && decoded.role !== 'SUPER_ADMIN') {
        // If client tries to access admin routes, redirect to client dashboard
        const clientUrl = new URL('/client/dashboard', request.url)
        return NextResponse.redirect(clientUrl)
      }

      if (pathname.startsWith('/client') && decoded.role !== 'CLIENT') {
        // If admin tries to access client routes, redirect to admin dashboard
        const adminUrl = new URL('/admin/dashboard', request.url)
        return NextResponse.redirect(adminUrl)
      }

      // Add user info to headers for server-side usage
      const response = NextResponse.next()
      response.headers.set('x-user-id', decoded.userId)
      response.headers.set('x-user-role', decoded.role)
      response.headers.set('x-user-email', decoded.email)

      return response

    } catch (error) {
      // Invalid token - redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}