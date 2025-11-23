# Supabase Migration Guide (Vercel-Based)

This project runs Prisma migrations using Vercel environment variables only.

### ⚙️ Required Vercel Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- DATABASE_URL
- NEXTAUTH_URL
- NEXTAUTH_SECRET (used as run-migration security token)

### 🚀 Run Migration via API
After deploy, trigger this endpoint (replace domain):

POST https://<your-vercel-domain>/api/run-migrations
Headers:
x-run-migrations-token: <NEXTAUTH_SECRET value>

### 🧭 Checklist
1. Confirm all above env vars exist in Vercel.
2. Deploy updated repo → Vercel will auto-build.
3. Run `/api/run-migrations` manually once via Postman or curl.
4. Check Supabase tables — verify seed admin exists.
5. Login to frontend using:  
   Email: superadmin@example.com  
   Password: admin123