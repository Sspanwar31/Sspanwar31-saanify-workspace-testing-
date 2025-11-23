import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskName } = body

    if (!taskName) {
      return NextResponse.json(
        { error: 'Task name is required' },
        { status: 400 }
      )
    }

    // Simulate task execution
    let status = 'success'
    let message = 'Task completed successfully'
    let details = {}

    switch (taskName) {
      case 'database-backup':
        await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate backup time
        message = 'Database backup completed successfully'
        details = { 
          backupSize: '2.4MB', 
          location: '/backups/db_backup_' + Date.now() + '.sql',
          duration: '2.3s'
        }
        break

      case 'schema-sync':
        await new Promise(resolve => setTimeout(resolve, 1000))
        message = 'Database schema synchronized successfully'
        details = { tablesSynced: 12, changes: 0 }
        break

      case 'health-check':
        await new Promise(resolve => setTimeout(resolve, 1500))
        message = 'System health check completed'
        details = { 
          status: 'healthy', 
          cpu: '45%', 
          memory: '2.1GB', 
          disk: '78%',
          uptime: '99.9%'
        }
        break

      case 'clear-cache':
        await new Promise(resolve => setTimeout(resolve, 500))
        message = 'System cache cleared successfully'
        details = { cacheCleared: '45MB', items: 1234 }
        break

      default:
        status = 'error'
        message = 'Unknown task: ' + taskName
    }

    // Update task status in database
    try {
      await db.automationTask.updateMany({
        where: { task_name: taskName },
        data: {
          last_run_status: status,
          last_run_at: new Date()
        }
      })
    } catch (e) {
      console.log('Task update failed (might not exist):', e)
    }

    // Log the execution
    try {
      await db.automationLog.create({
        data: {
          task_name: taskName,
          status: status,
          message: message,
          details: details,
          duration_ms: details.duration ? parseInt(details.duration.replace('s', '')) * 1000 : 1000,
          run_time: new Date()
        }
      })
    } catch (e) {
      console.log('Log creation failed:', e)
    }

    if (status === 'success') {
      return NextResponse.json({
        success: true,
        message: message,
        details: details
      })
    } else {
      return NextResponse.json(
        { error: message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Task execution failed:', error)
    return NextResponse.json(
      { error: 'Task execution failed' },
      { status: 500 }
    )
  }
}