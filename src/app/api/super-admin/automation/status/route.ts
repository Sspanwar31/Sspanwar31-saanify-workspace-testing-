import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    
    // Get all tasks with their latest run status
    const { data: tasks, error: tasksError } = await supabase
      .from('automation_tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    // Get latest logs for each task
    const { data: logs, error: logsError } = await supabase
      .from('automation_logs')
      .select('*')
      .order('run_time', { ascending: false })
      .limit(100)

    if (logsError) {
      console.error('Error fetching logs:', logsError)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    // Group logs by task name and get latest for each
    const latestLogsByTask = logs?.reduce((acc, log) => {
      if (!acc[log.task_name] || new Date(log.run_time) > new Date(acc[log.task_name].run_time)) {
        acc[log.task_name] = log
      }
      return acc
    }, {} as Record<string, any>) || {}

    // Combine tasks with their latest status
    const tasksWithStatus = tasks?.map(task => ({
      ...task,
      latest_run: latestLogsByTask[task.task_name] || null
    })) || []

    // Get overall system health
    const { data: healthData, error: healthError } = await supabase.rpc('health_check')

    if (healthError) {
      console.error('Error checking health:', healthError)
    }

    return NextResponse.json({
      success: true,
      tasks: tasksWithStatus,
      recent_logs: logs?.slice(0, 20) || [],
      health: healthData || { success: false, message: 'Health check failed' },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Automation status error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}