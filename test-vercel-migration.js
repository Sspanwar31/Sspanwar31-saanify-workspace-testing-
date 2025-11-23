// Test script for /api/run-migrations endpoint
// Usage: node test-vercel-migration.js

const http = require('http');

const testData = {
  // Replace with your actual NEXTAUTH_SECRET from Vercel env vars
  token: process.env.NEXTAUTH_SECRET || 'your-secret-key',
  url: 'http://localhost:3000/api/run-migrations'
};

const postData = JSON.stringify({});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/run-migrations',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'x-run-migrations-token': testData.token
  }
};

console.log('🧪 Testing /api/run-migrations endpoint...');
console.log('🔑 Token:', testData.token ? '✅ Set' : '❌ Missing');

const req = http.request(options, (res) => {
  console.log(`📊 Status Code: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📦 Response:', data);
    try {
      const parsed = JSON.parse(data);
      if (res.statusCode === 200) {
        console.log('✅ Success:', parsed.message);
      } else {
        console.log('❌ Error:', parsed.error);
      }
    } catch (e) {
      console.log('❌ Invalid JSON response');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
});

req.write(postData);
req.end();

console.log('📤 Request sent...');