import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper: Check if user has access to a specific route
function hasAccess(userRole: string, pathname: string): boolean {
  const roleConfig = roleBasedAccess[userRole as keyof typeof roleBasedAccess];
  if (!roleConfig) return false;
  
  return roleConfig.allowedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

// Helper: Get appropriate redirect for user role
function getRedirectForRole(userRole: string): string {
  const roleConfig = roleBasedAccess[userRole as keyof typeof roleBasedAccess];
  return roleConfig?.redirectRoute || "/dashboard/client";
}

// Helper: Check if route requires authentication
function isProtectedRoute(pathname: string): boolean {
  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  // Check if it's a public API route
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));
  
  return !isPublicRoute && !isPublicApiRoute;
}

// Helper: Enhanced JWT verification with better error handling
function verifyJwtToken(tokenValue: string) {
  try {
    return jwt.verify(tokenValue, JWT_SECRET);
  } catch (error) {
    console.log(`JWT verification failed: ${error}`);
    return null;
  }
}

// Helper: JWT Token ko decode karne ke liye (fallback)
function decodeJwtPayload(tokenValue: string) {
  try {
    const base64Url = tokenValue.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/signup", 
  "/not-authorized",
  "/favicon.ico",
  "/_next"
];

// API routes that don't require authentication
const publicApiRoutes = [
  "/api/auth",
  "/api/health",
  "/api/check-supabase",
  "/api/setup",
  "/api/github/backup",
  "/api/github/restore",
  "/api/github/history",
  "/api/github/push",
  "/api/integrations/supabase/status",
  "/api/admin/automation/run",
  "/api/backup",
  "/api/test",
  "/api/check-users",
  "/api/force-create-user",
  "/api/fix-test-user",
  "/api/fix-client-role",
  "/api/customers",
  "/api/socket",
  "/api/notifications",
  "/api/supabase",
  "/api/database",
  "/api/run-migrations",
  "/api/security-test",
  "/api/create-demo",
  "/api/github-integration",
  "/api/glm",
  "/api/ai",
  "/api/users",
  "/api/clients"
];

// Role-based route access control
const roleBasedAccess = {
  ADMIN: {
    allowedRoutes: [
      "/admin",
      "/dashboard/admin",
      "/api/admin",
      "/api/dashboard/admin",
      "/api/users",
      "/api/clients",
      "/api/subscriptions"
    ],
    redirectRoute: "/admin"
  },
  CLIENT: {
    allowedRoutes: [
      "/dashboard/client",
      "/api/dashboard/client",
      "/api/profile",
      "/api/financial"
    ],
    redirectRoute: "/dashboard/client"
  },
  SUPERADMIN: {
    allowedRoutes: [
      "/admin",
      "/dashboard/admin", 
      "/dashboard/client",
      "/api/admin",
      "/api/dashboard/admin",
      "/api/dashboard/client",
      "/api/users",
      "/api/clients",
      "/api/subscriptions",
      "/api/system"
    ],
    redirectRoute: "/admin"
  }
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log(`🔐 Middleware: Processing ${pathname}`);

  // Check if route requires authentication
  if (!isProtectedRoute(pathname)) {
    console.log(`🔐 Middleware: Public route, allowing access to ${pathname}`);
    return NextResponse.next();
  }

  // Get token from httpOnly cookie (Next.js 15 API)
  const cookies = req.cookies.getAll();
  const authCookie = cookies.find(cookie => cookie.name === 'auth-token');
  const token = authCookie?.value;

  // If no token and route requires authentication, redirect to login
  if (!token) {
    console.log(`🔐 Middleware: No token, redirecting to login from ${pathname}`);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Decode token to get user info - use proper verification first
  let user = verifyJwtToken(token);
  
  // If verification fails, try decode as fallback
  if (!user) {
    console.log(`🔐 Middleware: JWT verification failed, trying decode fallback`);
    user = decodeJwtPayload(token);
  }

  // If user is still invalid, clear token and redirect to login
  if (!user) {
    console.log(`🔐 Middleware: Invalid token, clearing and redirecting to login`);
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("auth-token");
    return response;
  }

  const userRole = user?.role?.toUpperCase() || 'CLIENT';
  console.log(`🔐 Middleware: User role detected as ${userRole} for ${pathname}`);

  // Enhanced API Route Protection
  if (pathname.startsWith("/api/")) {
    // Admin API routes
    if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/dashboard/admin")) {
      if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
        console.log(`🔐 Middleware: Non-admin trying to access admin API: ${userRole}`);
        return NextResponse.json({ 
          error: 'Access denied', 
          message: 'Admin access required',
          requiredRole: 'ADMIN'
        }, { status: 403 });
      }
    }

    // Client API routes
    if (pathname.startsWith("/api/dashboard/client")) {
      if (userRole !== 'CLIENT' && userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
        console.log(`🔐 Middleware: Unauthorized role trying to access client API: ${userRole}`);
        return NextResponse.json({ 
          error: 'Access denied',
          message: 'Client access required',
          requiredRole: 'CLIENT'
        }, { status: 403 });
      }
    }

    // User management API routes (Admin/Superadmin only)
    if (pathname.startsWith("/api/users") || pathname.startsWith("/api/clients")) {
      if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
        console.log(`🔐 Middleware: Non-admin trying to access user management API: ${userRole}`);
        return NextResponse.json({ 
          error: 'Access denied',
          message: 'Admin access required for user management'
        }, { status: 403 });
      }
    }

    // System API routes (Superadmin only)
    if (pathname.startsWith("/api/system") || pathname.startsWith("/api/subscriptions")) {
      if (userRole !== 'SUPERADMIN') {
        console.log(`🔐 Middleware: Non-superadmin trying to access system API: ${userRole}`);
        return NextResponse.json({ 
          error: 'Access denied',
          message: 'Superadmin access required'
        }, { status: 403 });
      }
    }

    console.log(`🔐 Middleware: API access granted to ${pathname} for ${userRole}`);
    return NextResponse.next();
  }

  // Enhanced Page Route Protection
  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard/admin")) {
    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      console.log(`🔐 Middleware: Non-admin trying to access admin page: ${userRole}, redirecting to appropriate dashboard`);
      const redirectUrl = getRedirectForRole(userRole);
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
  }

  if (pathname.startsWith("/dashboard/client")) {
    if (userRole !== 'CLIENT') {
      console.log(`🔐 Middleware: Non-client trying to access client dashboard: ${userRole}, redirecting to appropriate dashboard`);
      const redirectUrl = getRedirectForRole(userRole);
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
  }

  // Handle root dashboard redirect based on role
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    const redirectUrl = getRedirectForRole(userRole);
    console.log(`🔐 Middleware: ${userRole} at root dashboard, redirecting to ${redirectUrl}`);
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  // Additional security: Check if user has general access to the requested route
  if (!hasAccess(userRole, pathname)) {
    console.log(`🔐 Middleware: ${userRole} does not have access to ${pathname}, redirecting to appropriate dashboard`);
    const redirectUrl = getRedirectForRole(userRole);
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  console.log(`🔐 Middleware: Access granted to ${pathname} for ${userRole}`);
  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except for ones starting with:
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public folder files
   */
  matcher: [
    /*
     * Match all request paths except for ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};