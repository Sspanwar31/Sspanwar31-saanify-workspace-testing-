// Test script to check if automation changes are working
console.log('🔍 Testing SuperAdmin Automation Changes...');

// Test 1: Check if page loads with new elements
const checkPageElements = () => {
  const automationSection = document.querySelector('[data-testid="automation-section"]');
  const apiStatusIndicator = document.querySelector('[data-testid="api-status"]');
  const loadingStates = document.querySelector('.animate-spin');
  
  console.log('📋 Page Elements Check:');
  console.log('  - Automation Section:', automationSection ? '✅ Found' : '❌ Not Found');
  console.log('  - API Status Indicator:', apiStatusIndicator ? '✅ Found' : '❌ Not Found');
  console.log('  - Loading States:', loadingStates ? '✅ Found' : '❌ Not Found');
};

// Test 2: Check network requests
const checkNetworkRequests = () => {
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('/api/superadmin/automation')) {
      console.log('🌐 Automation API Call:', url);
    }
    return originalFetch.apply(this, args);
  };
};

// Test 3: Check for console errors
const checkConsoleErrors = () => {
  const originalError = console.error;
  console.error = function(...args) {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('automation')) {
      console.log('🚨 Automation Error:', args);
    }
    originalError.apply(this, args);
  };
};

// Run tests
checkPageElements();
checkNetworkRequests();
checkConsoleErrors();

console.log('✅ Test script loaded. Open SuperAdmin panel and check Automation tab.');