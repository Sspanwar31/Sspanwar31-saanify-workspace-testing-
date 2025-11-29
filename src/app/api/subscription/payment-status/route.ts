import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/* ---------------------------------------------------------
   🔐 Extract User From Token (NextAuth Nahi — JWT based auth)
---------------------------------------------------------- */
async function getUserFromToken(request: Request) {
  try {
    const token =
      request.headers.get("cookie")?.split("auth-token=")[1]?.split(";")[0] ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    return await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true },
    });
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------
   🚀 Main API — Always 200 Response
   No 401 — UI will NEVER break now
---------------------------------------------------------- */

export async function GET(request: Request) {
  try {
    const user = await getUserFromToken(request);

    // ⛔ Not logged in — but DO NOT THROW 401
    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
          paymentStatus: "unknown", // UI will redirect to plan screen
        },
        { status: 200 }
      );
    }

    // 🧾 Get latest payment entry
    const payment = await db.paymentProof.findFirst({
      where: {
        userId: user.id,
        status: { in: ["pending", "approved", "rejected"] },
      },
      orderBy: { createdAt: "desc" },
    });

    let paymentStatus: "pending" | "completed" | "not-paid";

    // -------------------------------
    // FINAL LOGIC MAPPED FOR UI
    // -------------------------------
    if (!payment) {
      paymentStatus = "not-paid"; // never paid
    } else if (payment.status === "pending") {
      paymentStatus = "pending"; // waiting for admin
    } else if (payment.status === "approved") {
      paymentStatus = "completed"; // 🔥 UI expects this
    } else {
      paymentStatus = "not-paid"; // rejected = must reupload
    }

    return NextResponse.json(
      {
        authenticated: true,
        paymentStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("🔴 PAYMENT STATUS ERROR", error);
    return NextResponse.json(
      {
        authenticated: false,
        paymentStatus: "unknown",
      },
      { status: 200 }
    );
  }
}