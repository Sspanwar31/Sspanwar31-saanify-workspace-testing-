# Automation Suite Documentation

## Overview

The Saanify Workspace Automation Suite is a comprehensive, secure automation system designed for SuperAdmin users to manage database operations, backups, and system maintenance tasks. The system provides a production-ready infrastructure for automated database management with full audit logging and security controls.

## Architecture

### Core Components

1. **Database Layer** - PostgreSQL with Supabase
2. **API Layer** - Next.js server-side routes
3. **Authentication** - JWT-based with SUPERADMIN role enforcement
4. **UI Layer** - React-based SuperAdmin dashboard
5. **Scheduling** - Cron-based task execution
6. **Storage** - Supabase Storage for backup files

### Security Model

- **Service Role Access**: All server operations use `SUPABASE_SERVICE_ROLE_KEY`
- **SUPERADMIN Enforcement**: Middleware validates SUPERADMIN role for all automation routes
- **RLS Policies**: Row Level Security for tenant data isolation
- **Audit Logging**: All operations logged to `automation_logs` table
- **No Client Secrets**: Service keys never exposed to client-side code

## Environment Variables

### Required Variables

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_public_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key

# Setup Configuration
SETUP_MODE=true|false
SETUP_KEY=your_setup_key
SETUP_ADMIN_EMAIL=admin@example.com
SETUP_ADMIN_PASSWORD=secure_password

# Optional Configuration
AUTOMATION_ADMIN_TOKEN=automation_token_for_cli
NEXTAUTH_SECRET=your_nextauth_secret
JWT_SECRET=your_jwt_secret
```

## Database Schema

### Automation Tables

#### `automation_tasks`
```sql
CREATE TABLE automation_tasks (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    task_name text NOT NULL UNIQUE,
    schedule text,
    enabled boolean DEFAULT true,
    last_run timestamptz,
    next_run timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

#### `automation_logs`
```sql
CREATE TABLE automation_logs (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    task_name text NOT NULL,
    status text NOT NULL CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
    message text,
    details jsonb,
    duration_ms integer,
    run_time timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

#### `secrets`
```sql
CREATE TABLE secrets (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key text NOT NULL UNIQUE,
    value text,
    last_rotated timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);
```

#### `automation_meta`
```sql
CREATE TABLE automation_meta (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key text NOT NULL UNIQUE,
    value jsonb,
    created_at timestamptz DEFAULT now()
);
```

### Application Tables

#### `users`
```sql
CREATE TABLE users (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email text NOT NULL UNIQUE,
    name text,
    role text DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'SUPERADMIN')),
    society_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

