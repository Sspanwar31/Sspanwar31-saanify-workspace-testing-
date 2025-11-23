import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const task_name = searchParams.get('task_name')
    const status = searchParams.get('status')

    const supabase = getServiceClient()
    
    // Build query
    let query = supabase
      .from('automation_logs')
      .select('*', { count: 'exact' })
      .order('run_time', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    // Apply filters
    if (task_name) {
      query = query.eq('task_name', task_name)
    }
    
    if (status) {
      query = query.eq('status', status)
    }

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Error fetching logs:', error)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    // Get unique task names for filtering
    const { data: taskNames, error: taskNamesError } = await supabase
      .from('automation_logs')
      .select('task_name')
      .not('task_name', 'is', null)

    const uniqueTaskNames = taskNamesError 
      ? [] 
      : [...new Set(taskNames?.map(log => log.task_name) || [])]

    return NextResponse.json({
      success: true,
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      filters: {
        task_names: uniqueTaskNames,
        current_task_name: task_name,
        current_status: status
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Logs API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}