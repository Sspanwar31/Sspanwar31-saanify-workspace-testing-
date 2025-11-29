import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Enhanced polling API for real-time payment status updates
async function getUserFromToken(request: Request) {
  try {
    const token =
      request.headers.get("cookie")?.split("auth-token=")[1]?.split(";")[0] ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    return await db.user.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        name: true, 
        email: true,
        subscriptionStatus: true,
        plan: true,
        expiryDate: true,
        subscriptionEndsAt: true,
        trialEndsAt: true
      },
    });
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        paymentStatus: "unknown",
        shouldRedirect: true
      }, { status: 200 });
    }

    // Get latest payment from both tables
    const [pendingPayment, paymentProof] = await Promise.all([
      db.pendingPayment.findFirst({
        where: {
          userId: user.id,
          status: { in: ["pending", "approved", "rejected"] },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.paymentProof.findFirst({
        where: {
          userId: user.id,
          status: { in: ["pending", "approved", "rejected"] },
        },
        orderBy: { createdAt: "desc" },
      })
    ]);

    const payment = pendingPayment || paymentProof;
    
    let paymentStatus: "pending" | "completed" | "not-paid" | "expired" | "unknown";
    let hasActiveSubscription = false;
    let shouldRedirect = false;

    // Determine payment status and subscription state
    if (user.subscriptionStatus === 'ACTIVE' && user.expiryDate && new Date(user.expiryDate) > new Date()) {
      paymentStatus = "completed";
      hasActiveSubscription = true;
    } else if (payment) {
      if (payment.status === "pending") {
        paymentStatus = "pending";
      } else if (payment.status === "approved") {
        paymentStatus = "completed";
      } else if (payment.status === "rejected") {
        paymentStatus = "not-paid";
        shouldRedirect = true; // Redirect to payment page if rejected
      } else {
        paymentStatus = "unknown";
      }
    } else {
      paymentStatus = "not-paid";
      shouldRedirect = true; // Redirect to payment page if no payment
    }

    // Check if subscription is expired
    if (user.expiryDate && new Date(user.expiryDate) < new Date()) {
      paymentStatus = "expired";
      shouldRedirect = true;
    }

    // Calculate countdown
    let countdown = null;
    const relevantDate = user.trialEndsAt || user.expiryDate;
    if (relevantDate && new Date(relevantDate) > new Date()) {
      const now = new Date();
      const target = new Date(relevantDate);
      const diffTime = target.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      const diffMinutes = Math.ceil(diffTime / (1000 * 60));
      
      countdown = {
        days: diffDays,
        hours: diffHours,
        minutes: diffMinutes,
        message: diffDays > 0 ? `${diffDays} days remaining` : 
                  diffHours > 0 ? `${diffHours} hours remaining` : 
                  `${diffMinutes} minutes remaining`,
        expiresAt: relevantDate
      };
    }

    // Determine polling behavior
    const polling = {
      enabled: paymentStatus === "pending",
      interval: 4000, // 4 seconds
      maxRetries: 300, // Maximum 300 retries (20 minutes)
      currentRetry: 0
    };

    return NextResponse.json({
      authenticated: true,
      paymentStatus,
      hasActiveSubscription,
      shouldRedirect,
      polling,
      subscription: {
        status: user.subscriptionStatus,
        plan: user.plan,
        expiryDate: user.expiryDate,
        trialEndsAt: user.trialEndsAt
      },
      payment: payment ? {
        id: payment.id,
        plan: payment.plan,
        amount: payment.amount,
        txnId: payment.txnId,
        status: payment.status,
        createdAt: payment.createdAt,
        screenshotUrl: payment.screenshotUrl
      } : null,
      countdown,
      actions: {
        canRetry: paymentStatus === "not-paid" || paymentStatus === "expired",
        canViewHistory: true,
        canUploadNew: paymentStatus !== "pending"
      }
    }, { status: 200 });

  } catch (error) {
    console.error("🔴 PAYMENT POLLING ERROR", error);
    return NextResponse.json({
      authenticated: false,
      paymentStatus: "unknown",
      shouldRedirect: true,
      error: "Failed to check payment status"
    }, { status: 200 });
  }
}

// POST endpoint for manual polling trigger
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lastPaymentId } = body;
    
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        error: "Authentication required"
      }, { status: 200 });
    }

    // Check if payment status has changed since last check
    const latestPayment = await db.pendingPayment.findFirst({
      where: {
        userId: user.id,
        ...(lastPaymentId && { id: { not: lastPaymentId } })
      },
      orderBy: { createdAt: "desc" },
    });

    const hasChanged = latestPayment && latestPayment.id !== lastPaymentId;

    return NextResponse.json({
      authenticated: true,
      hasChanged,
      latestPayment: hasChanged ? {
        id: latestPayment.id,
        status: latestPayment.status,
        updatedAt: latestPayment.updatedAt
      } : null
    });

  } catch (error) {
    console.error("🔴 PAYMENT POLLING POST ERROR", error);
    return NextResponse.json({
      authenticated: false,
      error: "Failed to check for updates"
    }, { status: 200 });
  }
}