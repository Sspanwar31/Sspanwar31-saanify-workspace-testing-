import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper: Decode JWT token
function decodeJwtPayload(tokenValue: string) {
  try {
    const base64Url = tokenValue.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
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
  "/auth/signup",
  "/subscription/select-plan",
  "/subscription/payment-upload",
  "/about",
  "/contact",
  "/not-authorized",
  "/favicon.ico"
];

// Auth routes that should redirect logged-in users
const authRoutes = [
  "/login",
  "/signup",
  "/auth/signup"
];

// Dashboard routes that require role-based access
const dashboardRoutes = [
  "/dashboard",
  "/dashboard/client",
  "/dashboard/admin"
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API routes entirely
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Public routes
  const isPublicRoute = publicRoutes.includes(pathname) ||
    publicRoutes.some(route => pathname.startsWith(route + "/"));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get auth token
  const token = req.cookies.get("auth-token");

  if (token) {
    const user = decodeJwtPayload(token.value);

    // Invalid token → redirect login
    if (!user) {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("auth-token");
      return response;
    }

    const userRole = user?.role?.toUpperCase() || "CLIENT";
    const hasActivePlan = user?.subscriptionActive; // Boolean from token or backend

    // Auth routes: redirect logged-in users
    if (authRoutes.some(route => pathname.startsWith(route))) {
      if (userRole === "ADMIN") return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      return hasActivePlan
        ? NextResponse.redirect(new URL("/dashboard/client", req.url))
        : NextResponse.redirect(new URL("/subscription/select-plan", req.url));
    }

    // Dashboard routes
    if (pathname.startsWith("/dashboard/admin")) {
      if (userRole !== "ADMIN") return NextResponse.redirect(new URL("/dashboard/client", req.url));
    }

    if (pathname.startsWith("/dashboard/client")) {
      if (userRole !== "CLIENT") return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      // Client with no active subscription → redirect to subscription page
      if (!hasActivePlan) return NextResponse.redirect(new URL("/subscription/select-plan", req.url));
    }

    // Dashboard root
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      if (userRole === "ADMIN") return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      return hasActivePlan
        ? NextResponse.redirect(new URL("/dashboard/client", req.url))
        : NextResponse.redirect(new URL("/subscription/select-plan", req.url));
    }

    return NextResponse.next();
  }

  // No token → handle guest access
  if (!token) {
    // Auth routes allowed
    if (authRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }
    // Dashboard routes → redirect to subscription page
    if (dashboardRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/subscription/select-plan", req.url));
    }
    // Other protected routes → subscription page
    return NextResponse.redirect(new URL("/subscription/select-plan", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match frontend routes, exclude API and static
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};