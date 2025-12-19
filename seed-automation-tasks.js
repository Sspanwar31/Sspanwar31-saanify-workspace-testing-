const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function seedAutomationTasks() {
  try {
    console.log('🌱 Seeding automation tasks...')

    // Clear existing data
    await db.$executeRaw`DELETE FROM automation_tasks`
    await db.$executeRaw`DELETE FROM automation_logs`

    // Insert sample automation tasks
    const tasks = [
      {
        task_name: 'Database Backup',
        description: 'Automated daily backup of the main database',
        schedule: '0 2 * * *', // 2 AM daily
        enabled: true,
        last_run_status: 'SUCCESS',
        last_run_at: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        task_name: 'Log Rotation',
        description: 'Clean up old log files and rotate logs',
        schedule: '0 0 * * 0', // Weekly on Sunday
        enabled: true,
        last_run_status: 'SUCCESS',
        last_run_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
      },
      {
        task_name: 'Health Check',
        description: 'Monitor system health and performance metrics',
        schedule: '*/30 * * * *', // Every 30 minutes
        enabled: true,
        last_run_status: 'SUCCESS',
        last_run_at: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        task_name: 'Email Reports',
        description: 'Send daily usage and performance reports',
        schedule: '0 8 * * *', // 8 AM daily
        enabled: false,
        last_run_status: 'DISABLED',
        last_run_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        task_name: 'Cache Cleanup',
        description: 'Clear expired cache entries and temporary files',
        schedule: '0 3 * * *', // 3 AM daily
        enabled: true,
        last_run_status: 'FAILED',
        last_run_at: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      },
      {
        task_name: 'Security Scan',
        description: 'Run security vulnerability scans',
        schedule: '0 1 * * 1', // 1 AM every Monday
        enabled: true,
        last_run_status: 'SUCCESS',
        last_run_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
      },
      {
        task_name: 'Data Sync',
        description: 'Synchronize data with external services',
        schedule: '*/15 * * * *', // Every 15 minutes
        enabled: true,
        last_run_status: 'SUCCESS',
        last_run_at: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
      },
      {
        task_name: 'Performance Monitoring',
        description: 'Track application performance and generate alerts',
        schedule: '*/5 * * * *', // Every 5 minutes
        enabled: true,
        last_run_status: 'SUCCESS',
        last_run_at: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      }
    ]

    // Insert tasks
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      const taskId = `task_${i + 1}_${Date.now()}`
      await db.$executeRaw`
        INSERT INTO automation_tasks (id, task_name, description, schedule, enabled, last_run_status, last_run_at, created_at)
        VALUES (${taskId}, ${task.task_name}, ${task.description}, ${task.schedule}, ${task.enabled}, ${task.last_run_status}, ${task.last_run_at}, datetime('now'))
      `
    }

    // Insert sample logs
    const logs = [
      {
        task_name: 'Database Backup',
        status: 'SUCCESS',
        message: 'Database backup completed successfully. Size: 245MB',
        details: { size: '245MB', duration: '2m 15s', location: '/backups/db_backup_20241123.sql' },
        duration_ms: 135000,
        run_time: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        task_name: 'Health Check',
        status: 'SUCCESS',
        message: 'All systems operational',
        details: { cpu: '45%', memory: '62%', disk: '78%', uptime: '15d 8h' },
        duration_ms: 2500,
        run_time: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        task_name: 'Cache Cleanup',
        status: 'FAILED',
        message: 'Failed to clear cache directory',
        details: { error: 'Permission denied', path: '/tmp/cache' },
        duration_ms: 5000,
        run_time: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        task_name: 'Data Sync',
        status: 'SUCCESS',
        message: 'Data synchronized with external services',
        details: { records_synced: 1250, errors: 0, duration: '45s' },
        duration_ms: 45000,
        run_time: new Date(Date.now() - 15 * 60 * 1000)
      },
      {
        task_name: 'Performance Monitoring',
        status: 'SUCCESS',
        message: 'Performance metrics collected',
        details: { avg_response_time: '120ms', requests_per_min: 45, error_rate: '0.2%' },
        duration_ms: 1200,
        run_time: new Date(Date.now() - 5 * 60 * 1000)
      }
    ]

    // Insert logs
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i]
      const logId = `log_${i + 1}_${Date.now()}`
      await db.$executeRaw`
        INSERT INTO automation_logs (id, task_name, status, message, details, duration_ms, run_time)
        VALUES (${logId}, ${log.task_name}, ${log.status}, ${log.message}, ${JSON.stringify(log.details)}, ${log.duration_ms}, ${log.run_time})
      `
    }

    console.log('✅ Automation tasks seeded successfully!')
    console.log(`📊 Created ${tasks.length} tasks and ${logs.length} logs`)

  } catch (error) {
    console.error('❌ Error seeding automation tasks:', error)
  } finally {
    await db.$disconnect()
  }
}

// Run the seeding
seedAutomationTasks()