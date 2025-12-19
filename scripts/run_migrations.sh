#!/bin/bash
echo "🚀 Running database migrations with Prisma + Supabase..."

npx prisma migrate deploy
node scripts/create_admins.js

echo "✅ Migration and seed completed."