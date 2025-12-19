// Test script for payment mode functionality
const testPaymentMode = async () => {
  console.log('🧪 Testing Payment Mode API...\n');

  try {
    // Test GET request to fetch current payment mode
    console.log('1. Testing GET /api/admin/payment-mode');
    const getResponse = await fetch('http://localhost:3000/api/admin/payment-mode');
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ GET Response:', getData);
      console.log(`   Current mode: ${getData.mode}`);
      console.log(`   Available modes: ${getData.available?.join(', ')}`);
    } else {
      console.log('❌ GET Request failed:', getResponse.status, getResponse.statusText);
    }

    console.log('\n2. Testing POST /api/admin/payment-mode');
    
    // Test POST request to update payment mode to MANUAL
    console.log('   Testing MANUAL mode...');
    const postResponseManual = await fetch('http://localhost:3000/api/admin/payment-mode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 'MANUAL' }),
    });

    if (postResponseManual.ok) {
      const postData = await postResponseManual.json();
      console.log('✅ MANUAL mode set:', postData);
    } else {
      console.log('❌ MANUAL mode failed:', postResponseManual.status, postResponseManual.statusText);
    }

    // Test POST request to update payment mode to RAZORPAY
    console.log('   Testing RAZORPAY mode...');
    const postResponseRazorpay = await fetch('http://localhost:3000/api/admin/payment-mode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 'RAZORPAY' }),
    });

    if (postResponseRazorpay.ok) {
      const postData = await postResponseRazorpay.json();
      console.log('✅ RAZORPAY mode set:', postData);
    } else {
      console.log('❌ RAZORPAY mode failed:', postResponseRazorpay.status, postResponseRazorpay.statusText);
    }

    // Test invalid mode
    console.log('   Testing INVALID mode...');
    const postResponseInvalid = await fetch('http://localhost:3000/api/admin/payment-mode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 'INVALID' }),
    });

    if (postResponseInvalid.ok) {
      console.log('❌ INVALID mode should have failed but passed');
    } else {
      const errorData = await postResponseInvalid.json();
      console.log('✅ INVALID mode correctly rejected:', errorData);
    }

    console.log('\n3. Final verification - GET request again');
    const finalGetResponse = await fetch('http://localhost:3000/api/admin/payment-mode');
    
    if (finalGetResponse.ok) {
      const finalData = await finalGetResponse.json();
      console.log('✅ Final state:', finalData);
    } else {
      console.log('❌ Final GET failed:', finalGetResponse.status, finalGetResponse.statusText);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure the development server is running on http://localhost:3000');
  }
};

// Run the test
testPaymentMode();