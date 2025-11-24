import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth-middleware'
import { db } from '@/lib/db'
import { createClient } from '@supabase/supabase-js'

// SuperAdmin only automation endpoint
export const POST = withAdmin(async (request: NextRequest) => {
  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Perform health checks
    const startTime = Date.now()
    const healthResults = []

    // Check Supabase Database connectivity
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('count')
        .single()

      const dbResponseTime = Date.now() - startTime
      
      healthResults.push({
        service: 'Supabase Database',
        status: error ? 'unhealthy' : 'healthy',
        responseTime: dbResponseTime,
        details: error ? error.message : `${data?.count || 0} active sessions`
      })
    } catch (error) {
      healthResults.push({
        service: 'Supabase Database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: 'Connection failed'
      })
    }

    // Check Supabase Storage connectivity
    try {
      const { data, error } = await supabase.storage
        .from('automated-backups')
        .list()

      const storageResponseTime = Date.now() - startTime
      
      healthResults.push({
        service: 'Supabase Storage',
        status: error ? 'unhealthy' : 'healthy',
        responseTime: storageResponseTime,
        details: error ? error.message : `${data?.length || 0} files in bucket`
      })
    } catch (error) {
      healthResults.push({
        service: 'Supabase Storage',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: 'Storage access failed'
      })
    }

    // Check system resources (simplified)
    const memoryUsage = process.memoryUsage()
    const systemHealth = {
      service: 'System Resources',
      status: 'healthy',
      responseTime: 0,
      details: `Memory: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`
    }

    healthResults.push(systemHealth)

    // Store health check results
    const healthCheckData = {
      id: Date.now().toString(),
      checked_at: new Date().toISOString(),
      overall_status: healthResults.every(r => r.status === 'healthy') ? 'healthy' : 'degraded',
      results: healthResults
    }

    const { data, error } = await supabase
      .from('automation_health_checks')
      .insert([healthCheckData])
      .select()

    if (error) {
      console.error('Health check metadata error:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to store health check metadata' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Health check completed successfully',
      data: {
        checkId: healthCheckData.id,
        overallStatus: healthCheckData.overall_status,
        results: healthResults,
        timestamp: healthCheckData.checked_at
      }
    })

  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error during health check' 
    }, { status: 500 })
  }
})