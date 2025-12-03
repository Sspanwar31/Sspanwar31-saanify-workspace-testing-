import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper: get user from JWT token
async function getUserFromToken(request: Request) {
  const token =
    request.headers
      .get("cookie")
      ?.split("auth-token=")[1]
      ?.split(";")[0] ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true },
    });
    return user;
  } catch (err) {
    return null;
  }
}

export async function GET(request: Request) {
  let token = "";
  let user = null;
  let paymentProof = null;
  let pendingPayment = null;
  let paymentStatus = "unknown";

  try {
    // Get user
    token =
      request.headers
        .get("cookie")
        ?.split("auth-token=")[1]
        ?.split(";")[0] ||
      request.headers.get("authorization")?.replace("Bearer ", "");
    user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
          paymentStatus: "unknown",
          debug: { tokenReceived: token, userFound: null },
        },
        { status: 200 }
      );
    }

    // Fetch payment proof & pending payment concurrently
    [paymentProof, pendingPayment] = await Promise.all([
      db.paymentProof.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      db.pendingPayment.findFirst({ // Fixed table name
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Determine payment status
    if (paymentProof && paymentProof.status === "approved") {
      paymentStatus = "completed";
    } else if (paymentProof && paymentProof.status === "pending") {
      paymentStatus = "pending";
    } else if (paymentProof && paymentProof.status === "rejected") {
      paymentStatus = "not-paid";
    } else if (pendingPayment && pendingPayment.status === "pending") {
      paymentStatus = "pending";
    } else {
      paymentStatus = "not-paid";
    }

    return NextResponse.json(
      {
        authenticated: true,
        paymentStatus,
        paymentDetails: {
          paymentProof: paymentProof ? {
            id: paymentProof.id,
            plan: paymentProof.plan,
            amount: paymentProof.amount,
            transactionId: paymentProof.transactionId,
            status: paymentProof.status,
            createdAt: paymentProof.createdAt
          } : null,
          pendingPayment: pendingPayment ? {
            id: pendingPayment.id,
            plan: pendingPayment.plan,
            amount: pendingPayment.amount,
            transactionId: pendingPayment.transactionId,
            status: pendingPayment.status,
            createdAt: pendingPayment.createdAt
          } : null
        },
        debug: {
          tokenReceived: token,
          userFound: user.id,
          paymentProofFound: paymentProof,
          pendingPaymentFound: pendingPayment,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PAYMENT STATUS ERROR:", error);
    return NextResponse.json(
      {
        authenticated: false,
        paymentStatus: "unknown",
        debug: {
          tokenReceived: token,
          userFound: user ? user.id : null,
          paymentProofFound: paymentProof,
          pendingPaymentFound: pendingPayment,
          errorMessage: error instanceof Error ? error.message : error,
        },
      },
      { status: 200 }
    );
  }
}