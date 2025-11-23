import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // Create a demo client
    const demoUser = await db.user.create({
      data: {
        name: "Demo Society",
        email: "demo@saanify.com",
        role: "CLIENT",
        isActive: true,
        emailVerified: new Date()
      }
    });

    const demoSociety = await db.societyAccount.create({
      data: {
        name: "Demo Housing Society",
        adminName: "Demo Admin",
        email: "demo@saanify.com",
        phone: "+91 9876543210",
        address: "123 Demo Street, Demo City",
        subscriptionPlan: "TRIAL",
        status: "TRIAL",
        trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    });

    // Link user to society
    await db.user.update({
      where: { id: demoUser.id },
      data: { societyAccountId: demoSociety.id }
    });

    return NextResponse.json({
      success: true,
      message: "Demo client created successfully",
      client: {
        id: demoUser.id,
        name: "Demo Society",
        email: "demo@saanify.com",
        plan: "TRIAL"
      }
    });

  } catch (err: any) {
    console.error("DEMO CLIENT CREATION FAILED:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}