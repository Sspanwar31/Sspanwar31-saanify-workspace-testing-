#!/usr/bin/env node

/**
 * Simple GLM System Test (No Auth Required)
 */

const http = require('http');

const config = {
  baseUrl: 'http://localhost:3000',
  timeout: 10000
};

function log(message, color = '') {
  console.log(`${message}${color}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), '');
  log(`🧪 ${title}`, '');
  log('='.repeat(60), '');
}

async function testEndpoint(name, endpoint) {
  try {
    log(`⏳ ${name}: Testing...`, '');
    
    const response = await fetch(`${config.baseUrl}${endpoint}`);
    
    if (response.ok) {
      log(`✅ ${name}: Status ${response.status}`, '');
      return { success: true };
    } else {
      log(`❌ ${name}: Status ${response.status}`, '');
      return { success: false };
    }
  } catch (error) {
    log(`❌ ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`, '');
    return { success: false };
  }
}

async function runBasicTests() {
  log('🧪 Basic GLM System Structure Test', '');
  log(`Target: ${config.baseUrl}`, '');
  
  const tests = [
    ['API Health', '/api/health'],
    ['Landing Page', '/'],
    ['Login Page', '/login'],
    ['GLM Env Sync Status', '/api/glm/env-sync'],
    ['GLM Migration Status', '/api/glm/migrate'],
    ['GLM UI Check Status', '/api/glm/ui-check'],
    ['GLM Recovery Status', '/api/glm/recovery'],
    ['GLM Deploy Status', '/api/glm/deploy'],
    ['GLM Logs Status', '/api/glm/logs'],
    ['GLM Master Status', '/api/glm/master'],
    ['Run Migrations (Legacy)', '/api/run-migrations']
  ];

  let passed = 0;
  let total = tests.length;

  for (const [name, endpoint] of tests) {
    const result = await testEndpoint(name, endpoint);
    if (result.success) passed++;
  }

  logSection('Results Summary');
  log(`Total Tests: ${total}`, '');
  log(`Passed: ${passed}`, '');
  log(`Failed: ${total - passed}`, '');
  log(`Success Rate: ${Math.round((passed / total) * 100)}%`, '');

  if (passed === total) {
    log('🎉 All endpoints are accessible! System structure is correct.', '');
  } else {
    log('⚠️ Some endpoints are not accessible, but this may be due to auth requirements.', '');
  }

  return passed === total;
}

runBasicTests();