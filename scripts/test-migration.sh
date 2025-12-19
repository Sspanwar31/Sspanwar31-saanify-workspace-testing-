#!/bin/bash

# Test Migration Script for Vercel Deployment
# This script helps test the migration API endpoint

echo "🧪 Testing Supabase + Prisma Migration API..."

# Check if required environment variables are set
if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ NEXTAUTH_SECRET is not set"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
    exit 1
fi

# Test the migration endpoint
echo "📡 Calling migration API endpoint..."
curl -X POST http://localhost:3000/api/run-migrations \
  -H "Content-Type: application/json" \
  -H "x-run-migrations-token: $NEXTAUTH_SECRET" \
  -d '{}'

echo ""
echo "✅ Migration test completed!"