#!/bin/bash

# Test Migration API Endpoint (Next.js App Router Format)
# This script tests the fixed API endpoint

echo "🧪 Testing Next.js App Router API endpoint..."

# Check if NEXTAUTH_SECRET is set
if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ NEXTAUTH_SECRET is not set in environment"
    echo "Please set it and try again"
    exit 1
fi

echo "📡 Testing POST request to /api/run-migrations..."

# Test the API endpoint with curl
curl -X POST http://localhost:3000/api/run-migrations \
  -H "Content-Type: application/json" \
  -H "x-run-migrations-token: $NEXTAUTH_SECRET" \
  -d '{}' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "✅ API endpoint test completed!"
echo ""
echo "📝 Expected response:"
echo "- Status: 200 (success) or 500 (migration errors)"
echo "- Response: {\"message\": \"Migration and seed completed successfully\"}"
echo ""
echo "🚀 After Vercel deployment, test with:"
echo "curl -X POST https://<your-vercel-domain>/api/run-migrations \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"x-run-migrations-token: <your-NEXTAUTH_SECRET>\" \\"
echo "  -d '{}'"