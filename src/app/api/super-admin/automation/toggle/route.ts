import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { id, enabled } = await req.json();

    await db.$executeRaw`
      UPDATE "automation_tasks"
      SET enabled = ${enabled}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, enabled });
  } catch (error: any) {
    console.error("Toggle Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
