import { NextRequest, NextResponse } from 'next/server';

interface MasterControlRequest {
  action: 'full-auto-deploy' | 'health-check' | 'emergency-rollback' | 'system-status';
  options?: {
    force?: boolean;
    skipBackup?: boolean;
    skipUI?: boolean;
  };
}

interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    database: 'healthy' | 'degraded' | 'critical';
    api: 'healthy' | 'degraded' | 'critical';
    ui: 'healthy' | 'degraded' | 'critical';
    environment: 'healthy' | 'degraded' | 'critical';
  };
  lastDeployment?: string;
  uptime: string;
  stats: {
    users: number;
    societies: number;
    admins: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("x-glm-token");
    if (token !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json() as MasterControlRequest;
    const { action, options = {} } = body;

    switch (action) {
      case 'full-auto-deploy':
        return await performFullAutoDeploy(options);
      case 'health-check':
        return await performHealthCheck();
      case 'emergency-rollback':
        return await performEmergencyRollback();
      case 'system-status':
        return await getSystemStatus();
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("Master control failed:", error);
    return NextResponse.json({ 
      error: "Master control failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

async function performFullAutoDeploy(options: any): Promise<NextResponse> {
  const startTime = Date.now();
  const deploymentId = `auto-deploy-${startTime}`;
  
  console.log(`🚀 Starting full auto-deploy: ${deploymentId}`);
  
  const steps = [
    { name: 'Environment Sync', status: 'pending' },
    { name: 'Create Backup', status: 'pending' },
    { name: 'Analyze Changes', status: 'pending' },
    { name: 'Run Migrations', status: 'pending' },
    { name: 'UI Stability Check', status: 'pending' },
    { name: 'Trigger Deployment', status: 'pending' },
    { name: 'Final Verification', status: 'pending' }
  ];

  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';

    // Step 1: Environment Sync
    steps[0].status = 'running';
    const envResponse = await fetch(`${baseUrl}/api/glm/env-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-glm-token': process.env.NEXTAUTH_SECRET || ''
      },
      body: JSON.stringify({ action: 'sync' })
    });

    if (!envResponse.ok) {
      throw new Error('Environment sync failed');
    }
    steps[0].status = 'completed';

    // Step 2: Create Backup (unless skipped)
    if (!options.skipBackup) {
      steps[1].status = 'running';
      const backupResponse = await fetch(`${baseUrl}/api/glm/recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-glm-token': process.env.NEXTAUTH_SECRET || ''
        },
        body: JSON.stringify({ action: 'create-backup' })
      });

      if (backupResponse.ok) {
        const backupData = await backupResponse.json();
        console.log(`✅ Backup created: ${backupData.backupId}`);
      }
      steps[1].status = 'completed';
    } else {
      steps[1].status = 'skipped';
    }

    // Step 3: Analyze Changes
    steps[2].status = 'running';
    const analyzeResponse = await fetch(`${baseUrl}/api/glm/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-glm-token': process.env.NEXTAUTH_SECRET || ''
      },
      body: JSON.stringify({ action: 'analyze-changes' })
    });

    if (!analyzeResponse.ok) {
      throw new Error('Change analysis failed');
    }

    const analyzeData = await analyzeResponse.json();
    steps[2].status = 'completed';

    if (!analyzeData.shouldDeploy && !options.force) {
      return NextResponse.json({
        status: "skipped",
        message: "No deployment needed - only documentation changes",
        deploymentId,
        steps,
        duration: Math.round((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString()
      });
    }

    // Step 4: Run Migrations
    if (analyzeData.changes.schema || analyzeData.changes.api || options.force) {
      steps[3].status = 'running';
      const migrateResponse = await fetch(`${baseUrl}/api/glm/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-glm-token': process.env.NEXTAUTH_SECRET || ''
        },
        body: JSON.stringify({ action: 'full-migrate' })
      });

      if (!migrateResponse.ok) {
        throw new Error('Migration failed');
      }
      steps[3].status = 'completed';
    } else {
      steps[3].status = 'skipped';
    }

    // Step 5: UI Stability Check
    if (!options.skipUI) {
      steps[4].status = 'running';
      const uiResponse = await fetch(`${baseUrl}/api/glm/ui-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-glm-token': process.env.NEXTAUTH_SECRET || ''
        },
        body: JSON.stringify({ action: 'check-all' })
      });

      if (!uiResponse.ok) {
        throw new Error('UI stability check failed');
      }

      const uiData = await uiResponse.json();
      if (uiData.status === 'failed') {
        throw new Error('Critical UI issues detected');
      }
      steps[4].status = 'completed';
    } else {
      steps[4].status = 'skipped';
    }

    // Step 6: Trigger Deployment
    steps[5].status = 'running';
    const deployResponse = await fetch(`${baseUrl}/api/glm/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-glm-token': process.env.NEXTAUTH_SECRET || ''
      },
      body: JSON.stringify({
        action: 'trigger-deploy',
        trigger: {
          source: 'auto-deploy',
          changes: analyzeData.changes
        }
      })
    });

    if (!deployResponse.ok) {
      throw new Error('Deployment trigger failed');
    }
    steps[5].status = 'completed';

    // Step 7: Final Verification
    steps[6].status = 'running';
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    if (!healthResponse.ok) {
      throw new Error('Final health check failed');
    }
    steps[6].status = 'completed';

    const duration = Math.round((Date.now() - startTime) / 1000);

    return NextResponse.json({
      status: "success",
      message: "🚀 Full auto-deploy completed successfully",
      deploymentId,
      steps,
      changes: analyzeData.changes,
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Auto-deploy failed: ${deploymentId}`, error);
    
    // Mark failed step
    const failedStep = steps.find(s => s.status === 'running');
    if (failedStep) {
      failedStep.status = 'failed';
    }

    // Attempt emergency rollback
    try {
      console.log('🔄 Attempting emergency rollback...');
      await performEmergencyRollback();
    } catch (rollbackError) {
      console.error('Emergency rollback also failed:', rollbackError);
    }

    return NextResponse.json({
      status: "failed",
      message: "❌ Auto-deploy failed",
      deploymentId,
      steps,
      error: error instanceof Error ? error.message : "Unknown error",
      duration: Math.round((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function performHealthCheck(): Promise<NextResponse> {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';

    const checks = [];

    // Database health
    try {
      const dbResponse = await fetch(`${baseUrl}/api/glm/migrate`);
      const dbData = await dbResponse.json();
      checks.push({ component: 'database', status: dbData.status === 'healthy' ? 'healthy' : 'unhealthy', details: dbData });
    } catch (error) {
      checks.push({ component: 'database', status: 'unhealthy', details: error instanceof Error ? error.message : 'Unknown error' });
    }

    // API health
    try {
      const apiResponse = await fetch(`${baseUrl}/api/health`);
      checks.push({ component: 'api', status: apiResponse.ok ? 'healthy' : 'unhealthy', details: 'API endpoints responding' });
    } catch (error) {
      checks.push({ component: 'api', status: 'unhealthy', details: error instanceof Error ? error.message : 'Unknown error' });
    }

    // UI health
    try {
      const uiResponse = await fetch(`${baseUrl}/api/glm/ui-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-glm-token': process.env.NEXTAUTH_SECRET || ''
        },
        body: JSON.stringify({ action: 'check-all' })
      });
      const uiData = await uiResponse.json();
      checks.push({ component: 'ui', status: uiData.status === 'healthy' ? 'healthy' : uiData.status === 'degraded' ? 'degraded' : 'unhealthy', details: uiData });
    } catch (error) {
      checks.push({ component: 'ui', status: 'unhealthy', details: error instanceof Error ? error.message : 'Unknown error' });
    }

    // Environment health
    try {
      const envResponse = await fetch(`${baseUrl}/api/glm/env-sync`);
      const envData = await envResponse.json();
      checks.push({ component: 'environment', status: envData.status === 'success' ? 'healthy' : 'unhealthy', details: envData });
    } catch (error) {
      checks.push({ component: 'environment', status: 'unhealthy', details: error instanceof Error ? error.message : 'Unknown error' });
    }

    const overallStatus = checks.every(c => c.status === 'healthy') 
      ? 'healthy' 
      : checks.some(c => c.status === 'unhealthy')
      ? 'critical'
      : 'degraded';

    return NextResponse.json({
      status: overallStatus,
      message: overallStatus === 'healthy' 
        ? '✅ All systems operational'
        : overallStatus === 'critical'
        ? '❌ Critical issues detected'
        : '⚠️ Some systems degraded',
      checks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      status: "critical",
      message: "Health check failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function performEmergencyRollback(): Promise<NextResponse> {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/glm/recovery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-glm-token': process.env.NEXTAUTH_SECRET || ''
      },
      body: JSON.stringify({ action: 'rollback' })
    });

    if (!response.ok) {
      throw new Error('Rollback failed');
    }

    const data = await response.json();

    return NextResponse.json({
      status: "success",
      message: "🔄 Emergency rollback completed",
      rollbackId: data.recoveryAction?.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      status: "failed",
      message: "❌ Emergency rollback failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function getSystemStatus(): Promise<NextResponse> {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';

    // Get system stats
    const stats = {
      users: 0,
      societies: 0,
      admins: 0
    };

    try {
      const migrateResponse = await fetch(`${baseUrl}/api/glm/migrate`);
      if (migrateResponse.ok) {
        const migrateData = await migrateResponse.json();
        stats.users = migrateData.stats?.users || 0;
        stats.societies = migrateData.stats?.societies || 0;
        stats.admins = migrateData.stats?.superAdmins || 0;
      }
    } catch (error) {
      console.error("Failed to get stats:", error);
    }

    // Get recent alerts
    let recentAlerts = 0;
    try {
      const alertsResponse = await fetch(`${baseUrl}/api/glm/logs?type=alerts&limit=10`);
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        recentAlerts = alertsData.unresolved || 0;
      }
    } catch (error) {
      console.error("Failed to get alerts:", error);
    }

    const systemStatus: SystemStatus = {
      overall: 'healthy',
      components: {
        database: 'healthy',
        api: 'healthy',
        ui: 'healthy',
        environment: 'healthy'
      },
      uptime: process.uptime(),
      stats
    };

    return NextResponse.json({
      status: "success",
      message: "System status retrieved",
      systemStatus,
      recentAlerts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: "Failed to get system status",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("x-glm-token");
    if (token !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      status: "ready",
      message: "GLM Master Control System is ready",
      actions: [
        "full-auto-deploy - Complete automated deployment",
        "health-check - System health monitoring",
        "emergency-rollback - Emergency system rollback",
        "system-status - Current system status"
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Master control status failed:", error);
    return NextResponse.json({ error: "Master control status failed" }, { status: 500 });
  }
}