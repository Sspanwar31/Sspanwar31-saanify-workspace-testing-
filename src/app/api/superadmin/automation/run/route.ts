import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase-service'
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    // Support both cookies and Authorization header
    let token = request.cookies.get("auth-token")?.value;
    
    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Task name is required' }, { status: 401 });
    }
    
    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-it";
    try {
      jwt.verify(token, JWT_SECRET);
    } catch(e) {
      return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
    }
    
    const body = await request.json()
    const { task, taskName } = body

    // Support both parameter names for flexibility
    const targetTask = taskName || task

    if (!targetTask) {
      return NextResponse.json({ error: 'Task name is required' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const jobId = crypto.randomUUID()

    // Insert running log entry
    const { data: logEntry, error: logError } = await supabase
      .from('automation_logs')
      .insert({
        id: jobId,
        task_name: targetTask,
        status: 'running',
        message: `Task "${targetTask}" started manually`,
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
      .eq('task_name', targetTask)

    // Execute the task based on type
    let taskResult = null
    let taskError = null

    try {
      switch (targetTask) {
        case 'schema_sync':
        case 'schema-sync':
          taskResult = await supabase.rpc('sync_schema')
          break
        case 'auto_sync_data':
        case 'auto-sync':
          taskResult = await supabase.rpc('auto_sync_data')
          break
        case 'backup':
        case 'database-backup':
          taskResult = await supabase.rpc('run_backup')
          break
        case 'health_check':
        case 'health-check':
          taskResult = await supabase.rpc('health_check')
          break
        case 'database-restore':
          taskResult = { message: 'Database restore task triggered' }
          break
        default:
          // For unknown tasks, just log that they were triggered
          taskResult = { message: `Task "${targetTask}" triggered successfully` }
          console.log(`Unknown task triggered: ${targetTask}`)
      }

      // Update log entry with success
      await supabase
        .from('automation_logs')
        .update({
          status: 'success',
          message: `Task "${targetTask}" completed successfully`,
          details: { 
            result: taskResult,
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', jobId)

    } catch (error) {
      taskError = error
      console.error(`Task ${targetTask} failed:`, error)

      // Update log entry with failure
      await supabase
        .from('automation_logs')
        .update({
          status: 'failed',
          message: `Task "${targetTask}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      task: targetTask,
      message: taskError 
        ? `Task "${targetTask}" failed: ${taskError instanceof Error ? taskError.message : 'Unknown error'}`
        : `Task "${targetTask}" completed successfully`,
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