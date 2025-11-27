import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Decode JWT Token
function decodeJwt(token: string) {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    return JSON.parse(atob(base64.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

/* -------------------- PUBLIC ACCESS ALLOWED PAGES -------------------- */
const PUBLIC_PATHS = [
  "/",                   // Landing page - redirects to subscription selection
  "/login",
  "/signup", 
  "/auth/signup",
  "/about",
  "/contact",
  "/subscription/select-plan",
  "/subscription/payment-upload",
  "/not-authorized",
  "/favicon.ico"
];

/* -------------------- AUTH PAGES (Redirect if logged in) -------------- */
const AUTH_PAGES = ["/login", "/signup", "/auth/signup"];

/* -------------------- PROTECTED DASHBOARD ROUTES ---------------------- */
const DASHBOARD_CLIENT = "/dashboard/client";
const DASHBOARD_ADMIN  = "/dashboard/admin";

/* -------------------- SUBSCRIPTION CHECKING ---------------------- */
async function checkSubscriptionStatus(userId: string) {
  try {
    // This would normally call your database
    // For now, we'll implement basic subscription checking
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/client/subscription`, {
      headers: {
        'Cookie': `auth-token=${userId}` // This is a simplified approach
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        hasValidSubscription: data.status === 'ACTIVE' || 
                              (data.status === 'TRIAL' && data.daysRemaining > 0) ||
                              data.status === 'PENDING_PAYMENT',
        status: data.status,
        daysRemaining: data.daysRemaining
      };
    }
    
    return { hasValidSubscription: false, status: 'UNKNOWN' };
  } catch (error) {
    console.error('Subscription check error:', error);
    return { hasValidSubscription: false, status: 'ERROR' };
  }
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get("auth-token")?.value || null;
  const user = token ? decodeJwt(token) : null;
  const role = user?.role?.toUpperCase() || null;

  /* ---------------------------------------------------------------
      1️⃣ Guest (No login) — Allowed public only
  --------------------------------------------------------------- */
  if (!token) {
    // Public pages allowed without login
    if (PUBLIC_PATHS.some(p => path.startsWith(p))) {
      return NextResponse.next();
    }

    // Trying to open dashboard without subscription → redirect to subscription page
    if (path.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/subscription/select-plan", req.url));
    }

    // For other protected routes, redirect to subscription selection
    return NextResponse.redirect(new URL("/subscription/select-plan", req.url));
  }

  /* ---------------------------------------------------------------
      2️⃣ Logged-in user — Should NOT access login/signup
  --------------------------------------------------------------- */
  if (AUTH_PAGES.some(p => path.startsWith(p))) {
    return NextResponse.redirect(new URL(role === "ADMIN" ? DASHBOARD_ADMIN : DASHBOARD_CLIENT, req.url));
  }

  /* ---------------------------------------------------------------
      3️⃣ If logged-in user opens "/" → check subscription first
  --------------------------------------------------------------- */
  if (path === "/") {
    // Check subscription status before redirecting
    const subscriptionStatus = await checkSubscriptionStatus(user!.userId);
    
    if (!subscriptionStatus.hasValidSubscription) {
      return NextResponse.redirect(new URL("/subscription/select-plan", req.url));
    }
    
    return NextResponse.redirect(new URL(role === "ADMIN" ? DASHBOARD_ADMIN : DASHBOARD_CLIENT, req.url));
  }

  /* ---------------------------------------------------------------
      4️⃣ Dashboard Access — Check subscription for CLIENTS only
  --------------------------------------------------------------- */
  if (path.startsWith("/dashboard/client")) {
    // Check subscription status for client dashboard access
    const subscriptionStatus = await checkSubscriptionStatus(user!.userId);
    
    if (!subscriptionStatus.hasValidSubscription) {
      if (subscriptionStatus.status === 'PENDING_PAYMENT') {
        return NextResponse.redirect(new URL("/client/subscription/status", req.url));
      } else {
        return NextResponse.redirect(new URL("/subscription/select-plan", req.url));
      }
    }
  }

  /* ---------------------------------------------------------------
      5️⃣ Role Based Page Access
  --------------------------------------------------------------- */
  if (path.startsWith("/dashboard/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL(DASHBOARD_CLIENT, req.url));
  }

  if (path.startsWith("/dashboard/client") && role !== "CLIENT") {
    return NextResponse.redirect(new URL(DASHBOARD_ADMIN, req.url));
  }

  /* ---------------------------------------------------------------
      6️⃣ Subscription Related Pages — Always allowed for authenticated users
  --------------------------------------------------------------- */
  if (path.startsWith("/subscription/") || path.startsWith("/client/subscription")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|static|api|favicon.ico).*)",
  ],
};