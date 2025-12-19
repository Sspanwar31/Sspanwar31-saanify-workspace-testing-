// Test script to verify screenshot URL formatting
import { formatScreenshotUrl, createFullScreenshotUrl } from '../src/lib/screenshot-utils.js'

console.log('Testing screenshot URL formatting...')

// Test cases
const testCases = [
  '/uploads/payment-proofs/1764338893228_Screenshot (1).png', // Already correct
  '1764338893228_Screenshot (1).png', // Just filename
  'http://localhost:3000/uploads/payment-proofs/test.png', // Full URL
  null, // Null case
  undefined, // Undefined case
  '', // Empty string
]

console.log('\n=== Testing formatScreenshotUrl ===')
testCases.forEach((testCase, index) => {
  const result = formatScreenshotUrl(testCase)
  console.log(`Test ${index + 1}:`, {
    input: testCase,
    output: result,
    status: result ? '✅ Success' : '❌ Null/Invalid'
  })
})

console.log('\n=== Testing createFullScreenshotUrl ===')
const validCases = testCases.filter(tc => tc && tc !== '' && tc !== null && tc !== undefined)
validCases.forEach((testCase, index) => {
  const result = createFullScreenshotUrl(testCase)
  console.log(`Test ${index + 1}:`, {
    input: testCase,
    output: result,
    status: result ? '✅ Success' : '❌ Failed'
  })
})

console.log('\n=== Test completed ===')