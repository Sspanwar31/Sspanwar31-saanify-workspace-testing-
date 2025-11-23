import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const jobId = crypto.randomUUID()

    // Insert cron runner log entry
    const { data: logEntry, error: logError } = await supabase
      .from('automation_logs')
      .insert({
        id: jobId,
        task_name: 'cron_runner',
        status: 'running',
        message: 'Cron runner started',
        details: { 
          trigger: 'scheduled',
          initiated_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (logError) {
      console.error('Error creating cron log entry:', logError)
    }

    let cronResult = null
    let cronError = null

    try {
      // Get all enabled tasks that need to run
      const { data: tasks, error: tasksError } = await supabase
        .from('automation_tasks')
        .select('*')
        .eq('enabled', true)
        .or('next_run.is.null,next_run.lte.now()')

      if (tasksError) {
        throw new Error(`Failed to fetch tasks: ${tasksError.message}`)
      }

      const results = []

      // Process each task
      for (const task of tasks || []) {
        const taskJobId = crypto.randomUUID()
        
        try {
          // Insert task log entry
          await supabase
            .from('automation_logs')
            .insert({
              id: taskJobId,
              task_name: task.task_name,
              status: 'running',
              message: `Task "${task.task_name}" started by cron`,
              details: { 
                trigger: 'cron',
                schedule: task.schedule,
                initiated_at: new Date().toISOString()
              }
            })

          // Execute the task
          let taskResult = null
          let taskError = null

          try {
            switch (task.task_name) {
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
                throw new Error(`Unknown task: ${task.task_name}`)
            }

            // Update task log with success
            await supabase
              .from('automation_logs')
              .update({
                status: 'success',
                message: `Task "${task.task_name}" completed successfully`,
                details: { 
                  result: taskResult,
                  completed_at: new Date().toISOString()
                }
              })
              .eq('id', taskJobId)

            // Update task last_run time
            await supabase
              .from('automation_tasks')
              .update({ 
                last_run: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('task_name', task.task_name)

            results.push({
              task_name: task.task_name,
              status: 'success',
              result: taskResult,
              job_id: taskJobId
            })

          } catch (error) {
            taskError = error
            console.error(`Cron task ${task.task_name} failed:`, error)

            // Update task log with failure
            await supabase
              .from('automation_logs')
              .update({
                status: 'failed',
                message: `Task "${task.task_name}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                details: { 
                  error: error instanceof Error ? error.message : 'Unknown error',
                  failed_at: new Date().toISOString()
                }
              })
              .eq('id', taskJobId)

            results.push({
              task_name: task.task_name,
              status: 'failed',
              error: taskError instanceof Error ? taskError.message : 'Unknown error',
              job_id: taskJobId
            })
          }

        } catch (error) {
          console.error(`Failed to process task ${task.task_name}:`, error)
          results.push({
            task_name: task.task_name,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      cronResult = {
        tasks_processed: tasks?.length || 0,
        results: results,
        summary: {
          successful: results.filter(r => r.status === 'success').length,
          failed: results.filter(r => r.status === 'failed').length,
          errors: results.filter(r => r.status === 'error').length
        }
      }

      // Update cron runner log entry with success
      try {
        await supabase
          .from('automation_logs')
          .update({
            status: 'success',
            message: 'Cron runner completed successfully',
            details: { 
              cron_result: cronResult,
              completed_at: new Date().toISOString()
            }
          })
          .eq('id', jobId)
      } catch (logUpdateError) {
        console.error('Failed to update cron log entry:', logUpdateError)
      }

    } catch (error) {
      cronError = error
      console.error('Cron runner failed:', error)

      // Update cron runner log entry with failure
      try {
        await supabase
          .from('automation_logs')
          .update({
            status: 'failed',
            message: `Cron runner failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: { 
              error: error instanceof Error ? error.message : 'Unknown error',
              failed_at: new Date().toISOString()
            }
          })
          .eq('id', jobId)
      } catch (logUpdateError) {
        console.error('Failed to update cron log entry:', logUpdateError)
      }
    }

    return NextResponse.json({
      success: !cronError,
      job_id: jobId,
      message: cronError 
        ? `Cron runner failed: ${cronError instanceof Error ? cronError.message : 'Unknown error'}`
        : 'Cron runner completed successfully',
      result: cronResult,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cron API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}