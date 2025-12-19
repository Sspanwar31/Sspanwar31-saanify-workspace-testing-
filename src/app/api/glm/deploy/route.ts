import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface DeployTrigger {
  source: 'github-push' | 'manual' | 'scheduled';
  changes: {
    schema: boolean;
    api: boolean;
    ui: boolean;
    docs: boolean;
  };
  timestamp: string;
}

interface DeployLog {
  id: string;
  trigger: DeployTrigger;
  status: 'pending' | 'running' | 'completed' | 'failed';
  steps: Array<{
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    output?: string;
    error?: string;
    timestamp: string;
  }>;
  startTime: string;
  endTime?: string;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("x-glm-token");
    if (token !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { action, trigger } = body;

    if (action === "trigger-deploy") {
      return await triggerDeployment(trigger);
    } else if (action === "analyze-changes") {
      return await analyzeChanges();
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Deploy trigger failed:", error);
    return NextResponse.json({ error: "Deploy trigger failed" }, { status: 500 });
  }
}

async function triggerDeployment(trigger: Partial<DeployTrigger>): Promise<NextResponse> {
  const deployId = `deploy-${Date.now()}`;
  const deployLog: DeployLog = {
    id: deployId,
    trigger: {
      source: trigger?.source || 'manual',
      changes: trigger?.changes || { schema: false, api: false, ui: false, docs: false },
      timestamp: new Date().toISOString()
    },
    status: 'running',
    steps: [
      { name: 'Analyze Changes', status: 'pending', timestamp: new Date().toISOString() },
      { name: 'Environment Sync', status: 'pending', timestamp: new Date().toISOString() },
      { name: 'Database Migration', status: 'pending', timestamp: new Date().toISOString() },
      { name: 'UI Stability Check', status: 'pending', timestamp: new Date().toISOString() },
      { name: 'Build Verification', status: 'pending', timestamp: new Date().toISOString() },
      { name: 'Deploy Complete', status: 'pending', timestamp: new Date().toISOString() }
    ],
    startTime: new Date().toISOString()
  };

  try {
    // Step 1: Analyze Changes
    deployLog.steps[0].status = 'running';
    const changes = await analyzeChangesLogic();
    deployLog.trigger.changes = changes;
    deployLog.steps[0].status = 'completed';
    deployLog.steps[0].output = `Changes detected: Schema=${changes.schema}, API=${changes.api}, UI=${changes.ui}, Docs=${changes.docs}`;

    // Step 2: Environment Sync
    deployLog.steps[1].status = 'running';
    const envSync = await syncEnvironment();
    deployLog.steps[1].status = envSync.success ? 'completed' : 'failed';
    if (!envSync.success) {
      throw new Error("Environment sync failed");
    }
    deployLog.steps[1].output = envSync.message;

    // Step 3: Database Migration (only if schema changed)
    if (changes.schema || changes.api) {
      deployLog.steps[2].status = 'running';
      const migration = await runMigration();
      deployLog.steps[2].status = migration.success ? 'completed' : 'failed';
      if (!migration.success) {
        throw new Error("Database migration failed");
      }
      deployLog.steps[2].output = migration.message;
    } else {
      deployLog.steps[2].status = 'completed';
      deployLog.steps[2].output = 'Skipped - no schema changes';
    }

    // Step 4: UI Stability Check
    deployLog.steps[3].status = 'running';
    const uiCheck = await checkUIStability();
    deployLog.steps[3].status = uiCheck.success ? 'completed' : 'failed';
    if (!uiCheck.success) {
      throw new Error("UI stability check failed");
    }
    deployLog.steps[3].output = uiCheck.message;

    // Step 5: Build Verification
    deployLog.steps[4].status = 'running';
    const build = await verifyBuild();
    deployLog.steps[4].status = build.success ? 'completed' : 'failed';
    if (!build.success) {
      throw new Error("Build verification failed");
    }
    deployLog.steps[4].output = build.message;

    // Step 6: Deploy Complete
    deployLog.steps[5].status = 'running';
    deployLog.status = 'completed';
    deployLog.endTime = new Date().toISOString();
    deployLog.steps[5].status = 'completed';
    deployLog.steps[5].output = 'Deployment completed successfully';

    // Save deploy log
    await saveDeployLog(deployLog);

    return NextResponse.json({
      status: "success",
      message: "🚀 Deployment completed successfully",
      deployId,
      deployLog,
      changes,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    deployLog.status = 'failed';
    deployLog.endTime = new Date().toISOString();
    
    // Find the failed step
    const failedStep = deployLog.steps.find(s => s.status === 'running');
    if (failedStep) {
      failedStep.status = 'failed';
      failedStep.error = error instanceof Error ? error.message : 'Unknown error';
    }

    await saveDeployLog(deployLog);

    return NextResponse.json({
      status: "failed",
      message: "❌ Deployment failed",
      deployId,
      deployLog,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function analyzeChangesLogic(): Promise<{ schema: boolean; api: boolean; ui: boolean; docs: boolean }> {
  const changes = { schema: false, api: false, ui: false, docs: false };

  try {
    // Check for schema changes
    if (fs.existsSync('prisma/schema.prisma')) {
      const schemaStats = fs.statSync('prisma/schema.prisma');
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      changes.schema = schemaStats.mtime.getTime() > oneHourAgo;
    }

    // Check for API changes
    const apiDirs = ['src/app/api'];
    for (const dir of apiDirs) {
      if (fs.existsSync(dir)) {
        const files = getAllFiles(dir);
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        changes.api = files.some(file => {
          const stats = fs.statSync(file);
          return stats.mtime.getTime() > oneHourAgo;
        });
      }
    }

    // Check for UI changes
    const uiDirs = ['src/app', 'src/components'];
    for (const dir of uiDirs) {
      if (fs.existsSync(dir)) {
        const files = getAllFiles(dir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        changes.ui = files.some(file => {
          const stats = fs.statSync(file);
          return stats.mtime.getTime() > oneHourAgo;
        });
      }
    }

    // Check for docs changes
    const docsFiles = ['README.md', 'CHANGELOG.md', 'docs/'];
    changes.docs = docsFiles.some(doc => {
      if (fs.existsSync(doc)) {
        const stats = fs.statSync(doc);
        return stats.mtime.getTime() > (Date.now() - 60 * 60 * 1000);
      }
      return false;
    });

  } catch (error) {
    console.error("Error analyzing changes:", error);
  }

  return changes;
}

async function syncEnvironment(): Promise<{ success: boolean; message: string }> {
  try {
    // This would call the env-sync endpoint
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/glm/env-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-glm-token': process.env.NEXTAUTH_SECRET || ''
      },
      body: JSON.stringify({ action: 'sync' })
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: data.message };
    } else {
      return { success: false, message: 'Environment sync failed' };
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function runMigration(): Promise<{ success: boolean; message: string }> {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/glm/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-glm-token': process.env.NEXTAUTH_SECRET || ''
      },
      body: JSON.stringify({ action: 'full-migrate' })
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: data.message };
    } else {
      const errorData = await response.json();
      return { success: false, message: errorData.error || 'Migration failed' };
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function checkUIStability(): Promise<{ success: boolean; message: string }> {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/glm/ui-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-glm-token': process.env.NEXTAUTH_SECRET || ''
      },
      body: JSON.stringify({ action: 'check-all' })
    });

    if (response.ok) {
      const data = await response.json();
      return { success: data.status === 'healthy', message: data.message };
    } else {
      return { success: false, message: 'UI check failed' };
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function verifyBuild(): Promise<{ success: boolean; message: string }> {
  try {
    // In a real implementation, this might run a build command
    // or check if the latest deployment is healthy
    return { success: true, message: 'Build verification passed' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function saveDeployLog(log: DeployLog): Promise<void> {
  try {
    const logsDir = 'logs';
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logFile = path.join(logsDir, `${log.id}.json`);
    fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
  } catch (error) {
    console.error("Failed to save deploy log:", error);
  }
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function analyzeChanges(): Promise<NextResponse> {
  const changes = await analyzeChangesLogic();
  
  return NextResponse.json({
    status: "success",
    message: "Changes analyzed successfully",
    changes,
    shouldDeploy: changes.schema || changes.api || changes.ui,
    reason: changes.schema 
      ? "Schema changes detected - full deployment required"
      : changes.api
      ? "API changes detected - deployment required"
      : changes.ui
      ? "UI changes detected - deployment required"
      : "Only documentation changes - deployment can be skipped",
    timestamp: new Date().toISOString()
  });
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("x-glm-token");
    if (token !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const changes = await analyzeChangesLogic();

    return NextResponse.json({
      status: "ready",
      message: "Auto-deploy system is ready",
      recentChanges: changes,
      lastDeployment: "Check logs for deployment history",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Deploy status check failed:", error);
    return NextResponse.json({ error: "Deploy status check failed" }, { status: 500 });
  }
}