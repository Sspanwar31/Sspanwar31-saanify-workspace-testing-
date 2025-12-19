import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface GLMLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  component: string;
  action: string;
  message: string;
  details?: any;
  userId?: string;
  sessionId?: string;
}

interface Alert {
  id: string;
  timestamp: string;
  level: 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  component: string;
  action?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("x-glm-token");
    if (token !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { action, ...data } = body;

    if (action === "log") {
      return await createLog(data);
    } else if (action === "alert") {
      return await createAlert(data);
    } else if (action === "resolve-alert") {
      return await resolveAlert(data.alertId);
    } else if (action === "clear-logs") {
      return await clearLogs(data.component);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Logging system failed:", error);
    return NextResponse.json({ error: "Logging system failed" }, { status: 500 });
  }
}

async function createLog(logData: Partial<GLMLog>): Promise<NextResponse> {
  try {
    const log: GLMLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level: logData.level || 'info',
      component: logData.component || 'unknown',
      action: logData.action || 'unknown',
      message: logData.message || '',
      details: logData.details,
      userId: logData.userId,
      sessionId: logData.sessionId
    };

    // Save log to file
    await saveLogToFile(log);

    // Check if this log should trigger an alert
    if (log.level === 'error' || log.level === 'warn') {
      await checkForAlert(log);
    }

    // Console output with formatting
    const consoleMessage = `[${log.timestamp}] ${log.level.toUpperCase()} [${log.component}] ${log.action}: ${log.message}`;
    
    switch (log.level) {
      case 'error':
        console.error(`❌ ${consoleMessage}`, log.details || '');
        break;
      case 'warn':
        console.warn(`⚠️ ${consoleMessage}`, log.details || '');
        break;
      case 'success':
        console.log(`✅ ${consoleMessage}`, log.details || '');
        break;
      default:
        console.log(`ℹ️ ${consoleMessage}`, log.details || '');
    }

    return NextResponse.json({
      status: "success",
      message: "Log created successfully",
      logId: log.id,
      timestamp: log.timestamp
    });

  } catch (error) {
    console.error("Failed to create log:", error);
    return NextResponse.json({
      status: "failed",
      message: "Failed to create log",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

async function createAlert(alertData: Partial<Alert>): Promise<NextResponse> {
  try {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level: alertData.level || 'warning',
      title: alertData.title || 'System Alert',
      message: alertData.message || '',
      component: alertData.component || 'unknown',
      action: alertData.action,
      resolved: false
    };

    // Save alert to file
    await saveAlertToFile(alert);

    // Console output for critical alerts
    const alertMessage = `🚨 ALERT [${alert.level.toUpperCase()}] ${alert.title}: ${alert.message}`;
    
    switch (alert.level) {
      case 'critical':
        console.error(`🔴 ${alertMessage}`);
        break;
      case 'error':
        console.error(`🟠 ${alertMessage}`);
        break;
      default:
        console.warn(`🟡 ${alertMessage}`);
    }

    // In a real implementation, this might send notifications
    await sendNotification(alert);

    return NextResponse.json({
      status: "success",
      message: "Alert created successfully",
      alertId: alert.id,
      timestamp: alert.timestamp
    });

  } catch (error) {
    console.error("Failed to create alert:", error);
    return NextResponse.json({
      status: "failed",
      message: "Failed to create alert",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

async function resolveAlert(alertId: string): Promise<NextResponse> {
  try {
    const alertsDir = 'alerts';
    const alertFile = path.join(alertsDir, `${alertId}.json`);
    
    if (!fs.existsSync(alertFile)) {
      return NextResponse.json({
        status: "failed",
        message: "Alert not found"
      }, { status: 404 });
    }

    const alert: Alert = JSON.parse(fs.readFileSync(alertFile, 'utf-8'));
    alert.resolved = true;
    alert.resolvedAt = new Date().toISOString();

    fs.writeFileSync(alertFile, JSON.stringify(alert, null, 2));

    console.log(`✅ Alert resolved: ${alertId} - ${alert.title}`);

    return NextResponse.json({
      status: "success",
      message: "Alert resolved successfully",
      alertId,
      resolvedAt: alert.resolvedAt
    });

  } catch (error) {
    console.error("Failed to resolve alert:", error);
    return NextResponse.json({
      status: "failed",
      message: "Failed to resolve alert",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

async function clearLogs(component?: string): Promise<NextResponse> {
  try {
    const logsDir = 'logs';
    if (!fs.existsSync(logsDir)) {
      return NextResponse.json({
        status: "success",
        message: "No logs to clear"
      });
    }

    const logFiles = fs.readdirSync(logsDir);
    let deletedCount = 0;

    for (const file of logFiles) {
      if (file.endsWith('.json')) {
        if (component) {
          // Only clear logs for specific component
          const logPath = path.join(logsDir, file);
          const logData = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
          
          if (logData.component === component) {
            fs.unlinkSync(logPath);
            deletedCount++;
          }
        } else {
          // Clear all logs
          fs.unlinkSync(path.join(logsDir, file));
          deletedCount++;
        }
      }
    }

    console.log(`🧹 Cleared ${deletedCount} log files`);

    return NextResponse.json({
      status: "success",
      message: `Cleared ${deletedCount} log files`,
      deletedCount,
      component: component || 'all'
    });

  } catch (error) {
    console.error("Failed to clear logs:", error);
    return NextResponse.json({
      status: "failed",
      message: "Failed to clear logs",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

async function saveLogToFile(log: GLMLog): Promise<void> {
  try {
    const logsDir = 'logs';
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logFile = path.join(logsDir, `${log.id}.json`);
    fs.writeFileSync(logFile, JSON.stringify(log, null, 2));

    // Also append to daily log file
    const today = new Date().toISOString().split('T')[0];
    const dailyLogFile = path.join(logsDir, `${today}.jsonl`);
    
    const logLine = JSON.stringify(log) + '\n';
    fs.appendFileSync(dailyLogFile, logLine);

  } catch (error) {
    console.error("Failed to save log to file:", error);
  }
}

async function saveAlertToFile(alert: Alert): Promise<void> {
  try {
    const alertsDir = 'alerts';
    if (!fs.existsSync(alertsDir)) {
      fs.mkdirSync(alertsDir, { recursive: true });
    }
    
    const alertFile = path.join(alertsDir, `${alert.id}.json`);
    fs.writeFileSync(alertFile, JSON.stringify(alert, null, 2));

  } catch (error) {
    console.error("Failed to save alert to file:", error);
  }
}

async function checkForAlert(log: GLMLog): Promise<void> {
  try {
    // Define alert conditions
    const alertConditions = [
      {
        condition: (log: GLMLog) => log.level === 'error' && log.component === 'migration',
        level: 'error' as const,
        title: 'Migration Failed',
        message: `Migration error in ${log.action}: ${log.message}`
      },
      {
        condition: (log: GLMLog) => log.level === 'error' && log.component === 'database',
        level: 'critical' as const,
        title: 'Database Error',
        message: `Database connection issue: ${log.message}`
      },
      {
        condition: (log: GLMLog) => log.level === 'warn' && log.component === 'ui-check',
        level: 'warning' as const,
        title: 'UI Issues Detected',
        message: `UI stability issues: ${log.message}`
      }
    ];

    for (const condition of alertConditions) {
      if (condition.condition(log)) {
        await createAlert({
          level: condition.level,
          title: condition.title,
          message: condition.message,
          component: log.component,
          action: log.action
        });
        break; // Only create one alert per log
      }
    }

  } catch (error) {
    console.error("Failed to check for alerts:", error);
  }
}

async function sendNotification(alert: Alert): Promise<void> {
  try {
    // In a real implementation, this might send:
    // - Email notifications
    // - Slack messages
    // - Discord notifications
    // - SMS alerts (for critical)
    
    console.log(`📢 Notification sent for alert: ${alert.title}`);
    
    // For now, just log it
    const notification = {
      alertId: alert.id,
      timestamp: new Date().toISOString(),
      message: `Notification sent for ${alert.level} alert: ${alert.title}`
    };
    
    const notificationsDir = 'notifications';
    if (!fs.existsSync(notificationsDir)) {
      fs.mkdirSync(notificationsDir, { recursive: true });
    }
    
    const notificationFile = path.join(notificationsDir, `${alert.id}.json`);
    fs.writeFileSync(notificationFile, JSON.stringify(notification, null, 2));

  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("x-glm-token");
    if (token !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const component = searchParams.get('component');
    const level = searchParams.get('level');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (type === 'alerts') {
      return await getAlerts(level, limit);
    } else {
      return await getLogs(component, level, limit);
    }

  } catch (error) {
    console.error("Failed to retrieve logs:", error);
    return NextResponse.json({ error: "Failed to retrieve logs" }, { status: 500 });
  }
}

async function getLogs(component?: string | null, level?: string | null, limit: number = 50): Promise<NextResponse> {
  try {
    const logsDir = 'logs';
    if (!fs.existsSync(logsDir)) {
      return NextResponse.json({
        status: "success",
        logs: [],
        total: 0
      });
    }

    const logFiles = fs.readdirSync(logsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const logPath = path.join(logsDir, file);
        const logData = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
        return logData;
      })
      .filter(log => {
        if (component && log.component !== component) return false;
        if (level && log.level !== level) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({
      status: "success",
      logs: logFiles,
      total: logFiles.length,
      filters: { component, level, limit }
    });

  } catch (error) {
    console.error("Failed to get logs:", error);
    return NextResponse.json({ error: "Failed to get logs" }, { status: 500 });
  }
}

async function getAlerts(level?: string | null, limit: number = 50): Promise<NextResponse> {
  try {
    const alertsDir = 'alerts';
    if (!fs.existsSync(alertsDir)) {
      return NextResponse.json({
        status: "success",
        alerts: [],
        total: 0
      });
    }

    const alertFiles = fs.readdirSync(alertsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const alertPath = path.join(alertsDir, file);
        const alertData = JSON.parse(fs.readFileSync(alertPath, 'utf-8'));
        return alertData;
      })
      .filter(alert => {
        if (level && alert.level !== level) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    const unresolvedCount = alertFiles.filter(alert => !alert.resolved).length;

    return NextResponse.json({
      status: "success",
      alerts: alertFiles,
      total: alertFiles.length,
      unresolved: unresolvedCount,
      filters: { level, limit }
    });

  } catch (error) {
    console.error("Failed to get alerts:", error);
    return NextResponse.json({ error: "Failed to get alerts" }, { status: 500 });
  }
}