// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Decode JWT
function decodeJwtPayload(tokenValue: string) {
  try {
    const base64Url = tokenValue.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/* ────────────────────────────────────────────
   PUBLIC PAGES (No login required)
──────────────────────────────────────────── */
const publicRoutes = [
  "/", 
  "/about",
  "/contact",
  "/subscription",
  "/subscription/select-plan",
  "/subscription/payment-upload",
  "/subscription/waiting",

  // Auth routes must open even without login
  "/login",
  
  // GitHub backup should work without authentication
  "/api/github",
];

/* ────────────────────────────────────────────
   If logged-in user tries login/signup redirect to dashboard
──────────────────────────────────────────── */
const authRoutes = ["/login", "/signup"];

/* ────────────────────────────────────────────
   Dashboard Protected Routes
──────────────────────────────────────────── */
const dashboardRoutes = ["/dashboard", "/dashboard/admin", "/dashboard/client"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API routes entirely - GitHub backup API should work without authentication
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth-token")?.value ?? null;

  // Allow public routes directly
  if (publicRoutes.some(r => pathname.startsWith(r))) return NextResponse.next();

  /* ────────────────────────────────────────────
     IF NO TOKEN
  ───────────────────────────────────────────── */

  if (!token) {
    // /login & /signup allowed
    if (authRoutes.includes(pathname)) return NextResponse.next();
    
    // /subscription allowed
    if (pathname.startsWith("/subscription")) return NextResponse.next();
    
    // /dashboard = redirect → subscription
    if (dashboardRoutes.some(r => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL("/subscription", req.url));
    }

    return NextResponse.next();
  }

  /* ────────────────────────────────────────────
     IF TOKEN EXISTS
  ───────────────────────────────────────────── */
  
  if (token) {
    const user = decodeJwtPayload(token);
    if (!user) {
      const res = NextResponse.redirect(new URL("/", req.url));
      res.cookies.delete("auth-token");
      return res;
    }

    const role = user.role?.toUpperCase();
    const subscriptionStatus = user.subscriptionStatus?.toUpperCase();
    const expiryDate = user.expiryDate ? new Date(user.expiryDate) : null;
    const isExpired = expiryDate && expiryDate < new Date();

    // Existing Admin redirect logic must REMAIN unchanged
    if (role === "ADMIN") {
      // Allow admin to access home page
      if (pathname === "/") {
        return NextResponse.next();
      }
      // Admin can access everything else
      if (authRoutes.includes(pathname)) {
        return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      }
      return NextResponse.next();
    }

    // Check for PENDING payment
    if (subscriptionStatus === "PENDING") {
      // Block signup, dashboard → show waiting page
      if (pathname === "/signup" || dashboardRoutes.some(r => pathname.startsWith(r))) {
        return NextResponse.redirect(new URL("/subscription/waiting", req.url));
      }
    }

    // If subscription ACTIVE = allow dashboard
    if (subscriptionStatus === "ACTIVE" && !isExpired) {
      if (authRoutes.includes(pathname)) {
        return NextResponse.redirect(new URL("/dashboard/client", req.url));
      }
      if (dashboardRoutes.some(r => pathname.startsWith(r))) {
        return NextResponse.next();
      }
    }

    // If subscription EXPIRED = redirect to subscription
    if (subscriptionStatus === "EXPIRED" || isExpired) {
      if (authRoutes.includes(pathname)) {
        return NextResponse.next(); // Allow expired users to signup again
      }
      if (dashboardRoutes.some(r => pathname.startsWith(r))) {
        return NextResponse.redirect(new URL("/subscription", req.url));
      }
    }

    // If NONE or TRIAL = redirect to subscription for dashboard access
    if (subscriptionStatus === "NONE" || subscriptionStatus === "TRIAL") {
      if (authRoutes.includes(pathname)) {
        return NextResponse.next(); // Allow signup
      }
      if (dashboardRoutes.some(r => pathname.startsWith(r))) {
        return NextResponse.redirect(new URL("/subscription", req.url));
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};