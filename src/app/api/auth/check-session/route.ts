import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";
import { db } from "@/lib/db";

// Ensure this matches the secret used in your Login API
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Debug: Log all cookies received
    console.log("🔍 Check-session: All cookies received:", request.cookies.getAll()); // LOG
    
    // 1. Get token from Cookie (auth-token) - this will read httpOnly cookies
    const token = request.cookies.get("auth-token")?.value || 
                  request.headers.get("authorization")?.replace("Bearer ", "");

    console.log("🔍 Check-session: Token extracted:", token ? token.substring(0, 20) + '...' : 'NULL'); // LOG

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    console.log("🔍 Check-session: Token found, attempting verification..."); // LOG

    // 2. Verify JWT Token (Real Verification)
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log("🔍 Check-session: Token verified successfully", { userId: decoded.userId, role: decoded.role }); // LOG
    } catch (err) {
      console.log("❌ Check-session: Token verification failed", err); // LOG
      
      // Try to refresh the token
      const refreshToken = request.cookies.get("refresh-token")?.value;
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${request.nextUrl.origin}/api/auth/refresh`, {
            method: 'POST',
            headers: {
              'Cookie': request.headers.get('cookie') || ''
            }
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            console.log("✅ Check-session: Token refreshed successfully");
            return NextResponse.json({
              authenticated: true,
              user: refreshData.user
            });
          }
        } catch (refreshError) {
          console.log("❌ Check-session: Token refresh failed", refreshError);
        }
      }
      
      // Clear invalid cookies
      const response = NextResponse.json(
        { authenticated: false, error: 'Token expired or invalid' },
        { status: 200 }
      );
      response.cookies.delete('auth-token');
      response.cookies.delete('refresh-token');
      return response;
    }

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    // 3. Fetch Real User from Database (To get latest Role)
    console.log("🔍 Check-session: Fetching user from DB for userId:", decoded.userId); // LOG
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,            // ✅ Correct Role (ADMIN) yahan se aayega
        societyAccountId: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      console.log("❌ Check-session: User not found in DB"); // LOG
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    console.log("✅ Check-session: User found in DB", { id: user.id, email: user.email, role: user.role }); // LOG

    // 4. Return Real User Data with normalized role
    let normalizedRole = user.role?.toUpperCase();
    
    // Normalize role names for consistency
    if (normalizedRole === 'ADMIN') {
      normalizedRole = 'ADMIN';
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: normalizedRole, // Always return 'ADMIN' for consistency
        societyAccountId: user.societyAccountId,
        trialEndsAt: user.trialEndsAt,
        subscriptionEndsAt: user.subscriptionEndsAt
      }
    });

  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { authenticated: false },
      { status: 200 }
    );
  }
}
