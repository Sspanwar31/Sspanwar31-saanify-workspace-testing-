import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

// Ensure this matches the secret used in your Login API
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-it";

export async function GET(request: NextRequest) {
  try {
    // 1. Get token from Cookie (auth-token)
    // Header check is optional fallback
    const token = request.cookies.get("auth-token")?.value || 
                  request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: "No authentication token found" },
        { status: 401 }
      );
    }

    // 2. Verify JWT Token (Real Verification)
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { authenticated: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { authenticated: false, error: "Invalid token payload" },
        { status: 401 }
      );
    }

    // 3. Fetch Real User from Database (To get latest Role)
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,            // ✅ Correct Role (SUPER_ADMIN) yahan se aayega
        societyAccountId: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { authenticated: false, error: "User no longer exists" },
        { status: 401 }
      );
    }

    // 4. Return Real User Data
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role, // Ab ye 'SUPER_ADMIN' bhejega
        societyAccountId: user.societyAccountId
      }
    });

  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { authenticated: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
