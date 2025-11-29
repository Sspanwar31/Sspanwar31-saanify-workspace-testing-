import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper: JWT Token ko decode karne ke liye
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
const publicRoutePatterns = [
  "/",
  "/login",
  "/signup", 
  "/api/auth",
  "/api/auth/",
  "/api/backup",
  "/api/admin/automation",
  "/api/integrations",
  "/api/health",
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
  "/api/check-supabase",
  "/api/glm",
  "/api/ai",
  "/api/users",
  "/api/clients",
  "/api/uploads",
  "/not-authorized",
  "/favicon.ico",
  "/_next"
];

// New user onboarding routes (only for unauthenticated users)
const newSubscriptionRoutes = [
  "/subscription",
  "/subscription/",
  "/subscription/select-plan",
  "/subscription/payment-upload",
  "/subscription/history"
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware entirely for API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow uploads directory without authentication
  if (pathname.startsWith('/uploads/')) {
    return NextResponse.next();
  }

  // PRIORITY 1: Allow client subscription upgrade and all client routes with authentication only
  if (pathname.startsWith('/client/')) {
    const token = req.cookies.get("auth-token");
    
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const user = decodeJwtPayload(token.value);
    
    if (!user) {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("auth-token");
      return response;
    }

    const userRole = user?.role?.toUpperCase() || 'CLIENT';

    // Only CLIENT role can access client routes
    if (userRole !== 'CLIENT') {
      if (userRole === 'ADMIN') {
        return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      } else {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Allow all client routes including /client/subscription/upgrade without subscription checks
    return NextResponse.next();
  }

  // PRIORITY 2: DENY access to new user subscription routes for authenticated users
  if (newSubscriptionRoutes.some(route => pathname.startsWith(route))) {
    const token = req.cookies.get("auth-token");
    
    if (!token) {
      // Allow unauthenticated users to access subscription selection
      return NextResponse.next();
    }

    const user = decodeJwtPayload(token.value);
    
    if (!user) {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("auth-token");
      return response;
    }

    const userRole = user?.role?.toUpperCase() || 'CLIENT';

    // Redirect authenticated users AWAY from new subscription routes
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard/client", req.url));
    }
  }

  // PRIORITY 3: Check if it's a public route
  const isPublicRoute = publicRoutePatterns.some(pattern => {
    if (pattern.endsWith('/')) {
      return pathname.startsWith(pattern);
    }
    return pathname === pattern || pathname.startsWith(pattern + '/');
  });

  // Allow public routes without authentication
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // PRIORITY 4: Require authentication for all other routes
  const token = req.cookies.get("auth-token");

  // If no token and not a public route, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Decode token to get user info
  const user = decodeJwtPayload(token.value);
  
  // If token is invalid, clear it and redirect to login
  if (!user) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("auth-token");
    return response;
  }

  const userRole = user?.role?.toUpperCase() || 'CLIENT';

  // Role-based routing logic
  if (pathname.startsWith("/admin")) {
    // Only ADMIN role can access admin routes
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL("/dashboard/client", req.url));
    }
  }

  if (pathname.startsWith("/dashboard/client")) {
    // Only CLIENT role can access client dashboard
    if (userRole !== 'CLIENT') {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }
  }

  if (pathname.startsWith("/dashboard/admin")) {
    // Only ADMIN role can access admin dashboard
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL("/dashboard/client", req.url));
    }
  }

  // Handle root dashboard redirect based on role
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard/client", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except API routes and static files
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};