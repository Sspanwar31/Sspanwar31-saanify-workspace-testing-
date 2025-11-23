import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // Create default automation tasks
    const defaultTasks = [
      {
        task_name: 'database-backup',
        description: 'Create full database backup',
        schedule: 'manual',
        enabled: true,
        last_run_status: 'pending',
        last_run_at: null
      },
      {
        task_name: 'schema-sync',
        description: 'Sync database schema',
        schedule: 'manual',
        enabled: true,
        last_run_status: 'pending',
        last_run_at: null
      },
      {
        task_name: 'health-check',
        description: 'Run system health check',
        schedule: 'hourly',
        enabled: true,
        last_run_status: 'pending',
        last_run_at: null
      },
      {
        task_name: 'clear-cache',
        description: 'Clear system cache',
        schedule: 'manual',
        enabled: true,
        last_run_status: 'pending',
        last_run_at: null
      }
    ];

    // Insert tasks if they don't exist
    for (const task of defaultTasks) {
      try {
        await db.automationTask.upsert({
          where: { task_name: task.task_name },
          update: task,
          create: task
        });
      } catch (e) {
        console.log(`Task ${task.task_name} might already exist:`, e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Automation tasks initialized successfully",
      tasks: defaultTasks.length
    });

  } catch (err: any) {
    console.error("INITIALIZATION FAILED:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}