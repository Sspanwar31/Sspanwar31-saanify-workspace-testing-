import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// Helper: SQL चलाने के लिए
async function runSql(sql: string) {
  try {
    await db.$executeRawUnsafe(sql);
  } catch (e) {
    console.error("runSql failed:", e);
  }
}

// Helper: Column Check
async function ensureColumn(table: string, column: string, type: string) {
  try {
    await db.$executeRawUnsafe(
      `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS "${column}" ${type};`
    );
  } catch (e) {
    console.error(`ensureColumn failed (${table}.${column}):`, e);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { setupKey, superadminEmail, superadminPassword } = body;

    // --- SECURITY CHECK ---
    if (!process.env.SETUP_KEY) {
      return NextResponse.json({ success: false, message: "ENV ERROR: SETUP_KEY missing" }, { status: 500 });
    }
    if (setupKey !== process.env.SETUP_KEY) {
      return NextResponse.json({ success: false, message: "Invalid Setup Key" }, { status: 401 });
    }

    const adminEmail = superadminEmail || "testadmin1@gmail.com";
    const rawPassword = superadminPassword || "admin123_password";

    // ✅ Password Hash (Login compatible)
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    console.log("Setup Started (Clean Version)...");

    // --- STEP 1: Extensions ---
    await runSql(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await runSql(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // --- STEP 2: Tables Creation Function ---
    // ⚠️ NOTE: Maine yahan se 'profiles' table hata di hai taaki Prisma Error P4002 na aaye.
    await runSql(`
      CREATE OR REPLACE FUNCTION public.create_perfect_initial_schema()
      RETURNS VOID LANGUAGE plpgsql AS $$
      BEGIN
        
        -- 1. USERS TABLE (Ab ye main table hai)
        CREATE TABLE IF NOT EXISTS public.users (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT,
          email TEXT UNIQUE,
          "emailVerified" TIMESTAMPTZ,
          image TEXT,
          password TEXT,
          role TEXT DEFAULT 'CLIENT',
          "isActive" BOOLEAN DEFAULT TRUE,
          "societyAccountId" TEXT,
          "lastLoginAt" TIMESTAMPTZ, -- ✅ Added to fix login error
          "createdAt" TIMESTAMPTZ DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ DEFAULT NOW()
        );

        -- 2. NEXTAUTH TABLES
        CREATE TABLE IF NOT EXISTS public.accounts (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          provider TEXT NOT NULL,
          "providerAccountId" TEXT NOT NULL,
          refresh_token TEXT,
          access_token TEXT,
          expires_at INTEGER,
          token_type TEXT,
          scope TEXT,
          id_token TEXT,
          session_state TEXT,
          CONSTRAINT accounts_provider_providerAccountId_key UNIQUE (provider, "providerAccountId")
        );

        CREATE TABLE IF NOT EXISTS public.sessions (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          "sessionToken" TEXT UNIQUE NOT NULL,
          "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          expires TIMESTAMPTZ NOT NULL
        );

        CREATE TABLE IF NOT EXISTS public.verification_tokens (
            identifier TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires TIMESTAMPTZ NOT NULL,
            CONSTRAINT verification_tokens_identifier_token_key UNIQUE (identifier, token)
        );

        -- 3. SOCIETY ACCOUNTS
        CREATE TABLE IF NOT EXISTS public.society_accounts (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          "adminName" TEXT,
          email TEXT UNIQUE NOT NULL,
          "subscriptionPlan" TEXT DEFAULT 'TRIAL',
          "isActive" BOOLEAN DEFAULT TRUE,
          "createdAt" TIMESTAMPTZ DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ DEFAULT NOW()
        );

        -- 4. AUTOMATION TABLES
        CREATE TABLE IF NOT EXISTS public.automation_tasks (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          task_name TEXT UNIQUE NOT NULL,
          description TEXT,
          schedule TEXT DEFAULT 'manual',
          enabled BOOLEAN DEFAULT TRUE,
          last_run_status TEXT,
          last_run_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS public.automation_logs (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          task_name TEXT,
          status TEXT NOT NULL,
          message TEXT,
          details JSONB,
          duration_ms INTEGER,
          run_time TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS public.automation_settings (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          key TEXT UNIQUE NOT NULL,
          value JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

      END;
      $$;
    `);

    // Run the function
    await runSql(`SELECT public.create_perfect_initial_schema();`);
    
    // ⚠️ OPTIONAL: Force delete old profiles table if it exists
    // await runSql(`DROP TABLE IF EXISTS profiles CASCADE;`);

    // --- STEP 3: Auto-Repair Columns ---
    await ensureColumn("public.users", "role", "text DEFAULT 'CLIENT'");
    await ensureColumn("public.users", "societyAccountId", "text");
    await ensureColumn("public.users", "password", "text");
    await ensureColumn("public.users", "lastLoginAt", "timestamptz"); // ✅ Ensuring this column exists

    // --- STEP 4: Create Admin & Society ---
    const societyId = '00000000-0000-0000-0000-000000000001';

    // 1. Create Society
    await runSql(`
      INSERT INTO public.society_accounts (id, name, email, "subscriptionPlan", "adminName")
      VALUES (
        '${societyId}', 
        'Master Admin Society', 
        '${adminEmail}', 
        'LIFETIME', 
        'Super Admin'
      )
      ON CONFLICT (email) DO NOTHING;
    `);

    // 2. Create Admin User (with SUPER_ADMIN role and bcrypt password)
    await runSql(`
      INSERT INTO public.users (email, password, name, role, "societyAccountId", "emailVerified", "isActive")
      VALUES (
        '${adminEmail}',
        '${hashedPassword}', 
        'Super Admin',
        'SUPER_ADMIN',
        '${societyId}',
        NOW(),
        TRUE
      )
      ON CONFLICT (email) DO UPDATE 
      SET role = 'SUPER_ADMIN', "societyAccountId" = '${societyId}', password = '${hashedPassword}';
    `);

    // --- STEP 5: Default Automation Data ---
    await runSql(`
      INSERT INTO public.automation_tasks (task_name, description, schedule)
      VALUES
        ('database-backup', 'Backup DB', 'manual'),
        ('health-check', 'System Health Check', '*/5 * * * *'),
        ('schema-sync', 'Sync Schema', '0 */6 * * *')
      ON CONFLICT (task_name) DO NOTHING;
    `);

    await runSql(`
      INSERT INTO public.automation_settings ("key", value)
      VALUES ('system_initialized', '{"status": true, "date": "${new Date().toISOString()}"}'::jsonb)
      ON CONFLICT ("key") DO UPDATE SET value = EXCLUDED.value;
    `);

    return NextResponse.json({
      success: true,
      message: "Setup Completed! Tables created (No profiles table). Admin ready.",
      redirectUrl: '/auth/login'
    });

  } catch (err: any) {
    console.error("SETUP FAILED:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
