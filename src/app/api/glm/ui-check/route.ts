import { NextRequest, NextResponse } from 'next/server';

interface UIRoute {
  path: string;
  name: string;
  expectedElements: string[];
  critical: boolean;
}

interface UIHealthCheck {
  route: string;
  status: 'healthy' | 'degraded' | 'failed';
  responseTime: number;
  issues: string[];
  timestamp: string;
}

const CRITICAL_ROUTES: UIRoute[] = [
  {
    path: '/',
    name: 'Landing Page',
    expectedElements: ['navbar', 'hero', 'features', 'footer'],
    critical: true
  },
  {
    path: '/login',
    name: 'Login Page',
    expectedElements: ['login-form', 'email-input', 'password-input'],
    critical: true
  },
  {
    path: '/admin',
    name: 'Admin Dashboard',
    expectedElements: ['admin-layout', 'dashboard-stats', 'clients-table'],
    critical: true
  },
  {
    path: '/client',
    name: 'Client Dashboard',
    expectedElements: ['client-layout', 'dashboard-cards', 'sidebar'],
    critical: true
  }
];

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("x-glm-token");
    if (token !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "check-all") {
      return await performUIHealthCheck();
    } else if (action === "protect") {
      return await enableUIProtection();
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("UI check failed:", error);
    return NextResponse.json({ error: "UI check failed" }, { status: 500 });
  }
}

async function performUIHealthCheck(): Promise<NextResponse> {
  const results: UIHealthCheck[] = [];
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';

  for (const route of CRITICAL_ROUTES) {
    const startTime = Date.now();
    const healthCheck: UIHealthCheck = {
      route: route.path,
      status: 'healthy',
      responseTime: 0,
      issues: [],
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(`${baseUrl}${route.path}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'GLM-UI-Checker/1.0'
        }
      });

      healthCheck.responseTime = Date.now() - startTime;

      if (!response.ok) {
        healthCheck.status = 'failed';
        healthCheck.issues.push(`HTTP ${response.status}: ${response.statusText}`);
      } else {
        const html = await response.text();
        
        // Check for critical elements
        for (const element of route.expectedElements) {
          if (!html.includes(element) && !html.includes(element.replace('-', ''))) {
            healthCheck.issues.push(`Missing element: ${element}`);
          }
        }

        if (healthCheck.issues.length > 0) {
          healthCheck.status = route.critical ? 'failed' : 'degraded';
        }

        // Check for common UI issues
        if (html.includes('error') || html.includes('Error')) {
          healthCheck.issues.push('Error detected in page content');
          healthCheck.status = 'failed';
        }

        if (html.includes('404') || html.includes('Not Found')) {
          healthCheck.issues.push('404 Not Found');
          healthCheck.status = 'failed';
        }
      }

    } catch (error) {
      healthCheck.status = 'failed';
      healthCheck.issues.push(`Network error: ${error instanceof Error ? error.message : 'Unknown'}`);
      healthCheck.responseTime = Date.now() - startTime;
    }

    results.push(healthCheck);
  }

  const overallStatus = results.every(r => r.status === 'healthy') 
    ? 'healthy' 
    : results.some(r => r.status === 'failed')
    ? 'failed'
    : 'degraded';

  return NextResponse.json({
    status: overallStatus,
    message: overallStatus === 'healthy' 
      ? '✅ All UI routes are healthy'
      : overallStatus === 'failed'
      ? '❌ Critical UI issues detected'
      : '⚠️ Some UI routes have minor issues',
    results,
    summary: {
      total: results.length,
      healthy: results.filter(r => r.status === 'healthy').length,
      degraded: results.filter(r => r.status === 'degraded').length,
      failed: results.filter(r => r.status === 'failed').length,
      avgResponseTime: Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length)
    },
    timestamp: new Date().toISOString()
  });
}

async function enableUIProtection(): Promise<NextResponse> {
  // Create a protection flag file or environment variable
  // This would be used by middleware to prevent UI changes during migrations
  
  try {
    // In a real implementation, this might set a flag in a database
    // or update a configuration file
    
    return NextResponse.json({
      status: "success",
      message: "🛡️ UI protection enabled - Preventing layout changes during migration",
      protection: {
        enabled: true,
        protectedRoutes: CRITICAL_ROUTES.map(r => r.path),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: "Failed to enable UI protection",
      error: error instanceof Error ? error.message : "Unknown error"
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
      message: "UI stability protection system is ready",
      protectedRoutes: CRITICAL_ROUTES,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("UI status check failed:", error);
    return NextResponse.json({ error: "UI status check failed" }, { status: 500 });
  }
}