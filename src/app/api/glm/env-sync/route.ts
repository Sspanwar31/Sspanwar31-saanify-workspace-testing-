import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Environment variable management and validation
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("x-glm-token");
    if (token !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Test and validate environment variables
    const envStatus = {
      database: false,
      auth: false,
      vercel: false
    };

    // Test database connection
    try {
      await db.$connect();
      envStatus.database = true;
      await db.$disconnect();
    } catch (error) {
      console.error("Database connection failed:", error);
    }

    // Test auth secret
    if (process.env.NEXTAUTH_SECRET) {
      envStatus.auth = true;
    }

    // Test Vercel environment
    if (process.env.VERCEL_ENV || process.env.VERCEL_URL) {
      envStatus.vercel = true;
    }

    return NextResponse.json({
      status: "success",
      environment: process.env.VERCEL_ENV || "development",
      envStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Environment check failed:", error);
    return NextResponse.json({ error: "Environment check failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("x-glm-token");
    if (token !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "sync") {
      // Sync environment variables from Vercel
      const envVars = {
        DATABASE_URL: process.env.DATABASE_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_URL: process.env.VERCEL_URL
      };

      return NextResponse.json({
        status: "success",
        message: "Environment variables synced",
        envVars: Object.keys(envVars).reduce((acc, key) => {
          acc[key] = envVars[key] ? "✅ Set" : "❌ Missing";
          return acc;
        }, {} as Record<string, string>),
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Environment sync failed:", error);
    return NextResponse.json({ error: "Environment sync failed" }, { status: 500 });
  }
}