import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper: JWT Token ko decode karne ke liye (Supabase ki jarurat nahi)
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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Token Retrieve (Cookie 'auth-token' se)
  const token = req.cookies.get("auth-token");

  // 2. Protect Admin Routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/super-admin")) {
    
    // Agar token nahi hai -> Login pe bhejo
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Token Decode karo
    const user = decodeJwtPayload(token.value);
    
    // Agar token invalid hai -> Login pe bhejo
    if (!user) {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("auth-token");
      return response;
    }

    // Role Check (Case Insensitive & Flexible)
    const role = user?.role?.toLowerCase() || "";
    
    // Agar role me 'admin' ya 'super' nahi hai -> Access Denied
    if (!role.includes("admin") && !role.includes("super")) {
      return NextResponse.redirect(new URL("/not-authorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Kin routes par middleware chalega
    // Login, API, Static files ko chhodkar sab par
    '/((?!login|register|api|not-authorized|_next/static|_next/image|favicon.ico).*)',
  ],
};
