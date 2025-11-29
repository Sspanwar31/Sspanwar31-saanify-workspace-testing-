import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to get user from token
async function getUserFromToken(request: Request) {
  const token = request.headers.get("cookie")?.split("auth-token=")[1]?.split(";")[0] || 
                request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true }
    });
    
    return user;
  } catch (error) {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    // Get authenticated user using existing JWT system
    const user = await getUserFromToken(request);

    // ❗ If no login → do NOT return 401
    if (!user) {
      return NextResponse.json(
        { authenticated: false, paymentStatus: "unknown" },
        { status: 200 }
      );
    }

    // If logged-in → return actual payment status
    // Get the most recent payment for this user
    const payment = await db.paymentProof.findFirst({
      where: { 
        userId: user.id,
        status: { in: ['pending', 'approved', 'rejected'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    let paymentStatus: string;
    if (!payment) {
      paymentStatus = "not-paid";
    } else {
      paymentStatus = payment.status; // "pending", "approved", or "rejected"
    }

    return NextResponse.json(
      { authenticated: true, paymentStatus },
      { status: 200 }
    );

  } catch (error) {
    console.error("PAYMENT STATUS ERROR:", error);
    return NextResponse.json(
      { authenticated: false, paymentStatus: "unknown" },
      { status: 200 }
    );
  }
}