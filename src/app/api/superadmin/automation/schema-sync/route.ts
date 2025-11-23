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
        task_name: 'schema_sync',
        status: 'running',
        message: 'Schema synchronization started',
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
      // Call the sync_schema RPC function
      const { data, error } = await supabase.rpc('sync_schema')
      
      if (error) {
        throw error
      }

      syncResult = data

      // Update log entry with success
      await supabase
        .from('automation_logs')
        .update({
          status: 'success',
          message: 'Schema synchronization completed successfully',
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
        .eq('task_name', 'schema_sync')

    } catch (error) {
      syncError = error
      console.error('Schema sync failed:', error)

      // Update log entry with failure
      await supabase
        .from('automation_logs')
        .update({
          status: 'failed',
          message: `Schema sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        ? `Schema sync failed: ${syncError instanceof Error ? syncError.message : 'Unknown error'}`
        : 'Schema synchronization completed successfully',
      result: syncResult,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Schema sync API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}