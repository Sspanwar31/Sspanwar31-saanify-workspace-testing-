import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

interface MigrationStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  timestamp?: string;
}

interface MigrationLog {
  steps: MigrationStep[];
  overallStatus: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  rollbackData?: any;
}

export async function POST(req: NextRequest) {
  const migrationLog: MigrationLog = {
    steps: [
      { name: 'Environment Validation', status: 'pending' },
      { name: 'Database Connection Test', status: 'pending' },
      { name: 'Schema Verification', status: 'pending' },
      { name: 'Super Admin Seeding', status: 'pending' },
      { name: 'Demo Societies Seeding', status: 'pending' },
      { name: 'Demo Client Seeding', status: 'pending' },
      { name: 'Final Verification', status: 'pending' }
    ],
    overallStatus: 'running',
    startTime: new Date().toISOString()
  };

  try {
    const token = req.headers.get("x-glm-token");
    if (token !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { action, rollback } = body;

    if (action === "full-migrate") {
      return await performFullMigration(migrationLog);
    } else if (action === "rollback") {
      return await performRollback(migrationLog);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("❌ GLM Migration Failed:", error);
    migrationLog.overallStatus = 'failed';
    migrationLog.endTime = new Date().toISOString();
    
    return NextResponse.json({
      status: "failed",
      message: "⚠️ Auto-Migration Failed on " + new Date().toISOString(),
      reason: error instanceof Error ? error.message : "Unknown error",
      migrationLog,
      rolledBack: false
    }, { status: 500 });
  }
}

async function performFullMigration(log: MigrationLog): Promise<NextResponse> {
  try {
    // Step 1: Environment Validation
    log.steps[0].status = 'running';
    if (!process.env.DATABASE_URL || !process.env.NEXTAUTH_SECRET) {
      throw new Error("Missing required environment variables");
    }
    log.steps[0].status = 'completed';
    log.steps[0].timestamp = new Date().toISOString();

    // Step 2: Database Connection Test
    log.steps[1].status = 'running';
    await db.$connect();
    log.steps[1].status = 'completed';
    log.steps[1].timestamp = new Date().toISOString();

    // Step 3: Schema Verification
    log.steps[2].status = 'running';
    try {
      await db.user.findFirst();
      await db.societyAccount.findFirst();
      await db.society.findFirst();
    } catch (schemaError) {
      throw new Error("Database schema not properly initialized");
    }
    log.steps[2].status = 'completed';
    log.steps[2].timestamp = new Date().toISOString();

    // Step 4: Super Admin Seeding
    log.steps[3].status = 'running';
    const superAdminEmail = 'superadmin@saanify.com';
    const existingAdmin = await db.user.findUnique({
      where: { email: superAdminEmail }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await db.user.create({
        data: {
          email: superAdminEmail,
          name: 'Super Admin',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isActive: true
        }
      });
      console.log('✅ Super Admin created:', superAdminEmail);
    }
    log.steps[3].status = 'completed';
    log.steps[3].timestamp = new Date().toISOString();

    // Step 5: Demo Societies Seeding
    log.steps[4].status = 'running';
    const demoSocieties = [
      {
        name: 'Green Valley Society',
        adminName: 'Robert Johnson',
        email: 'admin@greenvalley.com',
        phone: '+91 98765 43210',
        address: '123 Green Valley Road, Bangalore',
        subscriptionPlan: 'PRO' as const,
        status: 'ACTIVE' as const,
        subscriptionEndsAt: new Date('2024-12-31')
      },
      {
        name: 'Sunset Apartments',
        adminName: 'Maria Garcia',
        email: 'admin@sunsetapartments.com',
        phone: '+91 98765 43211',
        address: '456 Sunset Boulevard, Mumbai',
        subscriptionPlan: 'TRIAL' as const,
        status: 'TRIAL' as const,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const society of demoSocieties) {
      const existingSociety = await db.societyAccount.findUnique({
        where: { email: society.email }
      });

      if (!existingSociety) {
        const createdSociety = await db.societyAccount.create({
          data: society
        });

        const hashedPassword = await bcrypt.hash('Saanify@123', 12);
        await db.user.create({
          data: {
            email: society.email,
            name: society.adminName,
            password: hashedPassword,
            role: 'CLIENT',
            societyAccountId: createdSociety.id,
            isActive: society.status !== 'LOCKED'
          }
        });
      }
    }
    log.steps[4].status = 'completed';
    log.steps[4].timestamp = new Date().toISOString();

    // Step 6: Demo Client Seeding
    log.steps[5].status = 'running';
    const clientEmail = 'client@saanify.com';
    const existingClient = await db.user.findUnique({
      where: { email: clientEmail }
    });

    if (!existingClient) {
      const hashedPassword = await bcrypt.hash('client123', 12);
      const firstSociety = await db.societyAccount.findFirst();
      
      await db.user.create({
        data: {
          email: clientEmail,
          name: 'Demo Client',
          password: hashedPassword,
          role: 'CLIENT',
          societyAccountId: firstSociety?.id,
          isActive: true
        }
      });
    }
    log.steps[5].status = 'completed';
    log.steps[5].timestamp = new Date().toISOString();

    // Step 7: Final Verification
    log.steps[6].status = 'running';
    const adminCount = await db.user.count({ where: { role: 'SUPER_ADMIN' } });
    const clientCount = await db.user.count({ where: { role: 'CLIENT' } });
    const societyCount = await db.societyAccount.count();
    
    if (adminCount === 0 || clientCount === 0 || societyCount === 0) {
      throw new Error("Final verification failed: Missing required data");
    }
    log.steps[6].status = 'completed';
    log.steps[6].timestamp = new Date().toISOString();

    log.overallStatus = 'completed';
    log.endTime = new Date().toISOString();

    await db.$disconnect();

    return NextResponse.json({
      status: "success",
      message: "✅ Full migration completed successfully",
      migrationLog: log,
      stats: {
        superAdmins: adminCount,
        clients: clientCount,
        societies: societyCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Migration step failed:", error);
    log.overallStatus = 'failed';
    log.endTime = new Date().toISOString();
    
    // Attempt rollback
    try {
      await performRollback(log);
    } catch (rollbackError) {
      console.error("❌ Rollback also failed:", rollbackError);
    }

    return NextResponse.json({
      status: "failed",
      message: "⚠️ Auto-Migration Failed on " + new Date().toISOString(),
      reason: error instanceof Error ? error.message : "Unknown error",
      migrationLog: log,
      rolledBack: true
    }, { status: 500 });
  }
}

async function performRollback(log: MigrationLog): Promise<void> {
  console.log("🔄 Starting rollback procedure...");
  
  // In a real implementation, this would restore from a backup
  // For now, we'll just clean up any partially created records
  try {
    // Remove any users created in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    await db.user.deleteMany({
      where: {
        createdAt: {
          gte: fiveMinutesAgo
        }
      }
    });
    
    await db.societyAccount.deleteMany({
      where: {
        createdAt: {
          gte: fiveMinutesAgo
        }
      }
    });
    
    console.log("✅ Rollback completed successfully");
  } catch (error) {
    console.error("❌ Rollback failed:", error);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("x-glm-token");
    if (token !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check migration status
    await db.$connect();
    
    const stats = {
      users: await db.user.count(),
      societies: await db.societyAccount.count(),
      superAdmins: await db.user.count({ where: { role: 'SUPER_ADMIN' } }),
      clients: await db.user.count({ where: { role: 'CLIENT' } })
    };

    await db.$disconnect();

    return NextResponse.json({
      status: "healthy",
      message: "Database is ready",
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Migration status check failed:", error);
    return NextResponse.json({ 
      status: "error", 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}