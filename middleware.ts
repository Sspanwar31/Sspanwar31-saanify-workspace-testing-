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
  "/api/admin/automation/run"
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log(`🔐 Middleware: Processing ${pathname}`);

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  // Check if it's a public API route
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));

  // Allow public routes without authentication
  if (isPublicRoute || isPublicApiRoute) {
    console.log(`🔐 Middleware: Public route, allowing access to ${pathname}`);
    return NextResponse.next();
  }

  // Get token from cookie
  const token = req.cookies.get("auth-token");

  // If no token and not a public route, redirect to login
  if (!token) {
    console.log(`🔐 Middleware: No token, redirecting to login from ${pathname}`);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Decode token to get user info
  const user = decodeJwtPayload(token.value);
  
  // If token is invalid, clear it and redirect to login
  if (!user) {
    console.log(`🔐 Middleware: Invalid token, clearing and redirecting to login`);
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("auth-token");
    response.cookies.delete("refresh-token");
    return response;
  }

  const userRole = user?.role?.toUpperCase() || 'CLIENT';
  console.log(`🔐 Middleware: User role detected as ${userRole} for ${pathname}`);

  // API Route Protection
  if (pathname.startsWith("/api/admin")) {
    // Only ADMIN role can access admin API routes
    if (userRole !== 'ADMIN') {
      console.log(`🔐 Middleware: Non-admin trying to access admin API: ${userRole}`);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
  }

  if (pathname.startsWith("/api/dashboard/client")) {
    // Only CLIENT role (and ADMIN for support) can access client API routes
    if (userRole !== 'CLIENT' && userRole !== 'ADMIN') {
      console.log(`🔐 Middleware: Non-client trying to access client API: ${userRole}`);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
  }

  // Page Route Protection
  if (pathname.startsWith("/admin")) {
    // Only ADMIN role can access admin pages
    if (userRole !== 'ADMIN') {
      console.log(`🔐 Middleware: Non-admin trying to access admin page: ${userRole}, redirecting to /dashboard/client`);
      return NextResponse.redirect(new URL("/dashboard/client", req.url));
    }
    console.log(`🔐 Middleware: Admin access granted for ${userRole} to ${pathname}`);
  }

  if (pathname.startsWith("/dashboard/client")) {
    // Only CLIENT role (and ADMIN for support) can access client dashboard
    if (userRole !== 'CLIENT' && userRole !== 'ADMIN') {
      console.log(`🔐 Middleware: Non-client trying to access client dashboard: ${userRole}, redirecting to /not-authorized`);
      return NextResponse.redirect(new URL("/not-authorized", req.url));
    }
    console.log(`🔐 Middleware: Client access granted for ${userRole} to ${pathname}`);
  }

  // Handle root dashboard redirect based on role
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    if (userRole === 'ADMIN') {
      console.log(`🔐 Middleware: Admin at root dashboard, redirecting to /admin`);
      return NextResponse.redirect(new URL("/admin", req.url));
    } else {
      console.log(`🔐 Middleware: Client at root dashboard, redirecting to /dashboard/client`);
      return NextResponse.redirect(new URL("/dashboard/client", req.url));
    }
  }

  console.log(`🔐 Middleware: Access granted to ${pathname} for ${userRole}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};