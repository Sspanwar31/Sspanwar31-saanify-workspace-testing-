#!/usr/bin/env node

/**
 * GLM Health Check Script - System Verification
 * 
 * This script verifies:
 * - API health endpoints
 * - Database connectivity
 * - Environment variables
 * - UI accessibility
 * - System readiness
 * 
 * Usage: npm run health:glm
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
          process.env[key.trim()] = values.join('=').trim();
        }
      }
    });
  }
}

// Load environment variables at start
loadEnvFile();

// Configuration
const config = {
  logsDir: 'logs',
  timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
  healthId: `health-${Date.now()}`
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Logger utility
class Logger {
  constructor(healthId) {
    this.healthId = healthId;
    this.logFile = path.join(config.logsDir, `health-${config.timestamp}.log`);
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(config.logsDir)) {
      fs.mkdirSync(config.logsDir, { recursive: true });
    }
  }

  log(message, level = 'INFO', color = 'reset') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    // Console output
    console.log(`${colors[color]}${logEntry}${colors.reset}`);
    
    // File output
    try {
      fs.appendFileSync(this.logFile, logEntry + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  info(message) { this.log(message, 'INFO', 'blue'); }
  success(message) { this.log(message, 'SUCCESS', 'green'); }
  warning(message) { this.log(message, 'WARNING', 'yellow'); }
  error(message) { this.log(message, 'ERROR', 'red'); }
  step(message) { this.log(message, 'STEP', 'cyan'); }
}

// Health check utility
class HealthChecker {
  constructor(logger) {
    this.logger = logger;
    this.results = {
      environment: { status: 'unknown', details: {} },
      database: { status: 'unknown', details: {} },
      api: { status: 'unknown', details: {} },
      ui: { status: 'unknown', details: {} },
      filesystem: { status: 'unknown', details: {} }
    };
  }

  async checkEnvironment() {
    this.logger.step('Checking environment variables...');
    
    try {
      const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
      const optionalVars = ['VERCEL_URL', 'VERCEL_ENV', 'NODE_ENV'];
      const missing = [];
      const present = [];

      requiredVars.forEach(varName => {
        if (process.env[varName]) {
          present.push(varName);
        } else {
          missing.push(varName);
        }
      });

      optionalVars.forEach(varName => {
        if (process.env[varName]) {
          present.push(varName);
        }
      });

      this.results.environment = {
        status: missing.length === 0 ? 'healthy' : 'unhealthy',
        details: {
          required: { present, missing },
          optional: optionalVars.filter(v => process.env[v]),
          total: present.length + missing.length
        }
      };

      if (missing.length === 0) {
        this.logger.success(`Environment variables OK (${present.length} present)`);
      } else {
        this.logger.error(`Missing required variables: ${missing.join(', ')}`);
      }

      return this.results.environment.status === 'healthy';
    } catch (error) {
      this.logger.error(`Environment check failed: ${error.message}`);
      this.results.environment.status = 'error';
      return false;
    }
  }

  async checkDatabase() {
    this.logger.step('Checking database connectivity...');
    
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // Test connection
      await prisma.$connect();
      
      // Get basic stats
      const userCount = await prisma.user.count();
      const societyCount = await prisma.societyAccount.count();
      
      await prisma.$disconnect();

      this.results.database = {
        status: 'healthy',
        details: {
          connection: 'ok',
          users: userCount,
          societies: societyCount,
          totalRecords: userCount + societyCount
        }
      };

      this.logger.success(`Database OK (${userCount} users, ${societyCount} societies)`);
      return true;
    } catch (error) {
      this.logger.error(`Database check failed: ${error.message}`);
      this.results.database = {
        status: 'unhealthy',
        details: {
          connection: 'failed',
          error: error.message
        }
      };
      return false;
    }
  }

  async checkAPI() {
    this.logger.step('Checking API endpoints...');
    
    try {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';

      const endpoints = [
        { path: '/api/health', method: 'GET' },
        { path: '/api/run-migrations', method: 'POST' }
      ];

      const results = [];

      for (const endpoint of endpoints) {
        try {
          const options = {
            method: endpoint.method,
            headers: endpoint.method === 'POST' ? { 'Content-Type': 'application/json' } : {}
          };

          const response = await fetch(`${baseUrl}${endpoint.path}`, options);
          
          results.push({
            endpoint: endpoint.path,
            status: response.status,
            ok: response.ok
          });

          if (response.ok) {
            this.logger.success(`API ${endpoint.path}: ${response.status}`);
          } else {
            this.logger.warning(`API ${endpoint.path}: ${response.status}`);
          }
        } catch (error) {
          results.push({
            endpoint: endpoint.path,
            status: 'error',
            error: error.message
          });
          this.logger.warning(`API ${endpoint.path}: ${error.message}`);
        }
      }

      const healthyCount = results.filter(r => r.ok).length;
      const totalCount = results.length;

      this.results.api = {
        status: healthyCount === totalCount ? 'healthy' : healthyCount > 0 ? 'degraded' : 'unhealthy',
        details: {
          endpoints: results,
          successRate: Math.round((healthyCount / totalCount) * 100)
        }
      };

      return healthyCount > 0;
    } catch (error) {
      this.logger.error(`API check failed: ${error.message}`);
      this.results.api = {
        status: 'unhealthy',
        details: {
          error: error.message
        }
      };
      return false;
    }
  }

  async checkUI() {
    this.logger.step('Checking UI accessibility...');
    
    try {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';

      const routes = ['/', '/login', '/admin', '/client'];
      const results = [];

      for (const route of routes) {
        try {
          const response = await fetch(`${baseUrl}${route}`);
          
          results.push({
            route,
            status: response.status,
            ok: response.ok
          });

          if (response.ok) {
            this.logger.success(`UI ${route}: ${response.status}`);
          } else {
            this.logger.warning(`UI ${route}: ${response.status}`);
          }
        } catch (error) {
          results.push({
            route,
            status: 'error',
            error: error.message
          });
          this.logger.warning(`UI ${route}: ${error.message}`);
        }
      }

      const healthyCount = results.filter(r => r.ok).length;
      const totalCount = results.length;

      this.results.ui = {
        status: healthyCount === totalCount ? 'healthy' : healthyCount > 0 ? 'degraded' : 'unhealthy',
        details: {
          routes: results,
          successRate: Math.round((healthyCount / totalCount) * 100)
        }
      };

      return healthyCount > 0;
    } catch (error) {
      this.logger.error(`UI check failed: ${error.message}`);
      this.results.ui = {
        status: 'unhealthy',
        details: {
          error: error.message
        }
      };
      return false;
    }
  }

  async checkFilesystem() {
    this.logger.step('Checking filesystem structure...');
    
    try {
      const requiredPaths = [
        'package.json',
        'next.config.ts',
        'tailwind.config.ts',
        'tsconfig.json',
        'prisma/schema.prisma',
        'src/app/page.tsx',
        'src/app/layout.tsx',
        'scripts/deploy-glm.js',
        'scripts/restore-glm.js'
      ];

      const existing = [];
      const missing = [];

      requiredPaths.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          existing.push(filePath);
        } else {
          missing.push(filePath);
        }
      });

      // Check directories
      const requiredDirs = ['logs', 'backups', 'src/app/api'];
      const existingDirs = [];
      const missingDirs = [];

      requiredDirs.forEach(dirPath => {
        if (fs.existsSync(dirPath)) {
          existingDirs.push(dirPath);
        } else {
          missingDirs.push(dirPath);
        }
      });

      this.results.filesystem = {
        status: missing.length === 0 && missingDirs.length === 0 ? 'healthy' : 'degraded',
        details: {
          files: { existing, missing },
          directories: { existing: existingDirs, missing: missingDirs },
          totalFiles: requiredPaths.length,
          totalDirs: requiredDirs.length
        }
      };

      if (missing.length === 0 && missingDirs.length === 0) {
        this.logger.success(`Filesystem OK (${existing.length} files, ${existingDirs.length} dirs)`);
      } else {
        this.logger.warning(`Missing ${missing.length} files, ${missingDirs.length} directories`);
      }

      return missing.length === 0;
    } catch (error) {
      this.logger.error(`Filesystem check failed: ${error.message}`);
      this.results.filesystem = {
        status: 'error',
        details: {
          error: error.message
        }
      };
      return false;
    }
  }

  async checkPrisma() {
    this.logger.step('Checking Prisma setup...');
    
    try {
      // Check if Prisma client can be generated
      execSync('npx prisma generate', { stdio: 'pipe' });
      
      // Check if schema is valid
      execSync('npx prisma validate', { stdio: 'pipe' });
      
      this.logger.success('Prisma setup OK');
      return true;
    } catch (error) {
      this.logger.error(`Prisma check failed: ${error.message}`);
      return false;
    }
  }

  async runAllChecks() {
    this.logger.info('🔍 Starting comprehensive health check...');
    
    const checks = [
      { name: 'Environment', fn: () => this.checkEnvironment() },
      { name: 'Filesystem', fn: () => this.checkFilesystem() },
      { name: 'Prisma', fn: () => this.checkPrisma() },
      { name: 'Database', fn: () => this.checkDatabase() },
      { name: 'API', fn: () => this.checkAPI() },
      { name: 'UI', fn: () => this.checkUI() }
    ];

    const results = [];
    
    for (const check of checks) {
      try {
        const result = await check.fn();
        results.push({ name: check.name, success: result });
      } catch (error) {
        results.push({ name: check.name, success: false, error: error.message });
      }
    }

    return this.generateReport(results);
  }

  generateReport(results) {
    const healthy = results.filter(r => r.success).length;
    const total = results.length;
    const healthScore = Math.round((healthy / total) * 100);

    const overallStatus = healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'degraded' : 'unhealthy';

    const report = {
      timestamp: new Date().toISOString(),
      healthId: config.healthId,
      overallStatus,
      healthScore,
      checks: results,
      details: this.results
    };

    // Save report
    const reportFile = path.join(config.logsDir, `health-report-${config.timestamp}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    return report;
  }
}

// Main execution
async function main() {
  const logger = new Logger(config.healthId);
  const healthChecker = new HealthChecker(logger);

  try {
    const report = await healthChecker.runAllChecks();
    
    console.log('\n' + '='.repeat(60));
    console.log('🏥 GLM Health Check Report');
    console.log('='.repeat(60));
    console.log(`📊 Overall Status: ${report.overallStatus.toUpperCase()}`);
    console.log(`💯 Health Score: ${report.healthScore}%`);
    console.log(`🕐 Timestamp: ${report.timestamp}`);
    console.log(`🆔 Check ID: ${report.healthId}`);
    
    console.log('\n📋 Check Results:');
    report.checks.forEach(check => {
      const icon = check.success ? '✅' : '❌';
      console.log(`${icon} ${check.name}`);
    });

    console.log('\n📁 Detailed Report:', path.join(config.logsDir, `health-report-${config.timestamp}.json`));

    if (report.overallStatus === 'healthy') {
      console.log('\n🎉 System is healthy and ready for deployment!');
      process.exit(0);
    } else if (report.overallStatus === 'degraded') {
      console.log('\n⚠️ System has some issues but may still work');
      process.exit(1);
    } else {
      console.log('\n❌ System has critical issues that need attention');
      process.exit(1);
    }

  } catch (error) {
    logger.error(`Health check failed: ${error.message}`);
    console.error('\n💥 Critical error during health check:', error.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection:', reason);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { HealthChecker };