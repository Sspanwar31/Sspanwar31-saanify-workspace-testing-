#!/usr/bin/env node

/**
 * GLM Automation System Test Script
 * 
 * This script tests all components of the GLM automation system
 * to ensure everything is working correctly.
 */

const https = require('https');
const http = require('http');

const config = {
  baseUrl: process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000',
  token: process.env.NEXTAUTH_SECRET,
  timeout: 30000
};

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`🧪 ${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logTest(test, status, message = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏳';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`${icon} ${test}: ${message}`, color);
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
        'User-Agent': 'GLM-Test-Script/1.0'
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

async function testEndpoint(name, endpoint, method = 'GET', data = null, expectedStatus = 200) {
  try {
    logTest(name, 'progress', 'Testing...');
    const response = await makeRequest(endpoint, method, data);
    
    if (response.status === expectedStatus) {
      logTest(name, 'pass', `Status ${response.status}`);
      return { success: true, data: response.data };
    } else {
      logTest(name, 'fail', `Status ${response.status}, expected ${expectedStatus}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    logTest(name, 'fail', error instanceof Error ? error.message : 'Unknown error');
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function runTests() {
  log('🧪 GLM Automation System Test Suite Starting...', 'bright');
  log(`Target: ${config.baseUrl}`, 'blue');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  // Test 1: Basic Health Check
  logSection('Basic Health Checks');
  
  let result = await testEndpoint('API Health', '/api/health');
  results.total++; results.details.push(result);
  if (result.success) results.passed++; else results.failed++;

  // Test 2: Environment Sync
  logSection('Environment Management');
  
  result = await testEndpoint('Environment Status', '/api/glm/env-sync');
  results.total++; results.details.push(result);
  if (result.success) results.passed++; else results.failed++;

  result = await testEndpoint('Environment Sync', '/api/glm/env-sync', 'POST', { action: 'sync' });
  results.total++; results.details.push(result);
  if (result.success) results.passed++; else results.failed++;

  // Test 3: Migration System
  logSection('Migration System');
  
  result = await testEndpoint('Migration Status', '/api/glm/migrate');
  results.total++; results.details.push(result);
  if (result.success) results.passed++; else results.failed++;

  result = await testEndpoint('Migration Run', '/api/glm/migrate', 'POST', { action: 'full-migrate' });
  results.total++; results.details.push(result);
  if (result.success) results.passed++; else results.failed++;

  // Test 4: UI Check System
  logSection('UI Stability System');
  
  result = await testEndpoint('UI Status', '/api/glm/ui-check');
  results.total++; results.details.push(result);
  if (result.success) results.passed++; else results.failed++;

  result = await testEndpoint('UI Check All', '/api/glm/ui-check', 'POST', { action: 'check-all' });
  results.total++; results.details.push(result);
  if (result.success) results.passed++; else results.failed++;

  // Test 5: Recovery System
  logSection('Recovery System');
  
  result = await testEndpoint('Recovery Status', '/api/glm/recovery');
  results.total++; results.details.push(result);
  if (result.success) results.passed++; else results.failed++;

  result = await testEndpoint('Create Backup', '/api/glm/recovery', 'POST', { action: 'create-backup' });
  results.total++; results.details.push(result);
  if (result.success) results.passed++; else results.failed++;

  // Test 6: Deploy System
  logSection('Deployment System');
  
  result = await testEndpoint('Deploy Status', '/api/glm/deploy');
  results.total++; results.details.push(result);
  if (result.success) results.passed++; else results.failed++;

  result = await testEndpoint('Analyze Changes', '/api/glm/deploy', 'POST', { action: 'analyze-changes' });
  results.total++; results.details.push(result);
  if (result.success) results.passed++; else results.failed++;

  // Test 7: Logging System
  logSection('Logging System');
  
  result = await testEndpoint('Logs Status', '/api/glm/logs');
  results.total++; results.details.push(result);
  if (result.success) results.passed++; else results.failed++;

  result = await testEndpoint('Create Log', '/api/glm/logs', 'POST', {
    action: 'log',
    level: 'info',
    component: 'test',
    action: 'test-run',
    message: 'GLM test suite execution'
  });
  results.total++; results.details.push(result);
  if (result.success) results.passed++; else results.failed++;

  // Test 8: Master Control
  logSection('Master Control System');
  
  result = await testEndpoint('Master Status', '/api/glm/master');
  results.total++; results.details.push(result);
  if (result.success) results.passed++; else results.failed++;

  result = await testEndpoint('System Health', '/api/glm/master', 'POST', { action: 'health-check' });
  results.total++; results.details.push(result);
  if (result.success) results.passed++; else results.failed++;

  result = await testEndpoint('System Status', '/api/glm/master', 'POST', { action: 'system-status' });
  results.total++; results.details.push(result);
  if (result.success) results.passed++; else results.failed++;

  // Test 9: Legacy Endpoints
  logSection('Legacy Endpoints');
  
  result = await testEndpoint('Run Migrations (Legacy)', '/api/run-migrations', 'POST', {});
  results.total++; results.details.push(result);
  if (result.success) results.passed++; else results.failed++;

  // Results Summary
  logSection('Test Results Summary');
  
  const successRate = Math.round((results.passed / results.total) * 100);
  
  log(`Total Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, 'red');
  log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');

  // Failed Tests Details
  if (results.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    results.details.forEach((test, index) => {
      if (!test.success) {
        log(`  ${index + 1}. ${test.error}`, 'red');
      }
    });
  }

  // Overall Status
  logSection('Overall System Status');
  
  if (successRate === 100) {
    log('🎉 All tests passed! System is fully operational.', 'green');
  } else if (successRate >= 80) {
    log('✅ System is mostly operational with minor issues.', 'yellow');
  } else if (successRate >= 60) {
    log('⚠️ System has significant issues that need attention.', 'yellow');
  } else {
    log('❌ System has critical issues and needs immediate attention.', 'red');
  }

  // Recommendations
  log('\n📋 Recommendations:', 'cyan');
  if (results.failed > 0) {
    log('1. Check the failed tests above', 'blue');
    log('2. Verify environment variables are set correctly', 'blue');
    log('3. Ensure database is accessible', 'blue');
    log('4. Check server logs for detailed error information', 'blue');
  } else {
    log('1. System is ready for automated deployments', 'green');
    log('2. You can use: npm run deploy:glm', 'green');
    log('3. Monitor the system regularly', 'blue');
  }

  return successRate >= 80;
}

// Main execution
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };