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
const publicRoutes = ["/", "/login", "/signup", "/api/auth"];
const publicRoutePatterns = [
  "/",
  "/login",
  "/signup", 
  "/api/auth",
  "/api/auth/",
  "/not-authorized",
  "/favicon.ico",
  "/_next",
  "/api/health"
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if it's a public route
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

  // Get token from cookie
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
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};