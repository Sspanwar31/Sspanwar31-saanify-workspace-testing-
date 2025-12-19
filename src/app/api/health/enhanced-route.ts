import { NextResponse } from 'next/server';
import { performHealthCheck, monitorDatabasePerformance, getConnectionPoolStats, attemptDatabaseRecovery } from '@/lib/db-health';
import { errorMonitor } from '@/lib/enhanced-error-handler';

// Enhanced health check endpoint with comprehensive monitoring
export async function GET(request: Request) {
  const startTime = Date.now();
  
  console.log('🏥 [HEALTH] Health check requested', {
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString()
  });

  try {
    // Perform comprehensive health check
    const health = await performHealthCheck();
    
    // Get additional metrics
    const [dbPerformance, dbPoolStats, errorMetrics] = await Promise.allSettled([
      monitorDatabasePerformance(),
      getConnectionPoolStats(),
      Promise.resolve(errorMonitor.getMetrics())
    ]);

    // Build comprehensive health response
    const healthResponse = {
      status: health.status,
      timestamp: health.timestamp,
      uptime: health.uptime,
      database: {
        connected: health.database.connected,
        responseTime: health.database.responseTime,
        error: health.database.error,
        details: health.database.details,
        performance: dbPerformance.status === 'fulfilled' ? dbPerformance.value : null,
        connectionPool: dbPoolStats.status === 'fulfilled' ? dbPoolStats.value : null
      },
      system: {
        memory: health.memory,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      errors: errorMetrics.status === 'fulfilled' ? errorMetrics.value : null,
      metrics: {
        responseTime: Date.now() - startTime,
        requestId: `health-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    };

    // Log health check results
    console.log('📊 [HEALTH] Health check completed', {
      status: health.status,
      dbConnected: health.database.connected,
      dbResponseTime: health.database.responseTime,
      memoryUsage: health.memory?.percentage,
      totalErrors: errorMetrics.status === 'fulfilled' ? errorMetrics.value.totalErrors : 0,
      responseTime: healthResponse.metrics.responseTime
    });

    // Determine HTTP status code based on health
    let statusCode = 200;
    if (health.status === 'unhealthy') {
      statusCode = 503;
    } else if (health.status === 'degraded') {
      statusCode = 200; // Still serve traffic but indicate issues
    }

    return NextResponse.json(healthResponse, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Health-Status': health.status,
        'X-Response-Time': `${healthResponse.metrics.responseTime}ms`
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('💥 [HEALTH] Health check failed', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    });

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      metrics: {
        responseTime: duration,
        requestId: `health-failed-${Date.now()}`
      }
    }, {
      status: 503,
      headers: {
        'X-Health-Status': 'unhealthy',
        'X-Response-Time': `${duration}ms`
      }
    });
  }
}

// Health check with recovery attempt
export async function POST(request: Request) {
  console.log('🔄 [HEALTH] Recovery health check requested');

  try {
    const body = await request.json().catch(() => ({}));
    const { attemptRecovery = false, maxAttempts = 3 } = body;

    // First, check current health
    const health = await performHealthCheck();

    // If unhealthy and recovery is requested, attempt recovery
    if (health.status === 'unhealthy' && attemptRecovery) {
      console.log('🔄 [HEALTH] Attempting database recovery...');
      
      const recoverySuccess = await attemptDatabaseRecovery(maxAttempts);
      
      if (recoverySuccess) {
        // Re-check health after recovery
        const newHealth = await performHealthCheck();
        
        return NextResponse.json({
          status: newHealth.status,
          timestamp: newHealth.timestamp,
          recovery: {
            attempted: true,
            successful: true,
            attempts: maxAttempts
          },
          health: newHealth
        });
      } else {
        return NextResponse.json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          recovery: {
            attempted: true,
            successful: false,
            attempts: maxAttempts
          },
          health
        }, { status: 503 });
      }
    }

    return NextResponse.json({
      status: health.status,
      timestamp: health.timestamp,
      recovery: {
        attempted: false,
        successful: false
      },
      health
    });

  } catch (error) {
    console.error('💥 [HEALTH] Recovery health check failed', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Recovery health check failed',
      recovery: {
        attempted: false,
        successful: false
      }
    }, { status: 503 });
  }
}

// Simple ping endpoint for load balancers
export async function HEAD(request: Request) {
  console.log('🏓 [HEALTH] Ping received');

  try {
    // Quick database connectivity check
    const dbHealth = await performHealthCheck();
    
    const statusCode = dbHealth.database.connected ? 200 : 503;
    
    return new Response(null, {
      status: statusCode,
      headers: {
        'X-Health-Status': dbHealth.database.connected ? 'healthy' : 'unhealthy',
        'X-Timestamp': new Date().toISOString()
      }
    });
    
  } catch (error) {
    return new Response(null, {
      status: 503,
      headers: {
        'X-Health-Status': 'unhealthy',
        'X-Timestamp': new Date().toISOString()
      }
    });
  }
}

// Readiness probe (for Kubernetes/container orchestration)
export async function PUT(request: Request) {
  console.log('🚀 [HEALTH] Readiness probe requested');

  try {
    const startTime = Date.now();
    
    // Check critical systems
    const checks = await Promise.allSettled([
      // Database connectivity
      (async () => {
        const health = await performHealthCheck();
        return {
          database: health.database.connected,
          responseTime: health.database.responseTime
        };
      })(),
      
      // Memory check
      (async () => {
        if (typeof process !== 'undefined' && process.memoryUsage) {
          const memUsage = process.memoryUsage();
          const percentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
          return {
            memoryUsage: Math.round(percentage),
            withinThreshold: percentage < 90
          };
        }
        return { memoryUsage: 0, withinThreshold: true };
      })()
    ]);

    const dbCheck = checks[0];
    const memCheck = checks[1];

    const ready = 
      dbCheck.status === 'fulfilled' && 
      dbCheck.value.database &&
      memCheck.status === 'fulfilled' && 
      memCheck.value.withinThreshold;

    const responseTime = Date.now() - startTime;

    const readinessResponse = {
      ready,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbCheck.status === 'fulfilled' ? dbCheck.value : { error: 'Failed' },
        memory: memCheck.status === 'fulfilled' ? memCheck.value : { error: 'Failed' }
      },
      metrics: {
        responseTime,
        uptime: process.uptime()
      }
    };

    console.log('🎯 [HEALTH] Readiness probe completed', {
      ready,
      responseTime: `${responseTime}ms`,
      databaseConnected: dbCheck.status === 'fulfilled' ? dbCheck.value.database : false,
      memoryUsage: memCheck.status === 'fulfilled' ? memCheck.value.memoryUsage : 0
    });

    return NextResponse.json(readinessResponse, {
      status: ready ? 200 : 503,
      headers: {
        'X-Readiness-Status': ready ? 'ready' : 'not-ready',
        'X-Response-Time': `${responseTime}ms`
      }
    });

  } catch (error) {
    console.error('💥 [HEALTH] Readiness probe failed', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json({
      ready: false,
      timestamp: new Date().toISOString(),
      error: 'Readiness probe failed'
    }, {
      status: 503,
      headers: {
        'X-Readiness-Status': 'not-ready'
      }
    });
  }
}