#### `societies`
```sql
CREATE TABLE societies (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name text NOT NULL,
    address text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

## API Endpoints

### Authentication Required
All endpoints require either:
- Bearer token with SUPERADMIN role
- Valid session cookie
- AUTOMATION_ADMIN_TOKEN for CLI access

### Core Endpoints

#### System Status
```
GET /api/super-admin/automation/status
```
Returns current system status, tasks, and recent logs.

#### Health Check
```
GET /api/super-admin/automation/health
```
Comprehensive system health check including database, storage, tables, and automation.

#### Task Execution
```
POST /api/super-admin/automation/run
{
  "task": "task_name"
}
```
Manually execute a specific automation task.

#### Schema Synchronization
```
POST /api/super-admin/automation/schema-sync
```
Trigger database schema synchronization and validation.

#### Auto Data Sync
```
POST /api/super-admin/automation/auto-sync
```
Trigger automatic data synchronization.

#### Backup Operations
```
POST /api/super-admin/automation/backup-now
```
Create an immediate backup of all data.

#### Restore Operations
```
POST /api/super-admin/automation/restore
Content-Type: multipart/form-data
- file: backup file (.json, .sql, .tar.gz)
- preview: true|false
- confirm: true|false
```

#### System Initialization
```
POST /api/super-admin/automation/initialize
{
  "setup_key": "setup_key"
}
```
Initialize the automation system and create required tables.

#### Logs
```
GET /api/super-admin/automation/logs?page=1&limit=20&task_name=task&status=status
```
Retrieve paginated logs with optional filtering.

#### Cron Runner
```
POST /api/super-admin/automation/cron
```
Execute cron runner for scheduled tasks.

## RPC Functions

### Database Functions

#### `create_missing_tables()`
Creates all required tables if they don't exist.

```sql
SELECT public.create_missing_tables();
```

#### `validate_db()`
Validates database structure and returns status report.

```sql
SELECT public.validate_db();
```

#### `sync_schema()`
Synchronizes database schema and tracks changes.

```sql
SELECT public.sync_schema();
```

#### `run_backup()`
Initiates backup process and returns job ID.

```sql
SELECT public.run_backup();
```

#### `auto_sync_data()`
Triggers automatic data synchronization.

```sql
SELECT public.auto_sync_data();
```

#### `health_check()`
Performs comprehensive system health check.

```sql
SELECT public.health_check();
```

## Scheduling and Cron

### Default Task Schedules

| Task | Schedule | Description |
|------|----------|-------------|
| schema_sync | 0 2 * * * | Daily at 2:00 AM |
| auto_sync_data | */30 * * * * | Every 30 minutes |
| backup | 0 3 * * * | Daily at 3:00 AM |
| health_check | */15 * * * * | Every 15 minutes |

### Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/super-admin/automation/cron",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

## Backup and Restore

### Backup Process

1. **Data Collection**: Extract data from all tables
2. **Metadata Creation**: Generate backup metadata with counts and timestamps
3. **File Creation**: Create JSON backup file
4. **Storage Upload**: Upload to Supabase Storage bucket `automated-backups`
5. **Logging**: Record backup operation in automation logs

### Restore Process

1. **File Upload**: User uploads backup file through UI
2. **Validation**: Validate file structure and content
3. **Preview**: Show what will be restored (optional)
4. **Confirmation**: Require explicit confirmation
5. **Execution**: Perform restore operation
6. **Logging**: Record restore operation in automation logs

### Backup File Format

```json
{
  "metadata": {
    "backup_id": "unique-id",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "tables": [
      {"name": "users", "record_count": 100},
      {"name": "societies", "record_count": 10}
    ],
    "total_records": 110,
    "file_size": 1024000,
    "schema_version": "1.0",
    "created_by": "automation_system"
  },
  "data": {
    "users": [...],
    "societies": [...]
  }
}
```

## Security Considerations

### Access Control

1. **Middleware Enforcement**: All `/super-admin/*` routes protected by middleware
2. **Role Validation**: Database role verification for SUPERADMIN
3. **Service Role Only**: Server operations use service role key only
4. **No Client Exposure**: Service keys never sent to client

### Data Protection

1. **RLS Policies**: Row Level Security for tenant data
2. **Audit Logging**: All operations logged with user context
3. **Backup Encryption**: Backups stored in secure Supabase Storage
4. **Input Validation**: All inputs validated and sanitized

### Best Practices

1. **Regular Backups**: Automated daily backups
2. **Key Rotation**: Regular rotation of service keys
3. **Access Review**: Periodic review of SUPERADMIN access
4. **Monitoring**: Continuous health monitoring and alerting

## Deployment

### Initial Setup

1. **Environment Variables**: Configure all required environment variables
2. **Database Setup**: Execute RPC functions in Supabase SQL Editor
3. **Storage Bucket**: Create `automated-backups` bucket in Supabase Storage
4. **Initial User**: Create initial SUPERADMIN user if using setup mode

### Database Initialization

Execute the following in Supabase SQL Editor as service role:

```sql
-- Execute automation-rpcs.sql content
-- This will create all tables, indexes, and RPC functions
```

### Vercel Deployment

1. **Environment Variables**: Add all required variables to Vercel project
2. **Cron Jobs**: Configure Vercel cron for automated execution
3. **Domain Setup**: Configure custom domain if needed
4. **Monitoring**: Set up Vercel analytics and monitoring

## Testing

### Test Scripts

Located in `/scripts/automation-tests/`:

1. **first_time_setup.sh**: Tests initial system setup
2. **run_all_tasks.sh**: Tests all automation tasks
3. **backup_restore_test.sh**: Tests backup and restore functionality

### Running Tests

```bash
# Make scripts executable (if permissions allow)
chmod +x scripts/automation-tests/*.sh

# Run first time setup test
./scripts/automation-tests/first_time_setup.sh

# Run all tasks test
./scripts/automation-tests/run_all_tasks.sh

# Run backup/restore test
./scripts/automation-tests/backup_restore_test.sh
```

### Test Requirements

- Local development server running on port 3000
- Valid authentication token (test_admin_token or valid session)
- Supabase project configured with required tables
- Storage bucket `automated-backups` created

## Monitoring and Maintenance

### Health Monitoring

- **Automated Health Checks**: Every 15 minutes
- **Database Connectivity**: Continuous monitoring
- **Storage Status**: Regular storage bucket checks
- **Task Execution**: Monitor task success/failure rates

### Log Management

- **Log Retention**: Keep logs for 90 days
- **Log Rotation**: Automatic cleanup of old logs
- **Error Tracking**: Monitor error patterns and frequencies
- **Performance Metrics**: Track task execution times

### Maintenance Tasks

- **Backup Cleanup**: Remove old backups (configurable retention)
- **Schema Updates**: Handle schema migrations gracefully
- **Performance Optimization**: Regular performance tuning
- **Security Updates**: Keep dependencies updated

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Check environment variables
   - Verify user role in database
   - Validate token format

2. **Task Failures**
   - Check automation logs for error details
   - Verify database connectivity
   - Review RPC function permissions

3. **Backup Issues**
   - Verify storage bucket permissions
   - Check available storage space
   - Review backup file format

4. **Cron Issues**
   - Verify Vercel cron configuration
   - Check cron runner logs
   - Validate task schedules

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=automation:*
```

### Support

For issues and support:

1. Check automation logs first
2. Review system health status
3. Verify environment configuration
4. Consult this documentation
5. Contact system administrator

## API Reference

### Response Format

All API responses follow this format:

```json
{
  "success": true|false,
  "message": "Human readable message",
  "data": {...}, // Optional
  "error": "Error details", // Optional
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Insufficient permissions |
| 400 | Bad Request - Invalid input parameters |
| 500 | Internal Server Error - System failure |

### Rate Limiting

- **API Requests**: 100 requests per minute per user
- **Backup Operations**: 5 per hour per user
- **Restore Operations**: 10 per day per user

## Future Enhancements

### Planned Features

1. **Advanced Scheduling**: More sophisticated cron patterns
2. **Multi-Region Backups**: Geographic backup distribution
3. **Real-time Monitoring**: WebSocket-based real-time updates
4. **Custom Tasks**: User-defined automation tasks
5. **Integration APIs**: External system integrations
6. **Advanced Analytics**: Detailed performance analytics
7. **Mobile Support**: Mobile-responsive UI
8. **CLI Tools**: Command-line interface for automation

### Scalability Considerations

1. **Horizontal Scaling**: Multiple worker instances
2. **Queue Management**: Task queue for high-volume operations
3. **Caching**: Redis caching for frequently accessed data
4. **Load Balancing**: Distribute load across multiple instances
5. **Database Optimization**: Query optimization and indexing

---

This documentation covers the complete automation system implementation. For specific implementation details, refer to the source code and inline documentation.