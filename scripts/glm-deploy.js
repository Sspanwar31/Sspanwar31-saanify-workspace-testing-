#!/usr/bin/env node

/**
 * GLM Auto-Deployment Script
 * 
 * This script automates the complete deployment process for the Saanify SaaS platform.
 * It handles environment sync, migrations, UI checks, and deployment verification.
 * 
 * Usage: npm run deploy:glm
 */

const https = require('https');
const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  baseUrl: process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000',
  token: process.env.NEXTAUTH_SECRET,
  timeout: 300000, // 5 minutes
  retries: 3
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logStep(step, status = 'info') {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    progress: '🔄'
  };
  
  const colorMap = {
    info: 'blue',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    progress: 'cyan'
  };
  
  log(`${icons[status]} ${step}`, colorMap[status]);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`🚀 ${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

async function makeRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, config.baseUrl);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-glm-token': config.token,
        'User-Agent': 'GLM-Deploy-Script/1.0'
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = httpModule.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(config.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function retryRequest(endpoint, method = 'GET', data = null, maxRetries = config.retries) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logStep(`Attempt ${attempt}/${maxRetries}: ${method} ${endpoint}`, 'progress');
      const response = await makeRequest(endpoint, method, data);
      
      if (response.status >= 200 && response.status < 300) {
        logStep(`Success: ${response.status}`, 'success');
        return response;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.data?.error || 'Unknown error'}`);
      }
    } catch (error) {
      lastError = error;
      logStep(`Attempt ${attempt} failed: ${error.message}`, 'warning');
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        log(`Waiting ${delay}ms before retry...`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

async function checkPrerequisites() {
  logSection('Checking Prerequisites');
  
  // Check environment variables
  if (!config.token) {
    logStep('NEXTAUTH_SECRET not found in environment', 'error');
    process.exit(1);
  }
  logStep('Environment variables validated', 'success');
  
  // Check if server is running
  try {
    const response = await makeRequest('/api/health');
    if (response.status === 200) {
      logStep('Server is running and accessible', 'success');
    } else {
      throw new Error(`Server health check failed: ${response.status}`);
    }
  } catch (error) {
    logStep(`Server not accessible: ${error.message}`, 'error');
    log('Please ensure the server is running with: npm run dev', 'yellow');
    process.exit(1);
  }
}

async function analyzeChanges() {
  logSection('Analyzing Changes');
  
  try {
    const response = await retryRequest('/api/glm/deploy?action=analyze-changes', 'POST');
    
    logStep('Changes analyzed successfully', 'success');
    log(`Schema changes: ${response.data.changes.schema ? 'Yes' : 'No'}`, 'blue');
    log(`API changes: ${response.data.changes.api ? 'Yes' : 'No'}`, 'blue');
    log(`UI changes: ${response.data.changes.ui ? 'Yes' : 'No'}`, 'blue');
    log(`Documentation changes: ${response.data.changes.docs ? 'Yes' : 'No'}`, 'blue');
    
    if (!response.data.shouldDeploy) {
      log('No deployment needed - only documentation changes', 'yellow');
      return false;
    }
    
    return response.data;
  } catch (error) {
    logStep(`Change analysis failed: ${error.message}`, 'error');
    throw error;
  }
}

async function syncEnvironment() {
  logSection('Syncing Environment');
  
  try {
    const response = await retryRequest('/api/glm/env-sync', 'POST', { action: 'sync' });
    
    logStep('Environment synchronized successfully', 'success');
    log(response.data.message, 'blue');
    
    return response.data;
  } catch (error) {
    logStep(`Environment sync failed: ${error.message}`, 'error');
    throw error;
  }
}

async function runMigrations() {
  logSection('Running Database Migrations');
  
  try {
    const response = await retryRequest('/api/glm/migrate', 'POST', { action: 'full-migrate' });
    
    logStep('Migrations completed successfully', 'success');
    log(response.data.message, 'blue');
    
    if (response.data.stats) {
      log(`Super Admins: ${response.data.stats.superAdmins}`, 'blue');
      log(`Clients: ${response.data.stats.clients}`, 'blue');
      log(`Societies: ${response.data.stats.societies}`, 'blue');
    }
    
    return response.data;
  } catch (error) {
    logStep(`Migration failed: ${error.message}`, 'error');
    throw error;
  }
}

async function checkUIStability() {
  logSection('Checking UI Stability');
  
  try {
    const response = await retryRequest('/api/glm/ui-check', 'POST', { action: 'check-all' });
    
    if (response.data.status === 'healthy') {
      logStep('All UI routes are healthy', 'success');
    } else if (response.data.status === 'degraded') {
      logStep('Some UI routes have minor issues', 'warning');
    } else {
      logStep('Critical UI issues detected', 'error');
      throw new Error('UI stability check failed');
    }
    
    log(response.data.message, 'blue');
    
    if (response.data.summary) {
      log(`Total routes: ${response.data.summary.total}`, 'blue');
      log(`Healthy: ${response.data.summary.healthy}`, 'green');
      log(`Degraded: ${response.data.summary.degraded}`, 'yellow');
      log(`Failed: ${response.data.summary.failed}`, 'red');
      log(`Avg response time: ${response.data.summary.avgResponseTime}ms`, 'blue');
    }
    
    return response.data;
  } catch (error) {
    logStep(`UI check failed: ${error.message}`, 'error');
    throw error;
  }
}

async function createBackup() {
  logSection('Creating Backup');
  
  try {
    const response = await retryRequest('/api/glm/recovery', 'POST', { action: 'create-backup' });
    
    logStep('Backup created successfully', 'success');
    log(response.data.message, 'blue');
    log(`Backup ID: ${response.data.backupId}`, 'blue');
    
    return response.data;
  } catch (error) {
    logStep(`Backup creation failed: ${error.message}`, 'warning');
    log('Continuing without backup...', 'yellow');
    return null;
  }
}

async function triggerDeployment(changes) {
  logSection('Triggering Deployment');
  
  try {
    const deployData = {
      action: 'trigger-deploy',
      trigger: {
        source: 'manual',
        changes: changes.changes
      }
    };
    
    const response = await retryRequest('/api/glm/deploy', 'POST', deployData);
    
    logStep('Deployment triggered successfully', 'success');
    log(response.data.message, 'blue');
    log(`Deploy ID: ${response.data.deployId}`, 'blue');
    
    if (response.data.deployLog) {
      log('\nDeployment Steps:', 'cyan');
      response.data.deployLog.steps.forEach((step, index) => {
        const statusIcon = {
          completed: '✅',
          failed: '❌',
          running: '🔄',
          pending: '⏳'
        }[step.status] || '❓';
        
        log(`${index + 1}. ${statusIcon} ${step.name}`, step.status === 'completed' ? 'green' : step.status === 'failed' ? 'red' : 'blue');
        
        if (step.output) {
          log(`   ${step.output}`, 'blue');
        }
      });
    }
    
    return response.data;
  } catch (error) {
    logStep(`Deployment failed: ${error.message}`, 'error');
    throw error;
  }
}

async function verifyDeployment() {
  logSection('Verifying Deployment');
  
  try {
    // Check overall system health
    const healthResponse = await makeRequest('/api/health');
    if (healthResponse.status !== 200) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    logStep('System health check passed', 'success');
    
    // Check migration status
    const migrationResponse = await makeRequest('/api/glm/migrate');
    if (migrationResponse.status !== 200) {
      throw new Error(`Migration status check failed: ${migrationResponse.status}`);
    }
    logStep('Migration status verified', 'success');
    
    // Check UI stability
    const uiResponse = await makeRequest('/api/glm/ui-check');
    if (uiResponse.status !== 200) {
      throw new Error(`UI check failed: ${uiResponse.status}`);
    }
    logStep('UI stability verified', 'success');
    
    log('🎉 Deployment verification completed successfully!', 'green');
    return true;
  } catch (error) {
    logStep(`Deployment verification failed: ${error.message}`, 'error');
    throw error;
  }
}

async function showSummary() {
  logSection('Deployment Summary');
  
  log('✅ Environment synchronized', 'green');
  log('✅ Database migrations completed', 'green');
  log('✅ UI stability verified', 'green');
  log('✅ Deployment triggered', 'green');
  log('✅ System verified', 'green');
  
  log('\n🎯 Next Steps:', 'cyan');
  log('1. Check your Vercel dashboard for deployment status', 'blue');
  log('2. Test the application at: ' + config.baseUrl, 'blue');
  log('3. Monitor logs for any issues', 'blue');
  
  log('\n📚 Useful Commands:', 'cyan');
  log('npm run dev                    - Start development server', 'blue');
  log('npm run build                  - Build for production', 'blue');
  log('npm run deploy:glm             - Run this deployment script', 'blue');
}

async function main() {
  const startTime = Date.now();
  
  try {
    log('🚀 GLM Auto-Deployment Script Starting...', 'bright');
    log(`Target: ${config.baseUrl}`, 'blue');
    log(`Timestamp: ${new Date().toISOString()}`, 'blue');
    
    // Check prerequisites
    await checkPrerequisites();
    
    // Analyze changes
    const changes = await analyzeChanges();
    if (!changes) {
      log('✅ No deployment needed - exiting gracefully', 'green');
      return;
    }
    
    // Create backup before making changes
    await createBackup();
    
    // Sync environment
    await syncEnvironment();
    
    // Run migrations if needed
    if (changes.changes.schema || changes.changes.api) {
      await runMigrations();
    }
    
    // Check UI stability
    await checkUIStability();
    
    // Trigger deployment
    await triggerDeployment(changes);
    
    // Verify deployment
    await verifyDeployment();
    
    // Show summary
    await showSummary();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    log(`\n⏱️ Total deployment time: ${duration}s`, 'green');
    
  } catch (error) {
    log(`\n❌ Deployment failed: ${error.message}`, 'error');
    
    // Attempt auto-recovery
    log('🔧 Attempting auto-recovery...', 'yellow');
    try {
      const recoveryResponse = await retryRequest('/api/glm/recovery', 'POST', { action: 'auto-recover' });
      log(recoveryResponse.data.message, recoveryResponse.data.status === 'recovered' ? 'green' : 'yellow');
    } catch (recoveryError) {
      log(`Auto-recovery failed: ${recoveryError.message}`, 'error');
    }
    
    log('\n📞 Next Steps:', 'cyan');
    log('1. Check the error logs for details', 'blue');
    log('2. Fix the reported issues', 'blue');
    log('3. Run this script again', 'blue');
    log('4. Contact support if issues persist', 'blue');
    
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`❌ Uncaught exception: ${error.message}`, 'error');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled rejection: ${reason}`, 'error');
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };