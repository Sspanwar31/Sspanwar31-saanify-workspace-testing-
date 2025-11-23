#!/bin/bash

# Deployment Script for Saanify Management System
# This script switches to production schema and deploys to Supabase

echo "🚀 Starting Saanify Deployment to Supabase..."

# Step 1: Switch to production schema
echo "📋 Switching to production schema..."
cp prisma/schema-prod.prisma prisma/schema.prisma

# Step 2: Update environment for production
echo "🔧 Updating environment for production..."
cat > .env << EOF
# Production (Supabase)
DATABASE_URL="\$DATABASE_URL"
NEXTAUTH_SECRET="\$NEXTAUTH_SECRET"

# Vercel Environment
VERCEL_URL="saanify-workspace.vercel.app"
VERCEL_ENV="production"
NODE_ENV="production"
EOF

# Step 3: Run Supabase migration
echo "🗄️ Running Supabase migration..."
npm run supabase:migrate

# Step 4: Switch back to development schema
echo "🔄 Switching back to development schema..."
cp prisma/schema-dev.prisma prisma/schema.prisma

# Step 5: Update environment for development
echo "🔧 Updating environment for development..."
cat > .env << EOF
# Local Development (SQLite)
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="saanify-super-secret-key-2024"

# Production (Supabase) - Uncomment for Vercel deployment
# DATABASE_URL="postgresql://username:password@hostname:5432/database?sslmode=require"

# Vercel Environment
VERCEL_URL="saanify-workspace.vercel.app"
VERCEL_ENV="development"
NODE_ENV="development"
EOF

echo "✅ Deployment completed successfully!"
echo "🌐 Live at: https://saanify-workspace.vercel.app"
echo "🔑 Super Admin: superadmin@saanify.com / admin123"