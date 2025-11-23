import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const confirm = formData.get('confirm') === 'true'
    const preview = formData.get('preview') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/json', 'application/sql', 'application/gzip', 'application/x-gzip']
    const fileName = file.name.toLowerCase()
    
    if (!allowedTypes.includes(file.type) && !fileName.endsWith('.sql') && !fileName.endsWith('.json') && !fileName.endsWith('.tar.gz')) {
      return NextResponse.json({ 
        error: 'Invalid file type. Allowed: .json, .sql, .tar.gz' 
      }, { status: 400 })
    }

    const supabase = getServiceClient()
    const jobId = crypto.randomUUID()

    // Read file content
    const fileContent = await file.text()
    
    // Parse backup file
    let backupData = null
    let parseError = null

    try {
      backupData = JSON.parse(fileContent)
    } catch (error) {
      parseError = error
      console.error('Failed to parse backup file:', error)
    }

    if (parseError) {
      return NextResponse.json({ 
        error: 'Invalid backup file format',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      }, { status: 400 })
    }

    // Validate backup structure
    if (!backupData.metadata || !backupData.metadata.tables) {
      return NextResponse.json({ 
        error: 'Invalid backup file structure',
        details: 'Missing required metadata'
      }, { status: 400 })
    }

    // Insert restore log entry
    const { data: logEntry, error: logError } = await supabase
      .from('automation_logs')
      .insert({
        id: jobId,
        task_name: 'restore',
        status: preview ? 'running' : 'running',
        message: preview ? 'Restore preview started' : 'Restore process started',
        details: { 
          file_name: file.name,
          file_size: file.size,
          backup_metadata: backupData.metadata,
          preview_mode: preview,
          initiated_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (logError) {
      console.error('Error creating log entry:', logError)
      return NextResponse.json({ error: 'Failed to create log entry' }, { status: 500 })
    }

    let restoreResult = null
    let restoreError = null

    try {
      // Safety checks
      const safetyChecks = {
        hasValidMetadata: !!backupData.metadata,
        hasTables: Array.isArray(backupData.metadata.tables) && backupData.metadata.tables.length > 0,
        totalRecords: backupData.metadata.total_records || 0,
        backupAge: backupData.metadata.timestamp ? new Date(backupData.metadata.timestamp) : null
      }

      // Check if backup is too old (older than 1 year)
      if (safetyChecks.backupAge) {
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        if (safetyChecks.backupAge < oneYearAgo) {
          throw new Error('Backup is older than 1 year. For safety, please use a more recent backup.')
        }
      }

      // Preview mode - don't actually restore
      if (preview) {
        restoreResult = {
          preview: true,
          safety_checks: safetyChecks,
          backup_summary: {
            tables: backupData.metadata.tables,
            total_records: backupData.metadata.total_records,
            backup_date: backupData.metadata.timestamp,
            schema_version: backupData.schema_version
          },
          warnings: safetyChecks.backupAge && safetyChecks.backupAge < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
            ? ['Backup is older than 30 days'] 
            : []
        }

        // Update log entry with preview success
        await supabase
          .from('automation_logs')
          .update({
            status: 'success',
            message: 'Restore preview completed successfully',
            details: { 
              preview_result: restoreResult,
              completed_at: new Date().toISOString()
            }
          })
          .eq('id', jobId)

      } else {
        // Actual restore - requires confirmation
        if (!confirm) {
          throw new Error('Restore requires explicit confirmation. Set confirm=true to proceed.')
        }

        // In a real implementation, this would perform the actual restore
        // For safety, we'll just log the restore attempt
        restoreResult = {
          restore: true,
          safety_checks: safetyChecks,
          backup_summary: {
            tables: backupData.metadata.tables,
            total_records: backupData.metadata.total_records,
            backup_date: backupData.metadata.timestamp
          },
          note: 'Actual restore implementation would be performed here. For safety, this is a simulation.',
          restored_tables: backupData.metadata.tables.map((t: any) => t.name)
        }

        // Update log entry with restore success
        await supabase
          .from('automation_logs')
          .update({
            status: 'success',
            message: 'Restore completed successfully (simulation mode)',
            details: { 
              restore_result: restoreResult,
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
          .eq('task_name', 'restore')
      }

    } catch (error) {
      restoreError = error
      console.error('Restore failed:', error)

      // Update log entry with failure
      await supabase
        .from('automation_logs')
        .update({
          status: 'failed',
          message: `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { 
            error: error instanceof Error ? error.message : 'Unknown error',
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', jobId)
    }

    return NextResponse.json({
      success: !restoreError,
      job_id: jobId,
      message: restoreError 
        ? `Restore failed: ${restoreError instanceof Error ? restoreError.message : 'Unknown error'}`
        : preview 
          ? 'Restore preview completed successfully'
          : 'Restore completed successfully (simulation mode)',
      result: restoreResult,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Restore API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}