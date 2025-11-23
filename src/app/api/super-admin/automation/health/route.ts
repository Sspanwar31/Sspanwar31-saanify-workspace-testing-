import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const startTime = Date.now()

    // Run comprehensive health checks
    const healthChecks = {
      database: { status: 'unknown', details: null },
      storage: { status: 'unknown', details: null },
      tables: { status: 'unknown', details: null },
      automation: { status: 'unknown', details: null }
    }

    // Database connectivity check
    try {
      const { data, error } = await supabase.rpc('health_check')
      
      if (error) {
        healthChecks.database = { 
          status: 'error', 
          details: error.message 
        }
      } else {
        healthChecks.database = { 
          status: 'healthy', 
          details: data 
        }
      }
    } catch (error) {
      healthChecks.database = { 
        status: 'error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }
    }

    // Storage check
    try {
      const { data, error } = await supabase.storage
        .from('automated-backups')
        .list('', { limit: 1 })

      if (error) {
        healthChecks.storage = { 
          status: 'warning', 
          details: `Storage check failed: ${error.message}` 
        }
      } else {
        healthChecks.storage = { 
          status: 'healthy', 
          details: { accessible: true, bucket_exists: true } 
        }
      }
    } catch (error) {
      healthChecks.storage = { 
        status: 'error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }
    }

    // Tables check
    try {
      const requiredTables = ['automation_tasks', 'automation_logs', 'secrets', 'automation_meta', 'users', 'societies']
      const tableStatus = {}

      for (const table of requiredTables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
          
          tableStatus[table] = {
            exists: !error,
            row_count: count || 0,
            error: error?.message || null
          }
        } catch (tableError) {
          tableStatus[table] = {
            exists: false,
            row_count: 0,
            error: tableError instanceof Error ? tableError.message : 'Unknown error'
          }
        }
      }

      const allTablesExist = Object.values(tableStatus).every((status: any) => status.exists)
      healthChecks.tables = {
        status: allTablesExist ? 'healthy' : 'error',
        details: tableStatus
      }

    } catch (error) {
      healthChecks.tables = { 
        status: 'error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }
    }

    // Automation system check
    try {
      // Check if automation tasks exist
      const { data: tasks, error: tasksError } = await supabase
        .from('automation_tasks')
        .select('task_name, enabled, last_run')
        .limit(10)

      if (tasksError) {
        healthChecks.automation = { 
          status: 'error', 
          details: tasksError.message 
        }
      } else {
        // Check recent logs
        const { data: recentLogs, error: logsError } = await supabase
          .from('automation_logs')
          .select('task_name, status, run_time')
          .order('run_time', { ascending: false })
          .limit(5)

        healthChecks.automation = {
          status: 'healthy',
          details: {
            tasks_configured: tasks?.length || 0,
            recent_logs: recentLogs || [],
            last_log_time: recentLogs?.[0]?.run_time || null
          }
        }
      }
    } catch (error) {
      healthChecks.automation = { 
        status: 'error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }
    }

    // Calculate overall health
    const statuses = Object.values(healthChecks).map(check => check.status)
    const overallStatus = statuses.every(s => s === 'healthy') 
      ? 'healthy' 
      : statuses.some(s => s === 'error') 
        ? 'error' 
        : 'warning'

    const endTime = Date.now()
    const duration = endTime - startTime

    return NextResponse.json({
      success: true,
      overall_status: overallStatus,
      checks: healthChecks,
      performance: {
        response_time_ms: duration,
        timestamp: new Date().toISOString()
      },
      environment: {
        node_env: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV || 'unknown'
      }
    })

  } catch (error) {
    console.error('Health check API error:', error)
    return NextResponse.json({ 
      success: false,
      overall_status: 'error',
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}