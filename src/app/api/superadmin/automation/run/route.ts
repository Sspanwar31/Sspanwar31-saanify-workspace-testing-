import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { task } = body

    if (!task) {
      return NextResponse.json({ error: 'Task name is required' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const jobId = crypto.randomUUID()

    // Insert running log entry
    const { data: logEntry, error: logError } = await supabase
      .from('automation_logs')
      .insert({
        id: jobId,
        task_name: task,
        status: 'running',
        message: `Task "${task}" started manually`,
        details: { trigger: 'manual', initiated_at: new Date().toISOString() }
      })
      .select()
      .single()

    if (logError) {
      console.error('Error creating log entry:', logError)
      return NextResponse.json({ error: 'Failed to create log entry' }, { status: 500 })
    }

    // Update task last_run time
    await supabase
      .from('automation_tasks')
      .update({ 
        last_run: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('task_name', task)

    // Execute the task based on type
    let taskResult = null
    let taskError = null

    try {
      switch (task) {
        case 'schema_sync':
          taskResult = await supabase.rpc('sync_schema')
          break
        case 'auto_sync_data':
          taskResult = await supabase.rpc('auto_sync_data')
          break
        case 'backup':
          taskResult = await supabase.rpc('run_backup')
          break
        case 'health_check':
          taskResult = await supabase.rpc('health_check')
          break
        default:
          throw new Error(`Unknown task: ${task}`)
      }

      // Update log entry with success
      await supabase
        .from('automation_logs')
        .update({
          status: 'success',
          message: `Task "${task}" completed successfully`,
          details: { 
            result: taskResult,
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', jobId)

    } catch (error) {
      taskError = error
      console.error(`Task ${task} failed:`, error)

      // Update log entry with failure
      await supabase
        .from('automation_logs')
        .update({
          status: 'failed',
          message: `Task "${task}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { 
            error: error instanceof Error ? error.message : 'Unknown error',
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', jobId)
    }

    return NextResponse.json({
      success: !taskError,
      job_id: jobId,
      task,
      message: taskError 
        ? `Task "${task}" failed: ${taskError instanceof Error ? taskError.message : 'Unknown error'}`
        : `Task "${task}" completed successfully`,
      result: taskResult,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Run task error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}