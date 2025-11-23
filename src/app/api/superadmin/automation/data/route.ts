import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-it";

export async function GET(req: NextRequest) {
  try {
    // 1. Auth Check (Token verify)
    const token = req.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    try {
       jwt.verify(token, JWT_SECRET);
    } catch(e) {
       return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
    }

    // 2. Fetch Data from DB
    // Raw SQL use kar rahe hain taaki agar Prisma schema sync na ho tab bhi chale
    const tasks = await db.$queryRaw`SELECT * FROM "automation_tasks" ORDER BY created_at DESC`;
    const logs = await db.$queryRaw`SELECT * FROM "automation_logs" ORDER BY run_time DESC LIMIT 50`;
    
    // Settings table optional hai, agar error aaye to empty array bhej denge
    let settings = [];
    try {
      settings = await db.$queryRaw`SELECT * FROM "automation_settings"`;
    } catch(e) {}

    return NextResponse.json({
      success: true,
      tasks,
      logs,
      settings
    });

  } catch (error: any) {
    console.error("Automation Data Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
