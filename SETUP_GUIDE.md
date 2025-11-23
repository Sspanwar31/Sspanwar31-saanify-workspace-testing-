# Saanify Setup Wizard

## Overview
The Saanify Setup Wizard provides a secure one-time initialization process for first-time deployments.

## Environment Variables Required

Add these environment variables to your `.env.local` or server environment:

```bash
# Enable setup mode (required for initial setup)
SETUP_MODE=true

# Secret setup key (required - generate your own secure key)
SETUP_KEY=your-secure-setup-key-here

# Supabase configuration (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Setup Process

### Step 1: Access Setup Wizard
1. Start your application with `SETUP_MODE=true`
2. Navigate to `/setup` in your browser
3. Enter your setup key and superadmin credentials

### Step 2: Database Initialization
The setup wizard will automatically:
- Create required tables (users, societies, roles)
- Insert default role permissions
- Create necessary indexes
- Set up proper relationships

### Step 3: Superadmin Creation
The wizard will:
- Create a superadmin user with provided email/password
- Hash passwords securely
- Insert user into database
- Attempt to create user in Supabase Auth (if available)

### Step 4: Completion
After successful setup:
- `SETUP_MODE` is automatically disabled
- `/setup` route becomes inaccessible
- User is redirected to `/auth/login`
- Superadmin can login with created credentials

## Security Features

### Setup Key Protection
- Server-side validation only (never exposed to client)
- Prevents unauthorized setup attempts
- Required for all setup operations

### Route Protection
- `/setup` only accessible when `SETUP_MODE=true`
- Automatic redirection when setup is disabled
- Middleware-level protection

### Input Validation
- Email format validation
- Password strength requirements (min 8 characters)
- Password confirmation matching
- Server-side validation for all inputs

### Database Security
- Password hashing using SHA-256 (upgrade to bcrypt in production)
- SQL injection prevention with parameterized queries
- Proper table relationships and constraints

## Manual Database Setup (Optional)

If the automatic setup fails, you can manually run the SQL:

```bash
# Using the provided SQL file
psql -h your-host -U your-user -d your-database -f setup-schema.sql
```

## Post-Setup Configuration

After setup completion:

### 1. Environment Cleanup
```bash
# Disable setup mode
SETUP_MODE=false

# Or remove the variable entirely
# SETUP_KEY=your-secure-setup-key-here
```

### 2. Verify Superadmin Access
- Navigate to `/auth/login`
- Login with created superadmin credentials
- Verify access to admin dashboard

### 3. Configure Society Settings
- Add society information
- Set up member roles
- Configure financial settings
- Customize platform settings

## Troubleshooting

### Setup Mode Not Working
1. Verify `SETUP_MODE=true` is set
2. Check server logs for errors
3. Ensure all required environment variables are set

### Database Connection Issues
1. Verify Supabase URL and keys
2. Check database connectivity
3. Run manual SQL setup if needed

### Permission Errors
1. Verify setup key matches exactly
2. Check server file permissions
3. Ensure no conflicting middleware

## Production Deployment

### Security Checklist
- [ ] Generate secure random `SETUP_KEY`
- [ ] Use HTTPS in production
- [ ] Set up proper database credentials
- [ ] Configure email service for notifications
- [ ] Set up backup systems
- [ ] Enable monitoring and logging

### Environment Configuration
```bash
# Production environment example
SETUP_MODE=true
SETUP_KEY=prod-secure-key-2024-xyz
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
NODE_ENV=production
```

## API Endpoints

### Setup Endpoint
- **URL**: `/api/setup`
- **Methods**: GET, POST
- **Protection**: Server-side `SETUP_MODE` validation
- **Authentication**: Setup key required

### Response Format
```json
// Success Response
{
  "success": true,
  "message": "Setup completed successfully",
  "redirectUrl": "/auth/login",
  "superadminCreated": {
    "email": "admin@example.com",
    "role": "superadmin"
  }
}

// Error Response
{
  "success": false,
  "error": "Error description"
}
```

## Support

For setup issues:
1. Check server logs: `npm run dev` or `npm run start`
2. Verify environment variables
3. Test database connectivity
4. Review setup documentation

## Security Notes

⚠️ **Important Security Guidelines**:

1. **Never expose SETUP_KEY to client-side code**
2. **Use a strong, random setup key**
3. **Disable SETUP_MODE after completion**
4. **Keep setup key confidential**
5. **Use HTTPS in production environments**
6. **Regularly rotate superadmin passwords**

## File Structure

```
src/app/api/setup/route.ts    # Setup API endpoint
src/app/setup/page.tsx        # Setup wizard UI
src/middleware.ts              # Route protection
setup-schema.sql              # Manual database schema
```

The setup wizard provides a secure, user-friendly initialization process for Saanify deployments.