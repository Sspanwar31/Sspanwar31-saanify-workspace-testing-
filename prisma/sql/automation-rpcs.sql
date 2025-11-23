-- Automation Suite RPC Functions
-- Execute these as SERVICE_ROLE in Supabase SQL Editor

-- Create missing tables function
CREATE OR REPLACE FUNCTION public.create_missing_tables()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    tables_created text[];
    tables_existing text[];
BEGIN
    -- Create automation_tasks table
    BEGIN
        CREATE TABLE IF NOT EXISTS public.automation_tasks (
            id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
            task_name text NOT NULL UNIQUE,
            schedule text,
            enabled boolean DEFAULT true,
            last_run timestamptz,
            next_run timestamptz,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_automation_tasks_enabled ON public.automation_tasks(enabled);
        CREATE INDEX IF NOT EXISTS idx_automation_tasks_next_run ON public.automation_tasks(next_run);
        CREATE INDEX IF NOT EXISTS idx_automation_tasks_task_name ON public.automation_tasks(task_name);
        
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'automation_tasks' AND schemaname = 'public') THEN
            tables_created := array_append(tables_created, 'automation_tasks');
        ELSE
            tables_existing := array_append(tables_existing, 'automation_tasks');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating automation_tasks: %', SQLERRM;
    END;

    -- Create automation_logs table
    BEGIN
        CREATE TABLE IF NOT EXISTS public.automation_logs (
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
        
        CREATE INDEX IF NOT EXISTS idx_automation_logs_task_name ON public.automation_logs(task_name);
        CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON public.automation_logs(status);
        CREATE INDEX IF NOT EXISTS idx_automation_logs_run_time ON public.automation_logs(run_time);
        
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'automation_logs' AND schemaname = 'public') THEN
            tables_created := array_append(tables_created, 'automation_logs');
        ELSE
            tables_existing := array_append(tables_existing, 'automation_logs');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating automation_logs: %', SQLERRM;
    END;

    -- Create secrets table
    BEGIN
        CREATE TABLE IF NOT EXISTS public.secrets (
            id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
            key text NOT NULL UNIQUE,
            value text,
            last_rotated timestamptz DEFAULT now(),
            created_at timestamptz DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_secrets_key ON public.secrets(key);
        
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'secrets' AND schemaname = 'public') THEN
            tables_created := array_append(tables_created, 'secrets');
        ELSE
            tables_existing := array_append(tables_existing, 'secrets');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating secrets: %', SQLERRM;
    END;

    -- Create automation_meta table
    BEGIN
        CREATE TABLE IF NOT EXISTS public.automation_meta (
            id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
            key text NOT NULL UNIQUE,
            value jsonb,
            created_at timestamptz DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_automation_meta_key ON public.automation_meta(key);
        
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'automation_meta' AND schemaname = 'public') THEN
            tables_created := array_append(tables_created, 'automation_meta');
        ELSE
            tables_existing := array_append(tables_existing, 'automation_meta');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating automation_meta: %', SQLERRM;
    END;

    -- Create minimal users table if not exists
    BEGIN
        CREATE TABLE IF NOT EXISTS public.users (
            id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
            email text NOT NULL UNIQUE,
            name text,
            role text DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'SUPERADMIN')),
            society_id text,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
        CREATE INDEX IF NOT EXISTS idx_users_society_id ON public.users(society_id);
        
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public') THEN
            tables_created := array_append(tables_created, 'users');
        ELSE
            tables_existing := array_append(tables_existing, 'users');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating users: %', SQLERRM;
    END;

    -- Create minimal societies table if not exists
    BEGIN
        CREATE TABLE IF NOT EXISTS public.societies (
            id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
            name text NOT NULL,
            address text,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_societies_name ON public.societies(name);
        
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'societies' AND schemaname = 'public') THEN
            tables_created := array_append(tables_created, 'societies');
        ELSE
            tables_existing := array_append(tables_existing, 'societies');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating societies: %', SQLERRM;
    END;

    -- Enable RLS on user tables
    BEGIN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error enabling RLS: %', SQLERRM;
    END;

    -- Create RLS policies for users table
    BEGIN
        DROP POLICY IF EXISTS users_select_own ON public.users;
        CREATE POLICY users_select_own ON public.users
            FOR SELECT USING (auth.uid()::text = id);
            
        DROP POLICY IF EXISTS users_update_own ON public.users;
        CREATE POLICY users_update_own ON public.users
            FOR UPDATE USING (auth.uid()::text = id);
            
        DROP POLICY IF EXISTS users_service_role ON public.users;
        CREATE POLICY users_service_role ON public.users
            FOR ALL USING (current_setting('app.current_role', true) = 'service_role');
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating user RLS policies: %', SQLERRM;
    END;

    -- Create RLS policies for automation tables (service role only)
    BEGIN
        ALTER TABLE public.automation_tasks ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.automation_meta ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS automation_tasks_service_role ON public.automation_tasks;
        CREATE POLICY automation_tasks_service_role ON public.automation_tasks
            FOR ALL USING (current_setting('app.current_role', true) = 'service_role');
            
        DROP POLICY IF EXISTS automation_logs_service_role ON public.automation_logs;
        CREATE POLICY automation_logs_service_role ON public.automation_logs
            FOR ALL USING (current_setting('app.current_role', true) = 'service_role');
            
        DROP POLICY IF EXISTS secrets_service_role ON public.secrets;
        CREATE POLICY secrets_service_role ON public.secrets
            FOR ALL USING (current_setting('app.current_role', true) = 'service_role');
            
        DROP POLICY IF EXISTS automation_meta_service_role ON public.automation_meta;
        CREATE POLICY automation_meta_service_role ON public.automation_meta
            FOR ALL USING (current_setting('app.current_role', true) = 'service_role');
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating automation RLS policies: %', SQLERRM;
    END;

    -- Insert default automation tasks
    BEGIN
        INSERT INTO public.automation_tasks (task_name, schedule, enabled) 
        VALUES 
            ('schema_sync', '0 2 * * *', true),  -- Daily at 2 AM
            ('auto_sync_data', '*/30 * * * *', true),  -- Every 30 minutes
            ('backup', '0 3 * * *', true),  -- Daily at 3 AM
            ('health_check', '*/15 * * * *', true)  -- Every 15 minutes
        ON CONFLICT (task_name) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error inserting default tasks: %', SQLERRM;
    END;

    SELECT json_build_object(
        'success', true,
        'tables_created', tables_created,
        'tables_existing', tables_existing,
        'message', 'Tables created/verified successfully'
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Validate database function
CREATE OR REPLACE FUNCTION public.validate_db()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    table_status jsonb := '{}'::jsonb;
    required_tables text[] := ARRAY['automation_tasks', 'automation_logs', 'secrets', 'automation_meta', 'users', 'societies'];
    table_name text;
    table_exists boolean;
    row_count bigint;
BEGIN
    FOREACH table_name IN ARRAY required_tables
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = table_name AND schemaname = 'public'
        ) INTO table_exists;
        
        IF table_exists THEN
            EXECUTE format('SELECT count(*) FROM %I', table_name) INTO row_count;
            table_status := table_status || jsonb_build_object(
                table_name, jsonb_build_object(
                    'exists', true,
                    'row_count', row_count
                )
            );
        ELSE
            table_status := table_status || jsonb_build_object(
                table_name, jsonb_build_object(
                    'exists', false,
                    'row_count', 0
                )
            );
        END IF;
    END LOOP;
    
    SELECT json_build_object(
        'success', true,
        'table_status', table_status,
        'validated_at', now()
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Schema sync function
CREATE OR REPLACE FUNCTION public.sync_schema()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    schema_hash text;
    stored_hash text;
    changed boolean := false;
BEGIN
    -- Calculate current schema hash (simplified)
    SELECT md5(string_agg(column_name || data_type || is_nullable, ',' ORDER BY column_name, table_name))
    INTO schema_hash
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name IN ('automation_tasks', 'automation_logs', 'secrets', 'automation_meta', 'users', 'societies');
    
    -- Get stored hash
    SELECT value::text INTO stored_hash
    FROM public.automation_meta 
    WHERE key = 'schema_hash';
    
    -- Compare hashes
    IF stored_hash IS NULL OR stored_hash != schema_hash THEN
        changed := true;
        
        -- Update stored hash
        INSERT INTO public.automation_meta (key, value)
        VALUES ('schema_hash', to_jsonb(schema_hash))
        ON CONFLICT (key) DO UPDATE SET value = to_jsonb(schema_hash);
        
        -- Log schema change
        INSERT INTO public.automation_logs (task_name, status, message, details)
        VALUES ('schema_sync', 'success', 'Schema changed and synced', 
                jsonb_build_object('old_hash', stored_hash, 'new_hash', schema_hash));
    END IF;
    
    SELECT json_build_object(
        'success', true,
        'changed', changed,
        'schema_hash', schema_hash,
        'synced_at', now()
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Run backup function
CREATE OR REPLACE FUNCTION public.run_backup()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    job_id text;
BEGIN
    job_id := gen_random_uuid()::text;
    
    -- Insert backup job log
    INSERT INTO public.automation_logs (id, task_name, status, message, details)
    VALUES (job_id, 'backup', 'running', 'Backup job started', 
            jsonb_build_object('job_id', job_id, 'initiated_at', now()));
    
    SELECT json_build_object(
        'success', true,
        'job_id', job_id,
        'message', 'Backup job initiated',
        'started_at', now()
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Auto sync data function
CREATE OR REPLACE FUNCTION public.auto_sync_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    job_id text;
BEGIN
    job_id := gen_random_uuid()::text;
    
    -- Insert auto sync job log
    INSERT INTO public.automation_logs (id, task_name, status, message, details)
    VALUES (job_id, 'auto_sync_data', 'running', 'Auto sync job started', 
            jsonb_build_object('job_id', job_id, 'initiated_at', now()));
    
    SELECT json_build_object(
        'success', true,
        'job_id', job_id,
        'message', 'Auto sync job initiated',
        'started_at', now()
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Health check function
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    db_status boolean;
    table_counts jsonb := '{}'::jsonb;
    table_name text;
    row_count bigint;
BEGIN
    -- Check database connectivity
    SELECT true INTO db_status;
    
    -- Get table counts
    FOREACH table_name IN ARRAY ARRAY['automation_tasks', 'automation_logs', 'secrets', 'automation_meta', 'users', 'societies']
    LOOP
        BEGIN
            EXECUTE format('SELECT count(*) FROM %I', table_name) INTO row_count;
            table_counts := table_counts || jsonb_build_object(table_name, row_count);
        EXCEPTION WHEN OTHERS THEN
            table_counts := table_counts || jsonb_build_object(table_name, -1);
        END;
    END LOOP;
    
    SELECT json_build_object(
        'success', true,
        'database', jsonb_build_object('connected', db_status),
        'table_counts', table_counts,
        'checked_at', now()
    ) INTO result;
    
    RETURN result;
END;
$$;