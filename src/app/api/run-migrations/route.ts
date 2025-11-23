import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    // Token validation
    const token = req.headers.get("x-run-migrations-token");
    if (token !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Test DB connection
    try {
      await db.$connect();
      console.log("✅ Database connection successful");
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError);
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Create default superadmin if not exists
    try {
      const existingAdmin = await db.user.findUnique({
        where: { email: "superadmin@example.com" }
      });

      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash("admin123", 12);
        
        await db.user.create({
          data: {
            email: "superadmin@example.com",
            name: "Super Admin",
            password: hashedPassword,
            role: "SUPER_ADMIN",
            isActive: true
          }
        });
        
        console.log("✅ Default superadmin created: superadmin@example.com");
      } else {
        console.log("✅ Superadmin already exists: superadmin@example.com");
      }
    } catch (adminError) {
      console.error("❌ Admin creation failed:", adminError);
      return NextResponse.json({ error: "Admin creation failed" }, { status: 500 });
    } finally {
      await db.$disconnect();
    }

    return NextResponse.json({ 
      message: "DB connection verified & admin seeded ✅" 
    });

  } catch (err) {
    console.error("Migration failed:", err);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}