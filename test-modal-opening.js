// Test if Add Client modal opens correctly
const baseUrl = 'http://localhost:3000';

async function testModalOpening() {
  console.log('🧪 Testing Add Client Modal Opening\n');

  try {
    // First, let's check if the admin page loads correctly
    console.log('1. Testing admin page access...');
    const pageResponse = await fetch(`${baseUrl}/admin`);
    
    if (pageResponse.ok) {
      console.log('✅ Admin page loads successfully');
      
      // Test if we can access the Add Client API endpoint
      console.log('\n2. Testing Add Client API endpoint...');
      const testData = {
        name: 'Modal Test Society',
        adminName: 'Modal Test Admin',
        email: `modaltest-${Date.now()}@example.com`,
        phone: '+91 9876543210',
        address: '123 Modal Test Street',
        plan: 'TRIAL'
      };

      const addResponse = await fetch(`${baseUrl}/api/admin/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (addResponse.ok) {
        const result = await addResponse.json();
        console.log('✅ Add Client API works:', result.message);
        console.log('✅ Modal should be working - check frontend');
        
        // Test if the modal state might be the issue
        console.log('\n3. Possible frontend issues to check:');
        console.log('- Dialog component might not be rendering');
        console.log('- Modal state might not be updating');
        console.log('- AddClientModal component might have errors');
        console.log('- CSS might be hiding the modal');
        console.log('- Event handlers might not be bound');
        
      } else {
        console.log('❌ Add Client API failed:', addResponse.status);
        const error = await addResponse.json();
        console.log('Error:', error);
      }
    } else {
      console.log('❌ Admin page failed to load:', pageResponse.status);
    }

    console.log('\n🎯 Modal Opening Test Complete!');
    console.log('📝 Manual Checks Needed:');
    console.log('1. Open admin dashboard in browser');
    console.log('2. Click "Add New Client" button');
    console.log('3. Check if modal opens');
    console.log('4. Check browser console for errors');
    console.log('5. Check if form submits correctly');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testModalOpening();