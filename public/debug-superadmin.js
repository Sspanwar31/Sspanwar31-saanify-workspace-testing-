// Debug script to check ADMIN page functionality
console.log('🔍 ADMIN Debug Script Loaded');

// Function to check if automation tab exists and is clickable
function checkSuperAdminPage() {
  console.log('🔍 Checking ADMIN Page...');
  
  // Check if navigation items exist
  const navItems = document.querySelectorAll('button');
  console.log('📋 Navigation buttons found:', navItems.length);
  
  // Look for automation button
  let automationButton = null;
  navItems.forEach((button, index) => {
    const text = button.textContent?.toLowerCase() || '';
    console.log(`Button ${index}: "${text}"`);
    
    if (text.includes('automation')) {
      automationButton = button;
      console.log('✅ Found Automation button:', button);
    }
  });
  
  if (automationButton) {
    console.log('🎯 Automation button found, clicking it...');
    automationButton.click();
    
    // Wait a bit and check if automation section appears
    setTimeout(() => {
      const automationSection = document.querySelector('[data-testid*="automation"]');
      const apiStatus = document.querySelector('*:contains("Connected")');
      
      console.log('📊 After clicking automation:');
      console.log('  - Automation section:', automationSection ? '✅ Found' : '❌ Not Found');
      console.log('  - API Status:', apiStatus ? '✅ Found' : '❌ Not Found');
      
      // Look for any automation-related content
      const pageContent = document.body.textContent || '';
      const hasAutomation = pageContent.toLowerCase().includes('automation');
      const hasConnected = pageContent.toLowerCase().includes('connected');
      const hasTasks = pageContent.toLowerCase().includes('database & cron');
      
      console.log('🔍 Page Content Analysis:');
      console.log('  - Contains "automation":', hasAutomation);
      console.log('  - Contains "connected":', hasConnected);
      console.log('  - Contains "database & cron":', hasTasks);
      
    }, 1000);
    
  } else {
    console.log('❌ Automation button not found!');
    
    // Try to find it by looking for specific text
    const allElements = document.querySelectorAll('*');
    allElements.forEach((element, index) => {
      if (element.textContent && element.textContent.includes('Automation')) {
        console.log(`Found element with "Automation":`, element);
      }
    });
  }
}

// Auto-run when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkSuperAdminPage);
} else {
  checkSuperAdminPage();
}

console.log('🚀 Debug script ready. Run checkSuperAdminPage() to start.');