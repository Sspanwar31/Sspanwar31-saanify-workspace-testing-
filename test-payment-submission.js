// Test script to check payment submission
const fs = require('fs');
const path = require('path');

async function testPaymentSubmission() {
  try {
    // Create a test image file
    const testImagePath = path.join(__dirname, 'test-payment-image.png');
    const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, testImageData);
    
    // Create form data
    const FormData = require('form-data');
    const form = new FormData();
    
    form.append('plan', 'basic');
    form.append('amount', '4000');
    form.append('transactionId', 'TEST_TXN_' + Date.now());
    form.append('paymentMethod', 'UPI');
    form.append('payerName', 'Test User');
    form.append('payerEmail', 'test@example.com');
    form.append('payerPhone', '1234567890');
    form.append('notes', 'Test payment');
    form.append('screenshot', fs.createReadStream(testImagePath), 'test-payment.png');
    
    // Get auth token (you'll need to log in first)
    const response = await fetch('http://localhost:3000/api/subscription/submit-payment', {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Cookie': 'auth-token=YOUR_AUTH_TOKEN_HERE' // Replace with actual token
      },
      body: form
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', result);
    
    // Clean up test file
    fs.unlinkSync(testImagePath);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testPaymentSubmission();
}