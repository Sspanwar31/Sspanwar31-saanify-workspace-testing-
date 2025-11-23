import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

interface BackupPoint {
  id: string;
  timestamp: string;
  type: 'full' | 'incremental';
  description: string;
  data: {
    users: any[];
    societies: any[];
    migrations: string[];
  };
  checksum: string;
}

interface RecoveryAction {
  id: string;
  type: 'restore' | 'rollback' | 'repair';
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("x-glm-token");
    if (token !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { action, target, backupId } = body;

    if (action === "create-backup") {
      return await createBackup();
    } else if (action === "restore") {
      return await restoreFromBackup(backupId);
    } else if (action === "rollback") {
      return await performRollback(target);
    } else if (action === "auto-recover") {
      return await autoRecover();
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Recovery operation failed:", error);
    return NextResponse.json({ error: "Recovery operation failed" }, { status: 500 });
  }
}

async function createBackup(): Promise<NextResponse> {
  try {
    const backupId = `backup-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Connect to database and get current state
    await db.$connect();

    const users = await db.user.findMany();
    const societies = await db.societyAccount.findMany({
      include: { users: true }
    });

    // Get migration history (simplified)
    const migrations = ['001_initial_migration'];

    const backupData: BackupPoint = {
      id: backupId,
      timestamp,
      type: 'full',
      description: 'Automatic backup before deployment',
      data: {
        users,
        societies,
        migrations
      },
      checksum: generateChecksum(JSON.stringify({ users, societies, migrations }))
    };

    // Save backup to file system
    const backupsDir = 'backups';
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const backupFile = path.join(backupsDir, `${backupId}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

    await db.$disconnect();

    console.log(`✅ Backup created: ${backupId}`);

    return NextResponse.json({
      status: "success",
      message: "📦 Backup created successfully",
      backupId,
      backup: {
        id: backupData.id,
        timestamp: backupData.timestamp,
        type: backupData.type,
        description: backupData.description,
        size: fs.statSync(backupFile).size,
        checksum: backupData.checksum
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Backup creation failed:", error);
    return NextResponse.json({
      status: "failed",
      message: "Backup creation failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

async function restoreFromBackup(backupId: string): Promise<NextResponse> {
  const recoveryAction: RecoveryAction = {
    id: `restore-${Date.now()}`,
    type: 'restore',
    target: backupId,
    status: 'running',
    startTime: new Date().toISOString()
  };

  try {
    // Load backup file
    const backupFile = path.join('backups', `${backupId}.json`);
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupId}`);
    }

    const backupData: BackupPoint = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

    // Verify backup integrity
    const currentChecksum = generateChecksum(JSON.stringify(backupData.data));
    if (currentChecksum !== backupData.checksum) {
      throw new Error("Backup integrity check failed - file may be corrupted");
    }

    // Connect to database
    await db.$connect();

    // Clear existing data (be careful with order due to foreign keys)
    console.log("🔄 Clearing existing data...");
    await db.user.deleteMany({});
    await db.societyAccount.deleteMany({});

    // Restore societies first
    console.log("🔄 Restoring societies...");
    for (const society of backupData.data.societies) {
      await db.societyAccount.create({
        data: {
          id: society.id,
          name: society.name,
          adminName: society.adminName,
          email: society.email,
          phone: society.phone,
          address: society.address,
          subscriptionPlan: society.subscriptionPlan,
          status: society.status,
          trialEndsAt: society.trialEndsAt ? new Date(society.trialEndsAt) : null,
          subscriptionEndsAt: society.subscriptionEndsAt ? new Date(society.subscriptionEndsAt) : null,
          isActive: society.isActive,
          createdAt: new Date(society.createdAt),
          updatedAt: new Date(society.updatedAt)
        }
      });
    }

    // Restore users
    console.log("🔄 Restoring users...");
    for (const user of backupData.data.users) {
      await db.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          password: user.password,
          role: user.role,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
          societyAccountId: user.societyAccountId,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      });
    }

    await db.$disconnect();

    recoveryAction.status = 'completed';
    recoveryAction.endTime = new Date().toISOString();

    // Log recovery action
    await logRecoveryAction(recoveryAction);

    console.log(`✅ Restore completed: ${backupId}`);

    return NextResponse.json({
      status: "success",
      message: "🔄 Restore completed successfully",
      backupId,
      recoveryAction,
      restored: {
        users: backupData.data.users.length,
        societies: backupData.data.societies.length,
        timestamp: backupData.timestamp
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Restore failed:", error);
    recoveryAction.status = 'failed';
    recoveryAction.endTime = new Date().toISOString();
    recoveryAction.error = error instanceof Error ? error.message : 'Unknown error';

    await logRecoveryAction(recoveryAction);

    return NextResponse.json({
      status: "failed",
      message: "❌ Restore failed",
      backupId,
      recoveryAction,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function performRollback(target: string): Promise<NextResponse> {
  const recoveryAction: RecoveryAction = {
    id: `rollback-${Date.now()}`,
    type: 'rollback',
    target,
    status: 'running',
    startTime: new Date().toISOString()
  };

  try {
    // Find the most recent backup before the target
    const backupsDir = 'backups';
    if (!fs.existsSync(backupsDir)) {
      throw new Error("No backups directory found");
    }

    const backupFiles = fs.readdirSync(backupsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const backupPath = path.join(backupsDir, file);
        const stats = fs.statSync(backupPath);
        return { file, path: backupPath, mtime: stats.mtime };
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    if (backupFiles.length === 0) {
      throw new Error("No backups found for rollback");
    }

    // Use the most recent backup
    const latestBackup = backupFiles[0];
    const backupId = latestBackup.file.replace('.json', '');

    console.log(`🔄 Rolling back to backup: ${backupId}`);

    // Perform restore using the latest backup
    const restoreResult = await restoreFromBackup(backupId);
    const restoreData = await restoreResult.json();

    recoveryAction.status = 'completed';
    recoveryAction.endTime = new Date().toISOString();

    await logRecoveryAction(recoveryAction);

    return NextResponse.json({
      status: "success",
      message: "🔄 Rollback completed successfully",
      target,
      backupId,
      recoveryAction,
      restoreResult: restoreData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Rollback failed:", error);
    recoveryAction.status = 'failed';
    recoveryAction.endTime = new Date().toISOString();
    recoveryAction.error = error instanceof Error ? error.message : 'Unknown error';

    await logRecoveryAction(recoveryAction);

    return NextResponse.json({
      status: "failed",
      message: "❌ Rollback failed",
      target,
      recoveryAction,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function autoRecover(): Promise<NextResponse> {
  try {
    console.log("🔧 Starting auto-recovery process...");

    // Check database health
    await db.$connect();
    
    const userCount = await db.user.count();
    const societyCount = await db.societyAccount.count();
    const adminCount = await db.user.count({ where: { role: 'SUPER_ADMIN' } });

    await db.$disconnect();

    const issues = [];
    if (adminCount === 0) issues.push("No super admin found");
    if (userCount === 0) issues.push("No users found");
    if (societyCount === 0) issues.push("No societies found");

    if (issues.length === 0) {
      return NextResponse.json({
        status: "healthy",
        message: "✅ System is healthy - no recovery needed",
        checks: {
          users: userCount,
          societies: societyCount,
          admins: adminCount
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log("⚠️ Issues detected:", issues);

    // Try to fix issues automatically
    const fixes = [];

    // Create super admin if missing
    if (adminCount === 0) {
      try {
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : 'http://localhost:3000';
        
        const response = await fetch(`${baseUrl}/api/run-migrations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-run-migrations-token': process.env.NEXTAUTH_SECRET || ''
          }
        });

        if (response.ok) {
          fixes.push("✅ Super admin created");
        } else {
          fixes.push("❌ Failed to create super admin");
        }
      } catch (error) {
        fixes.push("❌ Error creating super admin");
      }
    }

    // If we have backups, try to restore from the latest
    const backupsDir = 'backups';
    if (fs.existsSync(backupsDir)) {
      const backupFiles = fs.readdirSync(backupsDir)
        .filter(file => file.endsWith('.json'))
        .sort()
        .reverse();

      if (backupFiles.length > 0) {
        const latestBackup = backupFiles[0].replace('.json', '');
        console.log(`🔄 Attempting to restore from backup: ${latestBackup}`);
        
        try {
          const restoreResult = await restoreFromBackup(latestBackup);
          const restoreData = await restoreResult.json();
          
          if (restoreData.status === 'success') {
            fixes.push(`✅ Restored from backup: ${latestBackup}`);
          } else {
            fixes.push(`❌ Failed to restore from backup: ${latestBackup}`);
          }
        } catch (error) {
          fixes.push(`❌ Error restoring from backup: ${latestBackup}`);
        }
      }
    }

    return NextResponse.json({
      status: "recovered",
      message: "🔧 Auto-recovery completed",
      issues,
      fixes,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Auto-recovery failed:", error);
    return NextResponse.json({
      status: "failed",
      message: "❌ Auto-recovery failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function logRecoveryAction(action: RecoveryAction): Promise<void> {
  try {
    const logsDir = 'logs';
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logFile = path.join(logsDir, `recovery-${action.id}.json`);
    fs.writeFileSync(logFile, JSON.stringify(action, null, 2));
  } catch (error) {
    console.error("Failed to log recovery action:", error);
  }
}

function generateChecksum(data: string): string {
  // Simple checksum function - in production, use crypto
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("x-glm-token");
    if (token !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // List available backups
    const backupsDir = 'backups';
    const backups = [];

    if (fs.existsSync(backupsDir)) {
      const backupFiles = fs.readdirSync(backupsDir)
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const backupPath = path.join(backupsDir, file);
          const stats = fs.statSync(backupPath);
          const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
          
          return {
            id: backupData.id,
            timestamp: backupData.timestamp,
            type: backupData.type,
            description: backupData.description,
            size: stats.size,
            checksum: backupData.checksum
          };
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      backups.push(...backupFiles);
    }

    return NextResponse.json({
      status: "ready",
      message: "Recovery system is ready",
      backups,
      totalBackups: backups.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Recovery status check failed:", error);
    return NextResponse.json({ error: "Recovery status check failed" }, { status: 500 });
  }
}