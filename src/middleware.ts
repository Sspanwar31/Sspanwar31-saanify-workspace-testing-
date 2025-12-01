import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Get the origin and determine if we're in development
  const origin = request.headers.get('origin') || ''
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1')
  const pathname = request.nextUrl.pathname

  console.log(`🔐 Middleware: Processing ${pathname}`)
  
  // Basic security headers for all routes
  const baseHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  }

  // Apply base headers
  Object.entries(baseHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Content Security Policy - build dynamically based on route
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'"
  ]

  // Permissions Policy - build dynamically based on route
  const permissionsDirectives = [
    'camera=()',
    'microphone=()',
    'accelerometer=()',
    'gyroscope=()',
    'magnetometer=()',
    'geolocation=()',
    'interest-cohort=()',
    'browsing-topics=()',
    'attribution-reporting=()'
  ]

  // Route-specific security policies
  if (pathname.startsWith('/api/payment') || pathname.includes('subscription') || pathname.includes('razorpay')) {
    console.log('🔐 Payment route detected - applying payment security policies')
    
    // Allow Razorpay domains for payment routes
    cspDirectives.push(
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
      "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
      "frame-src 'self' https://checkout.razorpay.com",
      "child-src 'self' https://checkout.razorpay.com"
    )
    
    permissionsDirectives.push(
      'payment=(self)',
      'clipboard-write=(self)',
      'web-share=(self)',
      'publickey-credentials-get=(self)',
      'publickey-credentials-create=(self)',
      'fullscreen=(self)'
    )
  }

  if (pathname.startsWith('/api/github') || pathname.includes('github')) {
    console.log('🔐 GitHub route detected - applying GitHub security policies')
    
    // Allow GitHub domains for GitHub routes
    cspDirectives.push(
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com",
      "connect-src 'self' https://api.github.com",
      "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:"
    )
    
    permissionsDirectives.push(
      'clipboard-write=(self)',
      'web-share=(self)',
      'publickey-credentials-get=(self)'
    )
  }

  // Development-specific policies
  if (isLocalhost) {
    console.log('🔐 Development environment detected - applying dev policies')
    
    // More permissive policies for development
    cspDirectives.push(
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.tailwindcss.com https://unpkg.com",
      "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://api.github.com",
      "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "frame-src 'self' https://checkout.razorpay.com"
    )
    
    permissionsDirectives.push(
      'payment=(self)',
      'clipboard-write=(self)',
      'web-share=(self)',
      'publickey-credentials-get=(self)',
      'publickey-credentials-create=(self)',
      'fullscreen=(self)'
    )
  }

  // Apply CSP and Permissions Policy
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  response.headers.set('Permissions-Policy', permissionsDirectives.join(', '))

  // Frame options - less restrictive for development and preview environments
  const isPreviewEnvironment = request.headers.get('user-agent')?.includes('Z.ai') ||
                              request.headers.get('user-agent')?.includes('StackBlitz') ||
                              request.headers.get('referer')?.includes('stackblitz') ||
                              request.headers.get('referer')?.includes('z-ai')
  
  if (isLocalhost || isPreviewEnvironment) {
    // Allow iframe embedding for development and preview environments
    response.headers.set('X-Frame-Options', 'ALLOWALL')
    // Update CSP to allow iframe embedding
    const frameSrcIndex = cspDirectives.findIndex(d => d.startsWith('frame-src'))
    if (frameSrcIndex !== -1) {
      cspDirectives[frameSrcIndex] = "frame-src *"
    }
  } else {
    // Use SAMEORIGIN for production (less restrictive than DENY)
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  }

  console.log(`🔐 Security headers applied for ${pathname}`)
  return response
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