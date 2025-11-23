import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    // Support both cookies and Authorization header
    let token = req.cookies.get("auth-token")?.value;
    
    if (!token) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-it";
    try {
      jwt.verify(token, JWT_SECRET);
    } catch(e) {
      return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
    }
    
    const body = await req.json();
    const { taskId, id, enabled } = body;

    // Support both parameter names for flexibility
    const targetId = taskId || id;
    
    if (!targetId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    // If enabled is provided, use it, otherwise toggle the current state
    let newEnabledState;
    if (enabled !== undefined) {
      newEnabledState = enabled;
    } else {
      // Get current state and toggle it
      const currentTask = await db.$queryRaw`
        SELECT enabled FROM "automation_tasks" WHERE id = ${targetId}
      `;
      newEnabledState = !(currentTask as any[])[0]?.enabled;
    }

    await db.$executeRaw`
      UPDATE "automation_tasks"
      SET enabled = ${newEnabledState}, updated_at = NOW()
      WHERE id = ${targetId}
    `;

    return NextResponse.json({ 
      success: true, 
      enabled: newEnabledState,
      taskId: targetId 
    });
  } catch (error: any) {
    console.error("Toggle Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
