#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Setting up Real Supabase Connection...');

// Create working Supabase connection template
const supabaseUrl = "postgresql://postgres.abc123:your-secure-password-here@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true";

const envContent = `# Real Supabase Production Configuration
DATABASE_URL="${supabaseUrl}"
NEXTAUTH_SECRET="saanify-super-secret-production-2024-secure-real-key"

# Vercel Production Environment
VERCEL_URL="saanify-workspace.vercel.app"
VERCEL_ENV="production"
NODE_ENV="production"

# Instructions:
# 1. Get your real Supabase credentials from Supabase dashboard
# 2. Replace 'your-secure-password-here' with actual password
# 3. Replace 'abc123' with actual user ID if different
# 4. Replace host with your actual Supabase project host
`;

fs.writeFileSync('.env', envContent);
console.log('✅ .env file updated with Supabase template');

console.log('\n📋 Next Steps:');
console.log('================');
console.log('1. Get your real Supabase credentials from: https://supabase.com/dashboard');
console.log('2. Go to Project Settings > Database > Connection string');
console.log('3. Copy the URI and replace the credentials in .env file');
console.log('4. Run: npx prisma migrate deploy');
console.log('5. Run: npm run seed');
console.log('================');

console.log('\n🎯 Setup template created. Please follow the instructions to connect to your real Supabase database.');