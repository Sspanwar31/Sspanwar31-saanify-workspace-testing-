// route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

async function runSql(sql: string) {
  try {
    await db.$executeRawUnsafe(sql);
  } catch (e) {
    // Log but do not throw — we want idempotent best-effort behavior
    console.error("runSql failed:", e);
  }
}

async function ensureColumn(table: string, column: string, type: string) {
  try {
    // Use ALTER ... ADD COLUMN IF NOT EXISTS for safe, idempotent column creation
    await db.$executeRawUnsafe(
      `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS "${column}" ${type};`
    );
  } catch (e) {
    console.error(`ensureColumn failed (${table}.${column}):`, e);
  }
}

async function autoFixAutomationSettings() {
  const table = "public.automation_settings";
  const columns: Array<[string, string]> = [
    ["key", "text UNIQUE NOT NULL"],
    ["value", "jsonb"],
    ["description", "text"],
    ["group", "text"],
    ["schedule", "text"],
    ["enabled", "boolean DEFAULT false"],
    ["created_at", "timestamptz DEFAULT now()"],
    ["updated_at", "timestamptz DEFAULT now()"]
  ];

  for (const [col, type] of columns) {
    await ensureColumn(table, col, type);
  }
}

async function autoFixAutomationTasks() {
  const table = "public.automation_tasks";
  const columns: Array<[string, string]> = [
    ["task_name", "text UNIQUE NOT NULL"],
    ["description", "text"],
    ["schedule", "text DEFAULT 'manual'"],
    ["enabled", "boolean DEFAULT true"],
    ["last_run_status", "text"],
    ["last_run_at", "timestamptz"],
    ["created_at", "timestamptz DEFAULT now()"]
  ];

  for (const [col, type] of columns) {
    await ensureColumn(table, col, type);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const setupKey = body?.setup_key;

    if (!process.env.SETUP_KEY) {
      return NextResponse.json(
        { success: false, message: "ENV ERROR: SETUP_KEY missing" },
        { status: 500 }
      );
    }
    if (setupKey !== process.env.SETUP_KEY) {
      return NextResponse.json(
        { success: false, message: "Invalid setup_key" },
        { status: 401 }
      );
    }

    // 1) Ensure required extensions (safe to run repeatedly)
    await runSql(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await runSql(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // 2) Create core tables and a helper function (CREATE OR REPLACE, IF NOT EXISTS)
    await runSql(`
      CREATE OR REPLACE FUNCTION public.create_perfect_initial_schema()
      RETURNS VOID LANGUAGE plpgsql AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT UNIQUE NOT NULL,
          full_name TEXT,
          avatar_url TEXT,
          role TEXT DEFAULT 'member',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS public.automation_tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_name TEXT UNIQUE NOT NULL,
          description TEXT,
          schedule TEXT DEFAULT 'manual',
          enabled BOOLEAN DEFAULT TRUE,
          last_run_status TEXT,
          last_run_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS public.automation_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_name TEXT,
          status TEXT NOT NULL,
          message TEXT,
          details JSONB,
          duration_ms INTEGER,
          run_time TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS public.automation_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key TEXT UNIQUE NOT NULL,
          value JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      END;
      $$;
    `);

    // 3) Execute the function to ensure tables exist
    await runSql(`SELECT public.create_perfect_initial_schema();`);

    // 4) Auto-fix (add missing columns) for tables used by app at runtime
    await autoFixAutomationSettings();
    await autoFixAutomationTasks();
    // optionally auto-fix other tables if you expect runtime writes: profiles, logs etc.
    await ensureColumn("public.automation_logs", "task_name", "text");
    await ensureColumn("public.automation_logs", "status", "text");
    await ensureColumn("public.automation_logs", "message", "text");
    await ensureColumn("public.automation_logs", "details", "jsonb");
    await ensureColumn("public.automation_logs", "run_time", "timestamptz DEFAULT now()");

    // 5) Insert default automation tasks (idempotent)
    await runSql(`
      INSERT INTO public.automation_tasks (task_name, description, schedule)
      VALUES
        ('database-backup', 'Create secure database backups to Supabase Storage', 'manual'),
        ('database-restore', 'Restore database from backup files', 'manual'),
        ('schema-sync', 'Sync database schema changes automatically', '0 */6 * * *'),
        ('auto-sync', 'Scheduled data synchronization', '0 */2 * * *'),
        ('health-check', 'Monitor system health and Supabase connectivity', '*/5 * * * *')
      ON CONFLICT (task_name) DO NOTHING;
    `);

    // 6) Safe upsert setting (use SQL ON CONFLICT for safety across environments)
    await runSql(`
      INSERT INTO public.automation_settings ("key", value)
      VALUES ('system_initialized', '{"status": true, "date": "${new Date().toISOString()}"}'::jsonb)
      ON CONFLICT ("key") DO UPDATE SET value = EXCLUDED.value, created_at = COALESCE(public.automation_settings.created_at, EXCLUDED.created_at);
    `);

    return NextResponse.json({
      success: true,
      message: "Database initialized with auto-repair and default tasks.",
    });
  } catch (err: any) {
    console.error("INITIALIZATION FAILED:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
