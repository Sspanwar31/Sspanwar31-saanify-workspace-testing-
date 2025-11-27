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

  // Auth routes must open even without login
  "/login",
  "/signup",

  // Subscription + Payment public
  "/subscription/select-plan",
  "/subscription/payment",
  "/subscription/payment-status",
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
  const token = req.cookies.get("auth-token")?.value ?? null;

  // Allow API without blocking - including GitHub APIs
  if (pathname.startsWith("/api")) return NextResponse.next();

  // Allow public routes directly
  if (publicRoutes.some(r => pathname.startsWith(r))) return NextResponse.next();

  /* ────────────────────────────────────────────
     If logged user exists
  ───────────────────────────────────────────── */
  if (token) {
    const user = decodeJwtPayload(token);
    if (!user) {
      const res = NextResponse.redirect(new URL("/", req.url));
      res.cookies.delete("auth-token");
      return res;
    }

    const role = user.role?.toUpperCase();
    const subscriptionActive = user.subscriptionStatus === "ACTIVE";

    // Logged user opening /login or /signup → redirect dashboard
    if (authRoutes.includes(pathname)) {
      if (role === "ADMIN") return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      if (role === "CLIENT") return NextResponse.redirect(new URL("/dashboard/client", req.url));
    }

    // Dashboard Access Rules
    if (pathname.startsWith("/dashboard")) {
      if (role === "ADMIN") return NextResponse.next(); // Admin always allowed
      if (role === "CLIENT") {
        if (subscriptionActive) return NextResponse.next(); // Valid Subscription → Allowed
        else return NextResponse.redirect(new URL("/subscription/select-plan", req.url));
      }
    }

    return NextResponse.next();
  }

  /* ────────────────────────────────────────────
     If NO Token → only signup requires subscription
  ───────────────────────────────────────────── */

  if (!token) {
    // Direct signup not allowed → go to plans first
    if (pathname.startsWith("/signup")) {
      return NextResponse.redirect(new URL("/subscription/select-plan", req.url));
    }

    // Trying to open dashboard without subscription → redirect to plans
    if (dashboardRoutes.some(r => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL("/subscription/select-plan", req.url));
    }

    return NextResponse.redirect(new URL("/", req.url)); // Default → Landing Page
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};