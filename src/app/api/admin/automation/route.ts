import { NextRequest, NextResponse } from 'next/server'

// Enhanced automation configuration with migrated cloud APIs
const automationTasksConfig = [
  {
    id: 'schema-sync',
    name: 'Schema Sync',
    description: 'Automatically sync database schema changes',
    schedule: '0 */6 * * *', // Every 6 hours
    endpoint: '/api/admin/automation/schema-sync'
  },
  {
    id: 'auto-sync',
    name: 'Auto-Sync',
    description: 'Automatically sync data to Supabase',
    schedule: '0 */2 * * *', // Every 2 hours
    endpoint: '/api/admin/automation/auto-sync'
  },
  {
    id: 'backup-now',
    name: 'Backup Now',
    description: 'Create immediate backup to Supabase storage',
    schedule: 'manual', // Manual trigger only
    endpoint: '/api/admin/automation/backup'
  },
  {
    id: 'database-backup',
    name: 'Database Backup',
    description: 'Scheduled database backups',
    schedule: '0 2 * * *', // Daily at 2 AM
    endpoint: '/api/admin/automation/backup'
  },
  {
    id: 'database-restore',
    name: 'Database Restore',
    description: 'Restore database from backup files',
    schedule: 'manual', // Manual trigger only
    endpoint: '/api/admin/automation/restore'
  },
  {
    id: 'health-check',
    name: 'Health Check',
    description: 'Monitor system health and performance metrics',
    schedule: '*/5 * * * *', // Every 5 minutes
    endpoint: '/api/admin/automation/health-check'
  },
  {
    id: 'log-rotation',
    name: 'Log Rotation',
    description: 'Clean and archive old logs',
    schedule: '0 0 * * 0', // Weekly on Sunday
    endpoint: '/api/admin/automation/log-rotation'
  },
  {
    id: 'ai-optimization',
    name: 'AI Optimization',
    description: 'Analyze and optimize AI usage patterns',
    schedule: '0 */4 * * *', // Every 4 hours
    endpoint: '/api/admin/automation/ai-optimization'
  },
  {
    id: 'security-scan',
    name: 'Security Scan',
    description: 'Run security and permission checks',
    schedule: '0 3 * * 1', // Weekly on Monday at 3 AM
    endpoint: '/api/admin/automation/security-scan'
  }
]

// Mock data storage (in production, this would be in a database)
let notifications = [
  { event: 'New Client Signup', enabled: true, lastTriggered: '2 hours ago' },
  { event: 'Subscription Renewed', enabled: true, lastTriggered: '1 day ago' },
  { event: 'Payment Failed', enabled: true, lastTriggered: '3 days ago' },
  { event: 'System Maintenance', enabled: false, lastTriggered: '1 week ago' }
]

let emailAutomations = [
  { type: 'Welcome Email', status: 'Active', sent: '24', pending: '0' },
  { type: 'Trial Expiry Reminder', status: 'Active', sent: '12', pending: '3' },
  { type: 'Payment Failed', status: 'Active', sent: '2', pending: '1' },
  { type: 'Renewal Reminder', status: 'Paused', sent: '8', pending: '5' }
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        automationTasks: automationTasksConfig,
        notifications,
        emailAutomations
      }
    })
  } catch (error) {
    console.error('Error fetching automation data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch automation data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, type, event, taskName } = body

    switch (action) {
      case 'toggleNotification':
        const notificationIndex = notifications.findIndex(n => n.event === event)
        if (notificationIndex !== -1) {
          notifications[notificationIndex] = {
            ...notifications[notificationIndex],
            enabled: !notifications[notificationIndex].enabled,
            lastTriggered: notifications[notificationIndex].enabled ? 'Just now' : notifications[notificationIndex].lastTriggered
          }
          return NextResponse.json({
            success: true,
            message: `Notification ${event} ${notifications[notificationIndex].enabled ? 'enabled' : 'disabled'} successfully`,
            data: notifications[notificationIndex]
          })
        }
        break

      case 'toggleEmail':
        const emailIndex = emailAutomations.findIndex(e => e.type === type)
        if (emailIndex !== -1) {
          emailAutomations[emailIndex] = {
            ...emailAutomations[emailIndex],
            status: emailAutomations[emailIndex].status === 'Active' ? 'Paused' : 'Active'
          }
          return NextResponse.json({
            success: true,
            message: `Email ${type} ${emailAutomations[emailIndex].status === 'Active' ? 'activated' : 'paused'} successfully`,
            data: emailAutomations[emailIndex]
          })
        }
        break

      case 'runTask':
        // Simulate running a system task
        await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate task execution
        
        return NextResponse.json({
          success: true,
          message: `Task ${taskName} completed successfully`,
          data: {
            taskName,
            status: 'completed',
            executedAt: new Date().toISOString(),
            result: `Task ${taskName} executed successfully`
          }
        })

      case 'sendTestEmail':
        // Simulate sending a test email
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        return NextResponse.json({
          success: true,
          message: `Test email sent for ${type}`,
          data: {
            type,
            sentAt: new Date().toISOString(),
            status: 'sent'
          }
        })

      case 'triggerNotification':
        // Simulate triggering a push notification
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const notifIndex = notifications.findIndex(n => n.event === event)
        if (notifIndex !== -1) {
          notifications[notifIndex].lastTriggered = 'Just now'
        }
        
        return NextResponse.json({
          success: true,
          message: `Push notification triggered for ${event}`,
          data: {
            event,
            triggeredAt: new Date().toISOString(),
            status: 'triggered'
          }
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json(
      { success: false, error: 'Item not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error in automation API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    switch (type) {
      case 'notification':
        const notifIndex = notifications.findIndex(n => n.event === data.event)
        if (notifIndex !== -1) {
          notifications[notifIndex] = { ...notifications[notifIndex], ...data }
          return NextResponse.json({
            success: true,
            message: 'Notification updated successfully',
            data: notifications[notifIndex]
          })
        }
        break

      case 'email':
        const emailIndex = emailAutomations.findIndex(e => e.type === data.type)
        if (emailIndex !== -1) {
          emailAutomations[emailIndex] = { ...emailAutomations[emailIndex], ...data }
          return NextResponse.json({
            success: true,
            message: 'Email automation updated successfully',
            data: emailAutomations[emailIndex]
          })
        }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type' },
          { status: 400 }
        )
    }

    return NextResponse.json(
      { success: false, error: 'Item not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error updating automation:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}