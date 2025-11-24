import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/signup", "/api/auth"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Static files and assets
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/public")) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = req.cookies.get("auth-token")?.value;
  
  if (!token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL("/login", req.url));
  }

  let decoded: any = null;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // Token is invalid or expired, clear it and redirect to login
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("auth-token");
    return res;
  }

  const role = decoded.role?.toUpperCase() || "";

  // Protect Superadmin routes
  if (pathname.startsWith("/superadmin")) {
    if (role !== "SUPERADMIN") {
      // If user is not Superadmin, redirect to appropriate dashboard
      if (role === "CLIENT") {
        return NextResponse.redirect(new URL("/dashboard/client", req.url));
      } else if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      } else {
        // Fallback to login for unknown roles
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
  }

  // Protect Superadmin API routes
  if (pathname.startsWith("/api/superadmin")) {
    if (role !== "SUPERADMIN") {
      return new NextResponse(
        JSON.stringify({ error: 'Access denied - Superadmin privileges required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Protect Admin routes
  if (pathname.startsWith("/admin")) {
    if (role !== "SUPERADMIN" && role !== "ADMIN") {
      if (role === "CLIENT") {
        return NextResponse.redirect(new URL("/dashboard/client", req.url));
      } else {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
  }

  // Protect Client dashboard routes
  if (pathname.startsWith("/dashboard/client")) {
    if (role !== "CLIENT" && role !== "SUPERADMIN") {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      } else {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
  }

  // Allow access to other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};