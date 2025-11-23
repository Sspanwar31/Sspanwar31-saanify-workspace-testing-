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
        task_name: 'backup',
        status: 'running',
        message: 'Backup process started',
        details: { trigger: 'manual', initiated_at: new Date().toISOString() }
      })
      .select()
      .single()

    if (logError) {
      console.error('Error creating log entry:', logError)
      return NextResponse.json({ error: 'Failed to create log entry' }, { status: 500 })
    }

    let backupResult = null
    let backupError = null

    try {
      // Call the run_backup RPC function first
      const { data: rpcResult, error: rpcError } = await supabase.rpc('run_backup')
      
      if (rpcError) {
        throw rpcError
      }

      // Create backup metadata
      const backupMetadata = {
        backup_id: rpcResult?.job_id || jobId,
        timestamp: new Date().toISOString(),
        tables: [],
        total_records: 0,
        file_size: 0,
        storage_path: null
      }

      // Get table counts for backup metadata
      const tables = ['users', 'societies', 'automation_tasks', 'automation_logs', 'secrets', 'automation_meta']
      
      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
          
          if (!error) {
            backupMetadata.tables.push({
              name: table,
              record_count: count || 0
            })
            backupMetadata.total_records += count || 0
          }
        } catch (tableError) {
          console.error(`Error counting ${table}:`, tableError)
        }
      }

      // Create backup JSON file
      const backupData = {
        metadata: backupMetadata,
        schema_version: '1.0',
        created_at: new Date().toISOString(),
        created_by: 'automation_system'
      }

      // Upload to Supabase storage
      const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('automated-backups')
        .upload(fileName, JSON.stringify(backupData, null, 2), {
          contentType: 'application/json',
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        // Continue even if storage fails - backup metadata is still logged
      } else {
        backupMetadata.storage_path = fileName
        backupMetadata.file_size = JSON.stringify(backupData).length
      }

      backupResult = {
        rpc_result: rpcResult,
        metadata: backupMetadata,
        storage_upload: uploadData ? 'success' : 'failed',
        file_name: fileName
      }

      // Update log entry with success
      await supabase
        .from('automation_logs')
        .update({
          status: 'success',
          message: 'Backup completed successfully',
          details: { 
            backup_result: backupResult,
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
        .eq('task_name', 'backup')

    } catch (error) {
      backupError = error
      console.error('Backup failed:', error)

      // Update log entry with failure
      await supabase
        .from('automation_logs')
        .update({
          status: 'failed',
          message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { 
            error: error instanceof Error ? error.message : 'Unknown error',
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', jobId)
    }

    return NextResponse.json({
      success: !backupError,
      job_id: jobId,
      message: backupError 
        ? `Backup failed: ${backupError instanceof Error ? backupError.message : 'Unknown error'}`
        : 'Backup completed successfully',
      result: backupResult,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Backup API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}