import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const jobId = crypto.randomUUID()

    // Insert running log entry
    const { data: logEntry, error: logError } = await supabase
      .from('automation_logs')
      .insert({
        id: jobId,
        task_name: 'auto_sync_data',
        status: 'running',
        message: 'Auto data synchronization started',
        details: { trigger: 'manual', initiated_at: new Date().toISOString() }
      })
      .select()
      .single()

    if (logError) {
      console.error('Error creating log entry:', logError)
      return NextResponse.json({ error: 'Failed to create log entry' }, { status: 500 })
    }

    let syncResult = null
    let syncError = null

    try {
      // Call the auto_sync_data RPC function
      const { data, error } = await supabase.rpc('auto_sync_data')
      
      if (error) {
        throw error
      }

      syncResult = data

      // Update log entry with success
      await supabase
        .from('automation_logs')
        .update({
          status: 'success',
          message: 'Auto data synchronization completed successfully',
          details: { 
            sync_result: syncResult,
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', jobId)

      // Update task last_run time
      await supabase
        .from('automation_tasks')
        .update({ 
          last_run: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('task_name', 'auto_sync_data')

    } catch (error) {
      syncError = error
      console.error('Auto sync failed:', error)

      // Update log entry with failure
      await supabase
        .from('automation_logs')
        .update({
          status: 'failed',
          message: `Auto sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { 
            error: error instanceof Error ? error.message : 'Unknown error',
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', jobId)
    }

    return NextResponse.json({
      success: !syncError,
      job_id: jobId,
      message: syncError 
        ? `Auto sync failed: ${syncError instanceof Error ? syncError.message : 'Unknown error'}`
        : 'Auto data synchronization completed successfully',
      result: syncResult,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Auto sync API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}